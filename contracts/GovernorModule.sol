    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.23;

    import "@openzeppelin/contracts/access/Ownable.sol";
    import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
    import "./KeyRegistry.sol"; // Assuming KeyRegistry.sol is in the same directory

    /**
     * @title GovernorModule
     * @dev Manages session keys and their allowances for executing specific actions
     * via a SmartAccount, using EIP-712 compliant signatures.
     * Relies on an external KeyRegistry for key attestation.
     * Incorporates fixes and improvements based on Audit #1 and Audit #2.
     */
    contract GovernorModule is Ownable {
        using ECDSA for bytes32;

        // --- EIP-712 Setup ---
        // Example TypeHash - Off-chain signer MUST use this structure or equivalent.
        // bytes32 internal constant SESSION_OPERATION_TYPEHASH = keccak256(
        //     "SessionOperation(address key,address token,address dest,uint128 spend,uint256 nonce,bytes32 executionHash)"
        // );
        // bytes32 internal DOMAIN_SEPARATOR; // Calculated in constructor if hashing on-chain

        // --- State ---
        KeyRegistry public immutable keyRegistry;

        struct Allowance {
            uint128 amount;
            uint48 expiry; // UNIX timestamp
            bool enabled;
        }

        // key => dest => token => Allowance
        mapping(address => mapping(address => mapping(address => Allowance))) public allowances;
        mapping(address => bool) public isSessionKey;
        // Nonce per session key, MUST be included in signed EIP-712 opHash externally
        mapping(address => uint256) public keyNonces;
        // Replay protection per (key, opHash) pair - defense in depth
        mapping(address => mapping(bytes32 => bool)) public keyUsedOpHashes;

        // --- Events ---
        event SessionKeyEnabled(address indexed key);
        event SessionKeyRevoked(address indexed key);
        event AllowanceSet(address indexed key, address indexed dest, address indexed token, uint128 amount, uint48 expiry);
        event AllowanceUsed(address indexed key, address indexed dest, address indexed token, uint128 amount, bytes32 opHash);
        event NonceIncreased(address indexed key, uint256 newNonce); // Added Event

        // --- Constructor ---
        constructor(address _registry) {
            require(_registry != address(0), "GM: Invalid registry address"); // Using GM: prefix
            keyRegistry = KeyRegistry(_registry);
            // If implementing full EIP-712 on-chain: _rebuildDomainSeparator();
        }

        // --- EIP-712 Helper Functions (Reference Only for Off-Chain) ---
        // ... (Commented out helpers remain for reference) ...

        // --- Core Logic ---

        /**
         * @notice Enables an attested session key.
         * @dev Callable only by the owner of this GovernorModule.
         * Key must be attested in the KeyRegistry first.
         * @param key The address of the session key to enable.
         */
        function enableSessionKey(address key) external onlyOwner {
            require(key != address(0), "GM: Invalid key address");
            require(keyRegistry.getKeyRegistrationStatus(key), "GM: Key not attested");
            require(!isSessionKey[key], "GM: Key already enabled"); // Prevent redundant events
            isSessionKey[key] = true;
            emit SessionKeyEnabled(key);
        }

        /**
         * @notice Revokes an enabled session key.
         * @dev Callable only by the owner of this GovernorModule.
         * Does not clear existing allowances (they will expire or can be manually cleared if needed).
         * @param key The address of the session key to revoke.
         */
        function revokeSessionKey(address key) external onlyOwner {
            require(key != address(0), "GM: Invalid key address");
            if (isSessionKey[key]) {
                isSessionKey[key] = false;
                // Note: Allowances are not automatically cleared due to gas cost concerns.
                // They will naturally expire or become unusable as isSessionKey[key] is false.
                emit SessionKeyRevoked(key);
            }
        }

        /**
         * @notice Sets or updates an allowance for a specific session key, destination, and token.
         * @dev Callable only by the owner of this GovernorModule.
         * Requires the session key to be currently enabled.
         * @param key The session key address receiving the allowance.
         * @param dest The destination address the key is allowed to interact with/send to.
         * @param token The ERC20 token address the key is allowed to spend.
         * @param amount The maximum amount of the token the key can spend.
         * @param expiry The UNIX timestamp when the allowance expires.
         */
        function setAllowance(address key, address dest, address token, uint128 amount, uint48 expiry) external onlyOwner {
            require(key != address(0), "GM: Invalid key address");
            require(token != address(0), "GM: Invalid token address");
            // dest can potentially be address(0) depending on use case, no check here.
            require(isSessionKey[key], "GM: Key not enabled");

            // Added Validation (User Suggestion / Audit #2 Follow-up)
            require(amount > 0, "GM: Amount must be > 0");
            require(expiry > block.timestamp, "GM: Expiry must be in the future");

            allowances[key][dest][token] = Allowance({amount: amount, expiry: expiry, enabled: true});
            emit AllowanceSet(key, dest, token, amount, expiry);
        }

        /**
         * @notice Pre-execution hook for session key operations. Validates EIP-712 signature and allowance.
         * @param opData Encoded allowance parameters (key, token, dest, spend) needed for the allowance check itself.
         * @param opHash The EIP-712 hash of a `SessionOperation` struct (or similar), calculated and signed off-chain.
         * @param signature The EIP-712 signature over `opHash` provided by the session key or owner.
         * @return gasCost Estimated gas cost (currently returns 0).
         * @dev See detailed comments below regarding EIP-712 requirements.
         *
         * @dev CRITICAL SECURITY REQUIREMENT (EIP-712 & Call-Data Binding - Audit #2):
         * This function REQUIRES `opHash` to be the EIP-712 hash of a specific typed data structure
         * (e.g., `SessionOperation`), signed by the session key or owner using EIP-712 signing methods.
         * The signed structure MUST contain at least:
         * - The relevant allowance parameters being checked (e.g., `key`, `token`, `dest`, `spend`).
         * - The current key-specific nonce (`keyNonces[key]`) from this contract.
         * - A cryptographic commitment (e.g., hash) to the actual execution details (`target`, `value`, `callData`)
         * that the SmartAccount intends to execute with this authorization.
         * - Any other parameters necessary to ensure uniqueness and prevent misuse.
         * The EIP-712 domain separator used off-chain MUST include the correct `chainId` and this
         * `GovernorModule` contract's address (`verifyingContract`).
         * Example EIP-712 struct (Off-chain signer MUST use this or equivalent structure):
         * struct SessionOperation {
         * address key; address token; address dest; uint128 spend; uint256 nonce; bytes32 executionHash;
         * }
         * This contract verifies the signature against the provided `opHash` but DOES NOT reconstruct
         * the hash on-chain. Security relies entirely on the external system generating `opHash` correctly.
         */
        function preExec(bytes calldata opData, bytes32 opHash, bytes calldata signature) external returns (uint256 gasCost) {
            (address key, address token, address dest, uint128 spend) = abi.decode(opData, (address, address, address, uint128));

            require(!keyUsedOpHashes[key][opHash], "GM: Operation already executed (opHash replay)");
            keyUsedOpHashes[key][opHash] = true;

            require(isSessionKey[key], "GM: Key not enabled");
            require(keyRegistry.getKeyRegistrationStatus(key), "GM: Key not attested");

            // Validate Signature (EIP-712 - Fixed previously)
            address recoveredSigner = ECDSA.recover(opHash, signature);
            require(recoveredSigner == key || recoveredSigner == owner(), "GM: Invalid EIP-712 signature");

            // Validate Allowance
            Allowance storage a = allowances[key][dest][token];
            require(a.enabled, "GM: Allowance disabled");
            require(block.timestamp <= a.expiry, "GM: Allowance expired");
            require(a.amount >= spend, "GM: Insufficient allowance");

            a.amount -= spend;

            // Increment key-specific nonce (MUST be included in opHash externally)
            uint256 newNonce = keyNonces[key] + 1;
            keyNonces[key] = newNonce;
            emit NonceIncreased(key, newNonce); // Added Event Emission

            emit AllowanceUsed(key, dest, token, spend, opHash);
            return 0;
        }

        /**
         * @notice Gets the current nonce for a given session key.
         * @dev This nonce MUST be included by the signer when constructing the EIP-712 hash.
         */
        function getNonce(address key) external view returns (uint256) {
            return keyNonces[key];
        }

        // postExec remains unchanged
        function postExec(bytes calldata, bytes32, bool) external pure {}
    }
    
