// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23; // Standardized Pragma

import "@openzeppelin/contracts/access/Ownable.sol"; // OZ v4.x Ownable

/**
 * @title KeyRegistry
 * @dev Simple registry mapping quote hashes (e.g., from attestation) to session keys.
 * Allows checking if a key is registered and attested.
 * Includes fixes based on Audit #1 findings and adjusted for OZv4 compatibility.
 */
contract KeyRegistry is Ownable { // Inherits OZv4 Ownable
    // Mapping from attestation quote hash to the session key address
    mapping(bytes32 => address) public quoteToKey;
    // Mapping to track if a specific address is currently registered as a session key
    mapping(address => bool) public isKeyRegistered;

    // --- Events ---
    event KeyRegistered(bytes32 indexed quoteHash, address indexed sessionKey);
    event KeyDeregistered(bytes32 indexed quoteHash, address indexed sessionKey);

    // --- Constructor ---
    // Accepts initialOwner for Ownable functions
    // Uses _transferOwnership for OZ v4.x compatibility
    constructor(address _initialOwner) { // Renamed parameter
        require(_initialOwner != address(0), "KeyRegistry: Invalid initial owner");
        _transferOwnership(_initialOwner); // Set initial owner using OZ v4 pattern
    }

    // --- Functions ---

    /**
     * @notice Registers a session key against a quote hash.
     * @dev Callable only by the owner. Handles quote hash collisions by deregistering the old key.
     * @param quoteHash The hash representing the attestation quote.
     * @param sessionKey The session key address to register.
     */
    function registerKey(bytes32 quoteHash, address sessionKey) external onlyOwner {
        // Prevent zero-address key registration (Audit Finding Low - Fixed)
        require(sessionKey != address(0), "KeyRegistry: invalid zero address");

        address oldSessionKey = quoteToKey[quoteHash];
        // Deregister old session key if quoteHash is reused (Audit Finding Low - Fixed)
        if (oldSessionKey != address(0) && oldSessionKey != sessionKey) {
            // Only update if the old key was actually marked as registered
            if (isKeyRegistered[oldSessionKey]) {
                isKeyRegistered[oldSessionKey] = false;
                // Emit event for the implicitly deregistered key for off-chain tracking
                emit KeyDeregistered(quoteHash, oldSessionKey);
            }
        }

        // Register the new key
        quoteToKey[quoteHash] = sessionKey;
        isKeyRegistered[sessionKey] = true; // Mark the new key as registered
        emit KeyRegistered(quoteHash, sessionKey);
    }

    /**
     * @notice Deregisters a session key using its quote hash.
     * @dev Callable only by the owner. Does not revert if key not found.
     * @param quoteHash The quote hash associated with the key to deregister.
     */
    function deregisterKey(bytes32 quoteHash) external onlyOwner {
        address sessionKey = quoteToKey[quoteHash];
        // If no key is associated with the hash, do nothing (allow idempotent calls)
        if (sessionKey == address(0)) {
            return;
        }

        delete quoteToKey[quoteHash]; // Remove mapping from hash to key

        // Check if the key exists in the registration mapping before setting to false
        if (isKeyRegistered[sessionKey]) {
             isKeyRegistered[sessionKey] = false; // Mark the key as no longer registered
             emit KeyDeregistered(quoteHash, sessionKey);
        }
    }

    /**
     * @notice Checks if a given address is currently registered as a session key.
     * @param sessionKey The address to check.
     * @return bool True if the key is registered, false otherwise.
     */
    function getKeyRegistrationStatus(address sessionKey) external view returns (bool) {
        // Renamed from isAttested for consistency with GovernorModule usage
        return isKeyRegistered[sessionKey];
    }

    /**
     * @notice Gets the session key associated with a given quote hash.
     * @param quoteHash The quote hash to query.
     * @return address The associated session key address, or address(0) if none.
     */
    function getKeyForQuote(bytes32 quoteHash) external view returns (address) {
        // Added getter for quoteToKey mapping
        return quoteToKey[quoteHash];
    }
}

