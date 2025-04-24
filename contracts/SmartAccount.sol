// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28; // Standardized Pragma

/**
 * @title SmartAccount – ERC-4337 compatible account abstraction
 * @dev Incorporates fixes for OZv4+, ERC-4337, EIP-712, ERC-1271, includes plugin loops,
 * and Slither findings (nonce init, max plugins, zero address check).
 */

// Ensure "@account-abstraction/contracts" and "@openzeppelin/contracts@^4.0.0" are installed
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol"; // OZ v4.x Ownable
import "@openzeppelin/contracts/utils/introspection/ERC165.sol"; // OZ v4.x ERC165
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol"; // OZ v4.x EnumerableSet
// Correct Import Path for OpenZeppelin Contracts v4.x
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// Interface for plugins/guards expected by this account
interface IPlugin {
    function preExec(bytes calldata contextData, bytes32 contextHash) external returns (uint256 gasCost);
    function postExec(bytes calldata contextData, bytes32 contextHash, bool success) external;
}

// Implementing required interfaces and security patterns
contract SmartAccount is IAccount, Ownable, ERC165, IERC1271, ReentrancyGuard {
    using ECDSA for bytes32;
    using EnumerableSet for EnumerableSet.AddressSet;

    // --- Constants ---
    bytes4 private constant ERC1271_MAGIC_VALUE = 0x1626ba7e;
    bytes4 private constant ERC1271_INVALID_VALUE = 0xffffffff;

    // --- State ---
    address public immutable entryPoint; // Trusted ERC-4337 EntryPoint
    mapping(address => bool) public isPlugin; // Quick check if address is *ever* enabled
    EnumerableSet.AddressSet private _plugins; // Iterable set of currently *active* plugins
    mapping(bytes4 => address) public fallbackMap; // Unused currently, reserved for potential future fallback handler
    uint256 public nonce; // ERC-4337 sequential nonce for UserOperations
    uint256 public maxPlugins; // Max number of active plugins (Slither fix)

    // --- Events ---
    event PluginEnabled(address indexed plugin);
    event PluginDisabled(address indexed plugin);
    event TransactionExecuted(address indexed sender, address indexed dest, uint256 value, bytes data, bool success);
    event MaxPluginsChanged(uint256 newMaxPlugins); // Added event

    // --- Constructor ---
    // Accepts initialOwner (likely self or deployer) and the trusted EntryPoint address
    // Uses _transferOwnership for OZ v4.x compatibility
    // Renamed parameters to avoid shadowing
    constructor(address _initialOwner, address _entryPoint) {
        require(_initialOwner != address(0), "SA: Invalid owner address"); // Using SA: prefix
        require(_entryPoint != address(0), "SA: Invalid EntryPoint address");
        _transferOwnership(_initialOwner); // Set initial owner using OZ v4 pattern
        entryPoint = _entryPoint;
        nonce = 0; // Explicitly initialize nonce (Slither fix)
        maxPlugins = 10; // Set default max plugins (Slither fix)
        emit MaxPluginsChanged(10);
    }

    // --- Functions ---

    /**
     * @notice Validates a UserOperation based on ERC-4337, using EIP-712 hash.
     */
    function validateUserOp(
        PackedUserOperation calldata userOp, // Updated to PackedUserOperation
        bytes32 userOpHash, // EIP-712 hash from EntryPoint
        uint256 /* missingAccountFunds */ // Unused here, relevant for Paymasters
    ) external override nonReentrant returns (uint256 validationData) { // Added nonReentrant
        // 1. EntryPoint Check
        require(msg.sender == entryPoint, "SA: Caller is not the EntryPoint");

        // 2. Plugin Hook: Pre-Validation
        address[] memory currentPlugins = _plugins.values();
        bytes memory userOpEncoded = abi.encode(userOp); // Encode once for loop
        for (uint i = 0; i < currentPlugins.length; i++) {
            // Call preExec on each enabled plugin. Reverts propagate.
            IPlugin(currentPlugins[i]).preExec(userOpEncoded, userOpHash);
        }

        // 3. Nonce Check
        require(userOp.nonce == nonce, "SA: Invalid nonce");

        // 4. Signature Validation (EIP-712)
        address recoveredOwner = ECDSA.recover(userOpHash, userOp.signature);
        require(recoveredOwner == owner(), "SA: Invalid signature");

        // 5. Post-Validation Hook (Optional)
        return 0; // Success
    }

    /**
     * @notice Executes a transaction from the SmartAccount (callable by owner).
     */
    function execute(address dest, uint256 value, bytes calldata data) external onlyOwner nonReentrant {
        // Zero-address check for destination (Slither fix)
        require(dest != address(0), "SA: Invalid destination address");

        address[] memory currentPlugins = _plugins.values();
        bytes memory contextData = abi.encode(dest, value, data);
        bytes32 contextHash = keccak256(contextData); // Simple context hash

        // 1. Plugin Hook: Pre-Execution
        for (uint i = 0; i < currentPlugins.length; i++) {
            IPlugin(currentPlugins[i]).preExec(contextData, contextHash);
        }

        // 2. Execute Main Call
        (bool success, ) = dest.call{value: value}(data);

        // 3. Plugin Hook: Post-Execution
        for (uint i = 0; i < currentPlugins.length; i++) {
            IPlugin(currentPlugins[i]).postExec(contextData, contextHash, success);
        }

        // 4. Check Success (after post-hooks)
        require(success, "SA: Transaction execution failed");

        // 5. Emit Event
        emit TransactionExecuted(msg.sender, dest, value, data, success);
    }

    /**
     * @notice Sets the maximum number of plugins allowed.
     * @param _max The new maximum number of plugins.
     */
    function setMaxPlugins(uint256 _max) external onlyOwner {
        // Add reasonable upper bound? e.g., 100?
        require(_max > 0, "SA: Max plugins must be > 0");
        maxPlugins = _max;
        emit MaxPluginsChanged(_max);
    }

    /**
     * @notice Enables a plugin/guard contract and adds it to the active list.
     */
    function enablePlugin(address plugin) external onlyOwner {
        require(plugin != address(0), "SA: Invalid plugin address");
        require(!isPlugin[plugin], "SA: Plugin already enabled");
        // Check against max plugins limit (Slither fix)
        require(_plugins.length() < maxPlugins, "SA: Max plugins reached");
        require(_plugins.add(plugin), "SA: Plugin add failed (already in set?)");
        isPlugin[plugin] = true;
        emit PluginEnabled(plugin);
    }

    /**
     * @notice Disables a plugin/guard contract and removes it from the active list.
     */
    function disablePlugin(address plugin) external onlyOwner {
        require(plugin != address(0), "SA: Invalid plugin address");
        require(isPlugin[plugin], "SA: Plugin not enabled");
        require(_plugins.remove(plugin), "SA: Plugin remove failed (not in set?)");
        isPlugin[plugin] = false;
        emit PluginDisabled(plugin);
    }

    /**
     * @notice Returns the list of currently enabled plugins.
     */
    function getPlugins() external view returns (address[] memory) {
        return _plugins.values();
    }

    // --- ERC-1271 Signature Validation ---
    /**
     * @notice Verifies that a signature is valid for the owner of this contract.
     */
    function isValidSignature(bytes32 _hash, bytes memory _signature)
        external
        view
        override // Implicitly overrides IERC1271.isValidSignature
        returns (bytes4 magicValue)
    {
        address recoveredSigner = ECDSA.recover(_hash, _signature);
        if (recoveredSigner != address(0) && recoveredSigner == owner()) {
            return ERC1271_MAGIC_VALUE;
        } else {
            return ERC1271_INVALID_VALUE;
        }
    }

    // --- ERC165 Support ---
    /**
     * @dev See {IERC165-supportsInterface}. Includes IAccount and IERC1271.
     * Corrected override specifier for OZ v4.x compatibility.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        // In OZ v4.x, inheriting ERC165 means we just need 'override'.
        // The check includes interfaces implemented by this contract and inherited ones.
        return interfaceId == type(IAccount).interfaceId ||
               interfaceId == type(IERC1271).interfaceId ||
               super.supportsInterface(interfaceId); // Handles ERC165 itself
    }

    // Allow receiving native ETH
    receive() external payable {}

    // --- Fallback Handler Logic (Not Implemented) ---
    // fallback() external payable { ... }
    // --- End Fallback Handler Logic ---
}

