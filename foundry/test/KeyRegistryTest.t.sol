// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/KeyRegistry.sol";

/// @title KeyRegistryTest - Comprehensive tests for KeyRegistry contract
/// @notice Run with `forge test -vv --match-contract KeyRegistryTest` inside the `foundry` directory
contract KeyRegistryTest is Test {
    // Test contracts
    KeyRegistry internal keyRegistry;
    
    // Test addresses
    address internal owner;
    address internal nonOwner;
    address internal sessionKey1;
    address internal sessionKey2;
    
    // Test data
    bytes32 internal quoteHash1;
    bytes32 internal quoteHash2;
    
    function setUp() public {
        owner = makeAddr("owner");
        nonOwner = makeAddr("nonOwner");
        sessionKey1 = makeAddr("sessionKey1");
        sessionKey2 = makeAddr("sessionKey2");
        
        quoteHash1 = keccak256(abi.encodePacked("quote1"));
        quoteHash2 = keccak256(abi.encodePacked("quote2"));
        
        // Deploy KeyRegistry with owner as the initial owner
        vm.prank(owner);
        keyRegistry = new KeyRegistry(owner);
    }
    
    /*//////////////////////////////////////////////////////////////
                           STANDARD TESTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Test that constructor sets the owner correctly
    function test_Constructor() public {
        assertEq(keyRegistry.owner(), owner, "Owner not set correctly");
    }
    
    /// @notice Test that only owner can register a key
    function test_RegisterKey_OnlyOwner() public {
        // Non-owner should not be able to register a key
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        keyRegistry.registerKey(quoteHash1, sessionKey1);
        
        // Owner should be able to register a key
        vm.prank(owner);
        keyRegistry.registerKey(quoteHash1, sessionKey1);
        
        // Verify key was registered
        assertTrue(keyRegistry.isKeyRegistered(sessionKey1), "Key should be registered");
        assertEq(keyRegistry.quoteToKey(quoteHash1), sessionKey1, "Quote to key mapping incorrect");
    }
    
    /// @notice Test that zero address cannot be registered as a key
    function test_RegisterKey_RevertZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("KeyRegistry: invalid zero address");
        keyRegistry.registerKey(quoteHash1, address(0));
    }
    
    /// @notice Test handling of quote hash collisions
    function test_RegisterKey_HandleCollision() public {
        // Register first key
        vm.prank(owner);
        keyRegistry.registerKey(quoteHash1, sessionKey1);
        
        // Register another key with the same quote hash
        vm.prank(owner);
        keyRegistry.registerKey(quoteHash1, sessionKey2);
        
        // Check that the old key is deregistered
        assertFalse(keyRegistry.isKeyRegistered(sessionKey1), "Old key should be deregistered");
        assertTrue(keyRegistry.isKeyRegistered(sessionKey2), "New key should be registered");
        assertEq(keyRegistry.quoteToKey(quoteHash1), sessionKey2, "Quote to key mapping should be updated");
    }
    
    /// @notice Test registering the same key with different quote hashes
    function test_RegisterKey_SameKeyDifferentQuotes() public {
        // Register key with first quote hash
        vm.prank(owner);
        keyRegistry.registerKey(quoteHash1, sessionKey1);
        
        // Register same key with second quote hash
        vm.prank(owner);
        keyRegistry.registerKey(quoteHash2, sessionKey1);
        
        // Check both mappings
        assertTrue(keyRegistry.isKeyRegistered(sessionKey1), "Key should be registered");
        assertEq(keyRegistry.quoteToKey(quoteHash1), sessionKey1, "First quote mapping incorrect");
        assertEq(keyRegistry.quoteToKey(quoteHash2), sessionKey1, "Second quote mapping incorrect");
    }
    
    /// @notice Test that only owner can deregister a key
    function test_DeregisterKey_OnlyOwner() public {
        // First register a key
        vm.prank(owner);
        keyRegistry.registerKey(quoteHash1, sessionKey1);
        
        // Non-owner should not be able to deregister
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        keyRegistry.deregisterKey(quoteHash1);
        
        // Owner should be able to deregister
        vm.prank(owner);
        keyRegistry.deregisterKey(quoteHash1);
        
        // Verify key was deregistered
        assertFalse(keyRegistry.isKeyRegistered(sessionKey1), "Key should be deregistered");
        assertEq(keyRegistry.quoteToKey(quoteHash1), address(0), "Quote to key mapping should be cleared");
    }
    
    /// @notice Test deregistering a non-existent key (should not revert)
    function test_DeregisterKey_NonExistentKey() public {
        // Deregister a key that hasn't been registered
        vm.prank(owner);
        keyRegistry.deregisterKey(quoteHash1);
        
        // Verify nothing changed
        assertFalse(keyRegistry.isKeyRegistered(sessionKey1), "Key should remain not registered");
        assertEq(keyRegistry.quoteToKey(quoteHash1), address(0), "Quote to key mapping should remain zero");
    }
    
    /// @notice Test the getter functions
    function test_GetterFunctions() public {
        // First register a key
        vm.prank(owner);
        keyRegistry.registerKey(quoteHash1, sessionKey1);
        
        // Test getKeyRegistrationStatus
        assertTrue(keyRegistry.getKeyRegistrationStatus(sessionKey1), "Key should be reported as registered");
        assertFalse(keyRegistry.getKeyRegistrationStatus(sessionKey2), "Unregistered key should be reported as not registered");
        
        // Test getKeyForQuote
        assertEq(keyRegistry.getKeyForQuote(quoteHash1), sessionKey1, "getKeyForQuote should return the correct key");
        assertEq(keyRegistry.getKeyForQuote(quoteHash2), address(0), "getKeyForQuote should return zero for unknown quote");
    }
    
    /*//////////////////////////////////////////////////////////////
                              FUZZ TESTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Fuzz test for registering and then checking keys
    function testFuzz_RegisterAndCheckKey(address testSessionKey, bytes32 testQuoteHash) public {
        vm.assume(testSessionKey != address(0)); // Avoid zero address which would revert
        
        // Register the key
        vm.prank(owner);
        keyRegistry.registerKey(testQuoteHash, testSessionKey);
        
        // Check registration
        assertTrue(keyRegistry.isKeyRegistered(testSessionKey), "Key should be registered");
        assertEq(keyRegistry.quoteToKey(testQuoteHash), testSessionKey, "Quote to key mapping incorrect");
        assertTrue(keyRegistry.getKeyRegistrationStatus(testSessionKey), "getKeyRegistrationStatus should return true");
        assertEq(keyRegistry.getKeyForQuote(testQuoteHash), testSessionKey, "getKeyForQuote should return the key");
    }
    
    /// @notice Fuzz test for collisions with multiple random keys
    function testFuzz_MultipleKeysCollision(
        address testSessionKey1,
        address testSessionKey2,
        bytes32 testQuoteHash
    ) public {
        // Skip invalid inputs
        vm.assume(testSessionKey1 != address(0));
        vm.assume(testSessionKey2 != address(0));
        vm.assume(testSessionKey1 != testSessionKey2);
        
        // Register first key
        vm.prank(owner);
        keyRegistry.registerKey(testQuoteHash, testSessionKey1);
        
        // Register second key with same quote hash
        vm.prank(owner);
        keyRegistry.registerKey(testQuoteHash, testSessionKey2);
        
        // Check that only the new key is registered
        assertFalse(keyRegistry.isKeyRegistered(testSessionKey1), "First key should be deregistered");
        assertTrue(keyRegistry.isKeyRegistered(testSessionKey2), "Second key should be registered");
        assertEq(keyRegistry.quoteToKey(testQuoteHash), testSessionKey2, "Quote hash should map to second key");
    }
    
    /// @notice Fuzz test for deregistering keys
    function testFuzz_DeregisterKey(address testSessionKey, bytes32 testQuoteHash) public {
        vm.assume(testSessionKey != address(0));
        
        // Register the key
        vm.prank(owner);
        keyRegistry.registerKey(testQuoteHash, testSessionKey);
        
        // Deregister the key
        vm.prank(owner);
        keyRegistry.deregisterKey(testQuoteHash);
        
        // Check that key is deregistered
        assertFalse(keyRegistry.isKeyRegistered(testSessionKey), "Key should be deregistered");
        assertEq(keyRegistry.quoteToKey(testQuoteHash), address(0), "Quote to key mapping should be cleared");
    }
} 