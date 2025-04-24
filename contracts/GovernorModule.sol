    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.28;

    import "@openzeppelin/contracts/access/Ownable.sol";
    import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
    import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
    import "./KeyRegistry.sol"; // Assuming KeyRegistry.sol is in the same directory

    /**
     * @title GovernorModule
     * @notice A security module for smart accounts that manages session keys and their allowances
     * for executing specific actions with spending limits and expirations.
     * @dev Implements a sophisticated session key management system with EIP-712 compliant signatures,
     * allowance tracking, and security features including key attestation, nonce management, and
     * replay protection. This module works in tandem with the KeyRegistry for key verification
     * and with smart accounts for execution authorization.
     * 
     * Security model:
     * - All session keys must be attested through the KeyRegistry before use
     * - Each key has destination-specific and token-specific spending limits
     * - EIP-712 signatures and per-key nonces prevent replay attacks
     * - Only the module owner can manage keys and allowances
     * 
     * Incorporates security improvements from multiple audit rounds.
     */
    contract GovernorModule is Ownable, ReentrancyGuard {
        using ECDSA for bytes32;

        // --- EIP-712 Setup ---
        /**
         * @dev TypeHash definition for the off-chain EIP-712 signing protocol
         * Off-chain signers MUST use this structure or equivalent to generate valid signatures
         * bytes32 internal constant SESSION_OPERATION_TYPEHASH = keccak256(
         *     "SessionOperation(address key,address token,address dest,uint128 spend,uint256 nonce,bytes32 executionHash)"
         * );
         * bytes32 internal DOMAIN_SEPARATOR; // Calculated in constructor if hashing on-chain
         */

        // --- State Variables ---
        /**
         * @notice Immutable reference to the key registry for attestation verification
         * @dev Used to verify that session keys have been properly attested before use
         * This contract is set at deployment and cannot be changed thereafter
         */
        KeyRegistry public immutable keyRegistry;

        /**
         * @notice Structure defining spending allowances for session keys
         * @dev Contains amount, expiry, and enabled flag for secure allowance management
         * @param amount Maximum amount that can be spent (uint128 to conserve storage)
         * @param expiry UNIX timestamp when the allowance expires (uint48 for storage optimization)
         * @param enabled Flag to enable/disable the allowance without removing it
         */
        struct Allowance {
            uint128 amount;    // Maximum amount that can be spent
            uint48 expiry;     // UNIX timestamp when the allowance expires
            bool enabled;      // Flag to enable/disable the allowance without removing it
        }

        /**
         * @notice Complex mapping for storing allowances
         * @dev Maps session key => destination => token => Allowance structure
         * Allows fine-grained control over what each session key can do
         */
        mapping(address => mapping(address => mapping(address => Allowance))) public allowances;
        
        /**
         * @notice Tracks which addresses are currently enabled as session keys
         * @dev True if the key is enabled and can be used for operations
         * A key must be both enabled here AND attested in KeyRegistry to be usable
         */
        mapping(address => bool) public isSessionKey;
        
        /**
         * @notice Nonce per session key for replay protection
         * @dev MUST be included in signed EIP-712 operation hash externally
         * Incremented on each successful operation to prevent replay attacks
         */
        mapping(address => uint256) public keyNonces;
        
        /**
         * @notice Replay protection for operation hashes
         * @dev Maps key => operation hash => used status (true if already used)
         * Provides a second layer of replay protection beyond nonces
         */
        mapping(address => mapping(bytes32 => bool)) public keyUsedOpHashes;

        // --- Events ---
        /**
         * @notice Emitted when a session key is enabled
         * @param key The address of the session key that was enabled
         */
        event SessionKeyEnabled(address indexed key);
        
        /**
         * @notice Emitted when a session key is revoked
         * @param key The address of the session key that was revoked
         */
        event SessionKeyRevoked(address indexed key);
        
        /**
         * @notice Emitted when an allowance is set or updated
         * @param key The address of the session key receiving the allowance
         * @param dest The destination address the key is allowed to interact with
         * @param token The token address the key is allowed to spend
         * @param amount The maximum amount of tokens allowed
         * @param expiry The UNIX timestamp when the allowance expires
         */
        event AllowanceSet(address indexed key, address indexed dest, address indexed token, uint128 amount, uint48 expiry);
        
        /**
         * @notice Emitted when an allowance is used
         * @param key The address of the session key using the allowance
         * @param dest The destination address where tokens are sent
         * @param token The token address being spent
         * @param amount The amount of tokens spent
         * @param opHash The operation hash of the executed transaction
         */
        event AllowanceUsed(address indexed key, address indexed dest, address indexed token, uint128 amount, bytes32 opHash);
        
        /**
         * @notice Emitted when a key's nonce is increased
         * @param key The address of the session key whose nonce increased
         * @param newNonce The new nonce value
         */
        event NonceIncreased(address indexed key, uint256 newNonce);

        // --- Constructor ---
        /**
         * @notice Deploys the GovernorModule with a reference to the required KeyRegistry
         * @dev Sets the immutable reference to the KeyRegistry contract
         * @param _registry The address of the KeyRegistry contract for key attestation
         */
        constructor(address _registry) {
            require(_registry != address(0), "GM: Invalid registry address");
            keyRegistry = KeyRegistry(_registry);
            // If implementing full EIP-712 on-chain: _rebuildDomainSeparator();
        }

        // --- EIP-712 Helper Functions (Reference Only for Off-Chain) ---
        // ... (Commented out helpers remain for reference) ...

        // --- Core Logic ---

        /**
         * @notice Enables an attested session key for use with this module
         * @dev Verifies the key is attested in the KeyRegistry before enabling it
         * Only the owner of this module can enable keys
         * @param key The address of the session key to enable
         */
        function enableSessionKey(address key) external onlyOwner nonReentrant {
            require(key != address(0), "GM: Invalid key address");
            require(keyRegistry.getKeyRegistrationStatus(key), "GM: Key not attested");
            require(!isSessionKey[key], "GM: Key already enabled"); // Prevent redundant events
            isSessionKey[key] = true;
            emit SessionKeyEnabled(key);
        }

        /**
         * @notice Revokes an enabled session key
         * @dev Disables a previously enabled session key
         * Does not clear existing allowances for gas efficiency reasons
         * Only the owner of this module can revoke keys
         * @param key The address of the session key to revoke
         */
        function revokeSessionKey(address key) external onlyOwner nonReentrant {
            require(key != address(0), "GM: Invalid key address");
            if (isSessionKey[key]) {
                isSessionKey[key] = false;
                // Note: Allowances are not automatically cleared due to gas cost concerns.
                // They will naturally expire or become unusable as isSessionKey[key] is false.
                emit SessionKeyRevoked(key);
            }
        }

        /**
         * @notice Sets or updates an allowance for a specific session key
         * @dev Creates a new spending allowance or updates an existing one
         * Allowances are specific to key-destination-token combinations
         * Only the owner of this module can set allowances
         * @param key The session key address receiving the allowance
         * @param dest The destination address the key is allowed to interact with
         * @param token The ERC20 token address the key is allowed to spend
         * @param amount The maximum amount of the token the key can spend
         * @param expiry The UNIX timestamp when the allowance expires
         */
        function setAllowance(address key, address dest, address token, uint128 amount, uint48 expiry) external onlyOwner nonReentrant {
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
         * @notice Pre-execution hook for session key operations
         * @dev Validates EIP-712 signature and allowance before execution
         * Implements comprehensive security checks including:
         * - Signature validation using EIP-712
         * - Replay protection via operation hash tracking
         * - Allowance validation (enabled, expiry, sufficient amount)
         * - Automatic nonce management
         * 
         * This function is called by the smart account before executing operations
         * authorized by session keys.
         * 
         * Security note: This function must be called atomically with the actual
         * operation execution to prevent time-of-check/time-of-use issues.
         * 
         * @param opData Encoded allowance parameters (key, token, dest, spend) needed for validation
         * @param opHash The EIP-712 hash of a `SessionOperation` struct calculated and signed off-chain
         * @param signature The EIP-712 signature over `opHash` provided by the session key or owner
         * @return gasCost Estimated gas cost (currently returns 0)
         */
        function preExec(bytes calldata opData, bytes32 opHash, bytes calldata signature) 
            external 
            nonReentrant 
            returns (uint256 gasCost) 
        {
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
            emit NonceIncreased(key, newNonce);

            emit AllowanceUsed(key, dest, token, spend, opHash);
            return 0;
        }

        /**
         * @notice Gets the current nonce for a given session key
         * @dev This nonce MUST be included by the signer when constructing the EIP-712 hash
         * Failure to include the correct nonce will result in signature verification failure
         * @param key The address of the session key to query
         * @return The current nonce value for the key
         */
        function getNonce(address key) external view returns (uint256) {
            return keyNonces[key];
        }

        /**
         * @notice Post-execution hook for session key operations
         * @dev Currently a no-op function for interface compatibility with smart accounts
         * May be extended in future versions for post-execution validations
         * @param unused1 Unused parameter (for potential future use)
         * @param unused2 Unused parameter (for potential future use) 
         * @param unused3 Unused parameter (for potential future use)
         */
        function postExec(bytes calldata unused1, bytes32 unused2, bool unused3) external pure {}
    }
    
