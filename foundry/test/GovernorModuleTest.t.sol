// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/GovernorModule.sol";
import "../../contracts/KeyRegistry.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title GovernorModuleTest - Comprehensive tests for GovernorModule contract
/// @notice Run with `forge test -vv --match-contract GovernorModuleTest` inside the `foundry` directory
contract GovernorModuleTest is Test {
    using ECDSA for bytes32;
    
    // Test contracts
    GovernorModule internal governorModule;
    KeyRegistry internal keyRegistry;
    
    // Test addresses
    address internal owner;
    address internal nonOwner;
    address internal sessionKey1;
    address internal sessionKey2;
    address internal destination;
    address internal token;
    
    // Private keys for signing
    uint256 internal ownerPrivateKey;
    uint256 internal sessionKey1PrivateKey;
    uint256 internal sessionKey2PrivateKey;
    
    // EIP-712 Domain
    bytes32 internal DOMAIN_SEPARATOR;
    bytes32 internal constant SESSION_OPERATION_TYPEHASH = keccak256(
        "SessionOperation(address key,address token,address dest,uint128 spend,uint256 nonce,bytes32 executionHash)"
    );
    
    function setUp() public {
        // Generate private keys and addresses
        ownerPrivateKey = 0x1;
        sessionKey1PrivateKey = 0x2;
        sessionKey2PrivateKey = 0x3;
        
        owner = vm.addr(ownerPrivateKey);
        sessionKey1 = vm.addr(sessionKey1PrivateKey);
        sessionKey2 = vm.addr(sessionKey2PrivateKey);
        
        nonOwner = makeAddr("nonOwner");
        destination = makeAddr("destination");
        token = makeAddr("token");
        
        // Deploy KeyRegistry first
        vm.prank(owner);
        keyRegistry = new KeyRegistry(owner);
        
        // Deploy GovernorModule with KeyRegistry
        vm.prank(owner);
        governorModule = new GovernorModule(address(keyRegistry));
        
        // Setup domain separator for EIP-712 signing
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256("GovernorModule"),
                keccak256("1"),
                block.chainid,
                address(governorModule)
            )
        );
        
        // Register session keys in KeyRegistry
        bytes32 quoteHash1 = keccak256(abi.encodePacked("quote1"));
        bytes32 quoteHash2 = keccak256(abi.encodePacked("quote2"));
        
        vm.prank(owner);
        keyRegistry.registerKey(quoteHash1, sessionKey1);
        
        vm.prank(owner);
        keyRegistry.registerKey(quoteHash2, sessionKey2);
    }
    
    /*//////////////////////////////////////////////////////////////
                           STANDARD TESTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Test constructor parameters
    function test_Constructor() public {
        assertEq(address(governorModule.keyRegistry()), address(keyRegistry), "KeyRegistry address incorrect");
        assertEq(governorModule.owner(), owner, "Owner not set correctly");
    }
    
    /// @notice Test constructor reverts with zero address
    function test_Constructor_RevertZeroAddress() public {
        vm.expectRevert("GM: Invalid registry address");
        new GovernorModule(address(0));
    }
    
    /// @notice Test enabling a session key
    function test_EnableSessionKey() public {
        // Owner enables session key
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        // Verify key is enabled
        assertTrue(governorModule.isSessionKey(sessionKey1), "Session key should be enabled");
    }
    
    /// @notice Test enableSessionKey reverts for non-owner
    function test_EnableSessionKey_RevertNotOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        governorModule.enableSessionKey(sessionKey1);
    }
    
    /// @notice Test enableSessionKey reverts for zero address
    function test_EnableSessionKey_RevertZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("GM: Invalid key address");
        governorModule.enableSessionKey(address(0));
    }
    
    /// @notice Test enableSessionKey reverts for unattested key
    function test_EnableSessionKey_RevertNotAttested() public {
        address unattested = makeAddr("unattested");
        
        vm.prank(owner);
        vm.expectRevert("GM: Key not attested");
        governorModule.enableSessionKey(unattested);
    }
    
    /// @notice Test enableSessionKey reverts for already enabled key
    function test_EnableSessionKey_RevertAlreadyEnabled() public {
        // First, enable the key
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        // Try to enable it again
        vm.prank(owner);
        vm.expectRevert("GM: Key already enabled");
        governorModule.enableSessionKey(sessionKey1);
    }
    
    /// @notice Test revoking a session key
    function test_RevokeSessionKey() public {
        // First, enable the key
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        // Then revoke it
        vm.prank(owner);
        governorModule.revokeSessionKey(sessionKey1);
        
        // Verify key is revoked
        assertFalse(governorModule.isSessionKey(sessionKey1), "Session key should be revoked");
    }
    
    /// @notice Test revokeSessionKey reverts for non-owner
    function test_RevokeSessionKey_RevertNotOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        governorModule.revokeSessionKey(sessionKey1);
    }
    
    /// @notice Test revokeSessionKey reverts for zero address
    function test_RevokeSessionKey_RevertZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("GM: Invalid key address");
        governorModule.revokeSessionKey(address(0));
    }
    
    /// @notice Test revoking a never-enabled key (should not revert)
    function test_RevokeSessionKey_NeverEnabled() public {
        vm.prank(owner);
        governorModule.revokeSessionKey(sessionKey1);
        
        // Verify key is still not enabled (already was false)
        assertFalse(governorModule.isSessionKey(sessionKey1), "Session key should remain not enabled");
    }
    
    /// @notice Test setting an allowance
    function test_SetAllowance() public {
        uint128 amount = 100 ether;
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // First, enable the key
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        // Set allowance
        vm.prank(owner);
        governorModule.setAllowance(sessionKey1, destination, token, amount, expiry);
        
        // Verify allowance
        (uint128 storedAmount, uint48 storedExpiry, bool enabled) = governorModule.allowances(sessionKey1, destination, token);
        assertEq(storedAmount, amount, "Allowance amount incorrect");
        assertEq(storedExpiry, expiry, "Allowance expiry incorrect");
        assertTrue(enabled, "Allowance should be enabled");
    }
    
    /// @notice Test setAllowance reverts for non-owner
    function test_SetAllowance_RevertNotOwner() public {
        uint128 amount = 100 ether;
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        governorModule.setAllowance(sessionKey1, destination, token, amount, expiry);
    }
    
    /// @notice Test setAllowance reverts for zero addresses
    function test_SetAllowance_RevertZeroAddresses() public {
        uint128 amount = 100 ether;
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // Enable the key first
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        // Test zero key address
        vm.prank(owner);
        vm.expectRevert("GM: Invalid key address");
        governorModule.setAllowance(address(0), destination, token, amount, expiry);
        
        // Test zero token address
        vm.prank(owner);
        vm.expectRevert("GM: Invalid token address");
        governorModule.setAllowance(sessionKey1, destination, address(0), amount, expiry);
    }
    
    /// @notice Test setAllowance reverts for disabled key
    function test_SetAllowance_RevertDisabledKey() public {
        uint128 amount = 100 ether;
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // Key is not enabled yet
        vm.prank(owner);
        vm.expectRevert("GM: Key not enabled");
        governorModule.setAllowance(sessionKey1, destination, token, amount, expiry);
    }
    
    /// @notice Test setAllowance reverts for zero amount
    function test_SetAllowance_RevertZeroAmount() public {
        uint128 amount = 0;
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // Enable the key first
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        vm.prank(owner);
        vm.expectRevert("GM: Amount must be > 0");
        governorModule.setAllowance(sessionKey1, destination, token, amount, expiry);
    }
    
    /// @notice Test setAllowance reverts for past expiry
    function test_SetAllowance_RevertPastExpiry() public {
        uint128 amount = 100 ether;
        uint48 expiry = uint48(block.timestamp - 1);
        
        // Enable the key first
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        vm.prank(owner);
        vm.expectRevert("GM: Expiry must be in the future");
        governorModule.setAllowance(sessionKey1, destination, token, amount, expiry);
    }
    
    /// @notice Test preExec successful execution with session key signature
    function test_PreExec_WithSessionKey() public {
        uint128 allowanceAmount = 100 ether;
        uint128 spendAmount = 50 ether;
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // Setup: enable key and set allowance
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        vm.prank(owner);
        governorModule.setAllowance(sessionKey1, destination, token, allowanceAmount, expiry);
        
        // Execute operation with session key signature
        bytes32 executionHash = keccak256(abi.encodePacked("execution details"));
        uint256 nonce = governorModule.getNonce(sessionKey1);
        
        bytes32 structHash = keccak256(abi.encode(
            SESSION_OPERATION_TYPEHASH,
            sessionKey1,
            token,
            destination,
            spendAmount,
            nonce,
            executionHash
        ));
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKey1PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        bytes memory opData = abi.encode(sessionKey1, token, destination, spendAmount);
        
        vm.prank(owner);
        governorModule.preExec(opData, digest, signature);
        
        // Verify allowance was decreased
        (uint128 remainingAllowance,,) = governorModule.allowances(sessionKey1, destination, token);
        assertEq(remainingAllowance, allowanceAmount - spendAmount, "Allowance should be decreased");
        
        // Verify nonce was increased
        assertEq(governorModule.getNonce(sessionKey1), nonce + 1, "Nonce should be increased");
    }
    
    /// @notice Test preExec successful execution with owner signature
    function test_PreExec_WithOwnerSignature() public {
        uint128 allowanceAmount = 100 ether;
        uint128 spendAmount = 50 ether;
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // Setup: enable key and set allowance
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        vm.prank(owner);
        governorModule.setAllowance(sessionKey1, destination, token, allowanceAmount, expiry);
        
        // Execute operation with owner signature
        bytes32 executionHash = keccak256(abi.encodePacked("execution details"));
        uint256 nonce = governorModule.getNonce(sessionKey1);
        
        bytes32 structHash = keccak256(abi.encode(
            SESSION_OPERATION_TYPEHASH,
            sessionKey1,
            token,
            destination,
            spendAmount,
            nonce,
            executionHash
        ));
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        bytes memory opData = abi.encode(sessionKey1, token, destination, spendAmount);
        
        vm.prank(owner);
        governorModule.preExec(opData, digest, signature);
        
        // Verify allowance was decreased
        (uint128 remainingAllowance,,) = governorModule.allowances(sessionKey1, destination, token);
        assertEq(remainingAllowance, allowanceAmount - spendAmount, "Allowance should be decreased");
    }
    
    /// @notice Test preExec reverts for replay protection
    function test_PreExec_RevertReplayProtection() public {
        uint128 allowanceAmount = 100 ether;
        uint128 spendAmount = 50 ether;
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // Setup: enable key and set allowance
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        vm.prank(owner);
        governorModule.setAllowance(sessionKey1, destination, token, allowanceAmount, expiry);
        
        // Create operation hash and signature
        bytes32 executionHash = keccak256(abi.encodePacked("execution details"));
        uint256 nonce = governorModule.getNonce(sessionKey1);
        
        bytes32 structHash = keccak256(abi.encode(
            SESSION_OPERATION_TYPEHASH,
            sessionKey1,
            token,
            destination,
            spendAmount,
            nonce,
            executionHash
        ));
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKey1PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        bytes memory opData = abi.encode(sessionKey1, token, destination, spendAmount);
        
        // Execute once
        vm.prank(owner);
        governorModule.preExec(opData, digest, signature);
        
        // Try to execute the same operation again
        vm.prank(owner);
        vm.expectRevert("GM: Operation already executed (opHash replay)");
        governorModule.preExec(opData, digest, signature);
    }
    
    /// @notice Test preExec reverts for disabled session key
    function test_PreExec_RevertDisabledKey() public {
        uint128 allowanceAmount = 100 ether;
        uint128 spendAmount = 50 ether;
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // Setup: Do NOT enable the key, but still set allowance
        // (which will fail because the key is not enabled yet)
        
        // Create operation hash and signature
        bytes32 executionHash = keccak256(abi.encodePacked("execution details"));
        uint256 nonce = governorModule.getNonce(sessionKey1);
        
        bytes32 structHash = keccak256(abi.encode(
            SESSION_OPERATION_TYPEHASH,
            sessionKey1,
            token,
            destination,
            spendAmount,
            nonce,
            executionHash
        ));
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKey1PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        bytes memory opData = abi.encode(sessionKey1, token, destination, spendAmount);
        
        // Execute should revert because key is not enabled
        vm.prank(owner);
        vm.expectRevert("GM: Key not enabled");
        governorModule.preExec(opData, digest, signature);
    }
    
    /// @notice Test preExec reverts for invalid signature
    function test_PreExec_RevertInvalidSignature() public {
        uint128 allowanceAmount = 100 ether;
        uint128 spendAmount = 50 ether;
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // Setup: enable key and set allowance
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        vm.prank(owner);
        governorModule.setAllowance(sessionKey1, destination, token, allowanceAmount, expiry);
        
        // Create operation hash and INVALID signature (using sessionKey2 private key instead)
        bytes32 executionHash = keccak256(abi.encodePacked("execution details"));
        uint256 nonce = governorModule.getNonce(sessionKey1);
        
        bytes32 structHash = keccak256(abi.encode(
            SESSION_OPERATION_TYPEHASH,
            sessionKey1,
            token,
            destination,
            spendAmount,
            nonce,
            executionHash
        ));
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKey2PrivateKey, digest); // Using WRONG private key
        bytes memory signature = abi.encodePacked(r, s, v);
        
        bytes memory opData = abi.encode(sessionKey1, token, destination, spendAmount);
        
        // Execute should revert due to invalid signature
        vm.prank(owner);
        vm.expectRevert("GM: Invalid EIP-712 signature");
        governorModule.preExec(opData, digest, signature);
    }
    
    /// @notice Test preExec reverts for expired allowance
    function test_PreExec_RevertExpiredAllowance() public {
        uint128 allowanceAmount = 100 ether;
        uint128 spendAmount = 50 ether;
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // Setup: enable key and set allowance
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        vm.prank(owner);
        governorModule.setAllowance(sessionKey1, destination, token, allowanceAmount, expiry);
        
        // Create operation hash and signature
        bytes32 executionHash = keccak256(abi.encodePacked("execution details"));
        uint256 nonce = governorModule.getNonce(sessionKey1);
        
        bytes32 structHash = keccak256(abi.encode(
            SESSION_OPERATION_TYPEHASH,
            sessionKey1,
            token,
            destination,
            spendAmount,
            nonce,
            executionHash
        ));
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKey1PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        bytes memory opData = abi.encode(sessionKey1, token, destination, spendAmount);
        
        // Warp time to after expiry
        vm.warp(block.timestamp + 2 days);
        
        // Execute should revert due to expired allowance
        vm.prank(owner);
        vm.expectRevert("GM: Allowance expired");
        governorModule.preExec(opData, digest, signature);
    }
    
    /// @notice Test preExec reverts for insufficient allowance
    function test_PreExec_RevertInsufficientAllowance() public {
        uint128 allowanceAmount = 100 ether;
        uint128 spendAmount = 200 ether; // More than allowance
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // Setup: enable key and set allowance
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        vm.prank(owner);
        governorModule.setAllowance(sessionKey1, destination, token, allowanceAmount, expiry);
        
        // Create operation hash and signature
        bytes32 executionHash = keccak256(abi.encodePacked("execution details"));
        uint256 nonce = governorModule.getNonce(sessionKey1);
        
        bytes32 structHash = keccak256(abi.encode(
            SESSION_OPERATION_TYPEHASH,
            sessionKey1,
            token,
            destination,
            spendAmount,
            nonce,
            executionHash
        ));
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKey1PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        bytes memory opData = abi.encode(sessionKey1, token, destination, spendAmount);
        
        // Execute should revert due to insufficient allowance
        vm.prank(owner);
        vm.expectRevert("GM: Insufficient allowance");
        governorModule.preExec(opData, digest, signature);
    }
    
    /// @notice Test postExec function (which should do nothing)
    function test_PostExec() public {
        // postExec should not revert and does nothing
        governorModule.postExec(bytes("test"), bytes32(0), true);
        // No assertions needed as function does nothing
    }
    
    /*//////////////////////////////////////////////////////////////
                              FUZZ TESTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Fuzz test for setting and using allowances
    function testFuzz_Allowance(uint128 allowanceAmount, uint128 spendAmount) public {
        // Ensure spendAmount <= allowanceAmount to avoid revert
        vm.assume(spendAmount > 0 && allowanceAmount >= spendAmount);
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // Setup: enable key and set allowance
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        vm.prank(owner);
        governorModule.setAllowance(sessionKey1, destination, token, allowanceAmount, expiry);
        
        // Create operation hash and signature
        bytes32 executionHash = keccak256(abi.encodePacked("execution details", spendAmount));
        uint256 nonce = governorModule.getNonce(sessionKey1);
        
        bytes32 structHash = keccak256(abi.encode(
            SESSION_OPERATION_TYPEHASH,
            sessionKey1,
            token,
            destination,
            spendAmount,
            nonce,
            executionHash
        ));
        
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKey1PrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        bytes memory opData = abi.encode(sessionKey1, token, destination, spendAmount);
        
        // Execute operation
        vm.prank(owner);
        governorModule.preExec(opData, digest, signature);
        
        // Verify allowance was decreased correctly
        (uint128 remainingAllowance,,) = governorModule.allowances(sessionKey1, destination, token);
        assertEq(remainingAllowance, allowanceAmount - spendAmount, "Remaining allowance incorrect");
    }
    
    /// @notice Fuzz test for multiple operations with the same key
    function testFuzz_MultipleOperations(uint128 allowanceAmount, uint128[] memory spendAmounts) public {
        // Bound array length and ensure total spend <= allowance
        vm.assume(spendAmounts.length > 0 && spendAmounts.length <= 5);
        uint128 totalSpend = 0;
        for (uint i = 0; i < spendAmounts.length; i++) {
            // Ensure each spend amount is positive
            vm.assume(spendAmounts[i] > 0);
            // Avoid overflow
            vm.assume(totalSpend + spendAmounts[i] >= totalSpend);
            totalSpend += spendAmounts[i];
        }
        vm.assume(allowanceAmount >= totalSpend);
        
        uint48 expiry = uint48(block.timestamp + 1 days);
        
        // Setup: enable key and set allowance
        vm.prank(owner);
        governorModule.enableSessionKey(sessionKey1);
        
        vm.prank(owner);
        governorModule.setAllowance(sessionKey1, destination, token, allowanceAmount, expiry);
        
        uint128 remainingAllowance = allowanceAmount;
        
        // Execute multiple operations
        for (uint i = 0; i < spendAmounts.length; i++) {
            uint128 spendAmount = spendAmounts[i];
            
            // Create operation hash and signature
            bytes32 executionHash = keccak256(abi.encodePacked("execution", i, spendAmount));
            uint256 nonce = governorModule.getNonce(sessionKey1);
            
            bytes32 structHash = keccak256(abi.encode(
                SESSION_OPERATION_TYPEHASH,
                sessionKey1,
                token,
                destination,
                spendAmount,
                nonce,
                executionHash
            ));
            
            bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
            (uint8 v, bytes32 r, bytes32 s) = vm.sign(sessionKey1PrivateKey, digest);
            bytes memory signature = abi.encodePacked(r, s, v);
            
            bytes memory opData = abi.encode(sessionKey1, token, destination, spendAmount);
            
            // Execute operation
            vm.prank(owner);
            governorModule.preExec(opData, digest, signature);
            
            // Update expected remaining allowance
            remainingAllowance -= spendAmount;
            
            // Verify allowance was decreased correctly
            (uint128 actualRemaining,,) = governorModule.allowances(sessionKey1, destination, token);
            assertEq(actualRemaining, remainingAllowance, "Remaining allowance incorrect after operation");
            
            // Verify nonce was increased
            assertEq(governorModule.getNonce(sessionKey1), nonce + 1, "Nonce should be increased");
        }
    }
} 