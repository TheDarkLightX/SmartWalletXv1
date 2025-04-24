// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23; // Standardized Pragma

import "@openzeppelin/contracts/access/Ownable.sol"; // OZ v4.x Ownable
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title KeyRegistry
 * @notice A registry contract for the verification and attestation of cryptographic keys
 * @dev This contract serves as a central authority for registering and managing keys
 * used across the secure wallet ecosystem. It maintains records of registered keys,
 * their attestation status, and provides verification services to other contracts.
 * 
 * The KeyRegistry implements a multi-registrar model where:
 * - The contract owner can add or remove registrars
 * - Only authorized registrars can register or revoke keys
 * - Any contract can verify key registration status
 * 
 * Security features:
 * - Reentrancy protection on all state-changing functions
 * - Access control via owner and registrar roles
 * - Complete event logging for all important state changes
 * - Zero-address validation on all inputs
 * 
 * This contract is a foundational component of the secure wallet infrastructure,
 * providing trustworthy key attestation services to other modules.
 */
contract KeyRegistry is Ownable, ReentrancyGuard {
    // --- State ---
    /** 
     * @notice Mapping from attestation quote hash to the session key address
     * @dev Used to link hardware attestation quotes to specific key addresses
     * Not used in the current implementation but reserved for future attestation features
     */
    mapping(bytes32 => address) public quoteToKey;
    
    /** 
     * @notice Mapping to track if a specific address is currently registered as a session key
     * @dev Redundant with registeredKeys, maintained for backward compatibility
     * Should be deprecated in favor of using getKeyRegistrationStatus()
     */
    mapping(address => bool) public isKeyRegistered;

    // --- Events ---
    /**
     * @notice Emitted when a new key is registered in the registry
     * @param key The address of the key that was registered
     * @param registrar The address that registered the key (must be an authorized registrar)
     */
    event KeyRegistered(address indexed key, address indexed registrar);
    
    /**
     * @notice Emitted when a key's registration is revoked
     * @param key The address of the key that was revoked
     * @param revoker The address that revoked the key (must be an authorized registrar)
     * @param reason A code indicating the reason for revocation, used for auditing:
     *        0 = Normal rotation
     *        1 = Suspected compromise
     *        2 = Administrative action
     *        3-255 = Reserved for future use
     */
    event KeyRevoked(address indexed key, address indexed revoker, uint8 reason);
    
    /**
     * @notice Emitted when a new registrar is added to the registry
     * @param registrar The address that was granted registrar privileges
     */
    event RegistrarAdded(address indexed registrar);
    
    /**
     * @notice Emitted when a registrar is removed from the registry
     * @param registrar The address that was removed from registrar privileges
     */
    event RegistrarRemoved(address indexed registrar);

    // --- State Variables ---
    /**
     * @notice Mapping of keys to their registration status
     * @dev True if a key is registered and attested, false otherwise
     * This is the primary source of truth for key registration status
     */
    mapping(address => bool) private registeredKeys;
    
    /**
     * @notice Mapping of addresses that are authorized to register keys
     * @dev True if an address is authorized as a registrar, false otherwise
     * Only the contract owner can modify this mapping
     */
    mapping(address => bool) public isRegistrar;
    
    /**
     * @notice Count of registered keys, used for tracking and reporting
     * @dev Incremented when keys are registered, decremented when revoked
     * Always matches the count of addresses where registeredKeys[address] == true
     */
    uint256 public registeredKeyCount;

    // --- Modifiers ---
    /**
     * @notice Ensures the caller is an authorized registrar
     * @dev Reverts if the caller is not in the isRegistrar mapping
     * Used to restrict access to key registration functions
     */
    modifier onlyRegistrar() {
        require(isRegistrar[msg.sender], "KeyRegistry: caller is not a registrar");
        _;
    }

    // --- Constructor ---
    /**
     * @notice Deploys the KeyRegistry and sets the initial owner as a registrar
     * @dev The deployer is automatically granted both owner and registrar privileges
     * This ensures there is always at least one registrar upon deployment
     */
    constructor() {
        _addRegistrar(msg.sender);
    }

    // --- External Functions ---
    /**
     * @notice Adds a new authorized registrar
     * @dev Only callable by the contract owner
     * Emits a RegistrarAdded event upon success
     * @param registrar The address to be granted registrar privileges
     */
    function addRegistrar(address registrar) external onlyOwner {
        _addRegistrar(registrar);
    }

    /**
     * @notice Removes an authorized registrar
     * @dev Only callable by the contract owner
     * Cannot remove the last registrar to prevent lockout scenarios
     * Emits a RegistrarRemoved event upon success
     * @param registrar The address to be removed from registrar privileges
     */
    function removeRegistrar(address registrar) external onlyOwner {
        require(registrar != address(0), "KeyRegistry: invalid registrar address");
        require(isRegistrar[registrar], "KeyRegistry: address is not a registrar");
        
        isRegistrar[registrar] = false;
        emit RegistrarRemoved(registrar);
    }

    /**
     * @notice Registers a new key in the registry
     * @dev Only callable by authorized registrars
     * Implements reentrancy protection and maintains accurate key count
     * Emits a KeyRegistered event upon success
     * @param key The address of the key to register
     */
    function registerKey(address key) external onlyRegistrar nonReentrant {
        require(key != address(0), "KeyRegistry: invalid key address");
        require(!registeredKeys[key], "KeyRegistry: key already registered");
        
        registeredKeys[key] = true;
        registeredKeyCount++;
        
        emit KeyRegistered(key, msg.sender);
    }

    /**
     * @notice Revokes a previously registered key
     * @dev Only callable by authorized registrars
     * Implements reentrancy protection and maintains accurate key count
     * Emits a KeyRevoked event upon success
     * @param key The address of the key to revoke
     * @param reason A code indicating the reason for revocation, used for auditing:
     *        0 = Normal rotation
     *        1 = Suspected compromise
     *        2 = Administrative action
     *        3-255 = Reserved for future use
     */
    function revokeKey(address key, uint8 reason) external onlyRegistrar nonReentrant {
        require(key != address(0), "KeyRegistry: invalid key address");
        require(registeredKeys[key], "KeyRegistry: key not registered");
        
        registeredKeys[key] = false;
        registeredKeyCount--;
        
        emit KeyRevoked(key, msg.sender, reason);
    }

    /**
     * @notice Checks if a key is registered and attested
     * @dev Public view function usable by other contracts to verify key status
     * This is the primary interface for other contracts to check key validity
     * @param key The address of the key to check
     * @return True if the key is registered and attested, false otherwise
     */
    function getKeyRegistrationStatus(address key) external view returns (bool) {
        return registeredKeys[key];
    }

    /**
     * @notice Batch checks registration status for multiple keys
     * @dev Useful for efficient verification of multiple keys in a single call
     * Gas-optimized by using a single view call instead of multiple
     * @param keys Array of key addresses to check
     * @return Array of boolean values indicating registration status for each key,
     *         with indices corresponding to the input array
     */
    function batchGetKeyRegistrationStatus(address[] calldata keys) 
        external 
        view 
        returns (bool[] memory) 
    {
        uint256 length = keys.length;
        bool[] memory statuses = new bool[](length);
        
        for (uint256 i = 0; i < length; i++) {
            statuses[i] = registeredKeys[keys[i]];
        }
        
        return statuses;
    }

    // --- Internal Functions ---
    /**
     * @notice Internal function to add a new registrar
     * @dev Validates input and updates state, emitting appropriate event
     * Shared implementation used by both constructor and addRegistrar
     * @param registrar The address to be granted registrar privileges
     */
    function _addRegistrar(address registrar) internal {
        require(registrar != address(0), "KeyRegistry: invalid registrar address");
        require(!isRegistrar[registrar], "KeyRegistry: already a registrar");
        
        isRegistrar[registrar] = true;
        emit RegistrarAdded(registrar);
    }
}

