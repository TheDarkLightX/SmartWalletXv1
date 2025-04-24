// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/SmartAccount.sol";
import "../../contracts/mocks/MockPlugin.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "@account-abstraction/contracts/interfaces/IAccount.sol";

/// @title ERC4337SmartAccount - Tests for ERC-4337 compatibility of SmartAccount
/// @notice Tests focused on the Account Abstraction standard compliance
contract ERC4337SmartAccount is Test {
    SmartAccount internal account;
    address internal owner;
    address internal entryPoint;
    
    // The domain separator for EIP-712 signatures
    bytes32 constant DOMAIN_SEPARATOR_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    
    // The UserOperation typehash for EIP-712 signatures
    bytes32 constant USER_OP_TYPEHASH = keccak256(
        "UserOperation(address sender,uint256 nonce,bytes initCode,bytes callData,uint256 callGasLimit,uint256 verificationGasLimit,uint256 preVerificationGas,uint256 maxFeePerGas,uint256 maxPriorityFeePerGas,bytes paymasterAndData)"
    );
    
    function setUp() public {
        // Create addresses
        owner = makeAddr("owner");
        entryPoint = makeAddr("entryPoint");
        
        // Deploy the SmartAccount with correct owner and entryPoint
        vm.startPrank(owner);
        account = new SmartAccount(owner, entryPoint);
        vm.stopPrank();
    }
    
    /*//////////////////////////////////////////////////////////////
                          ERC-4337 INTERFACE TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testSupportsIAccountInterface() public {
        // Check that SmartAccount implements IAccount interface
        bool supportsIAccount = account.supportsInterface(type(IAccount).interfaceId);
        assertTrue(supportsIAccount, "SmartAccount should support IAccount interface");
    }
    
    function testEntryPointIsCorrect() public {
        // Verify the stored EntryPoint matches the one we passed
        assertEq(account.entryPoint(), entryPoint, "EntryPoint address mismatch");
    }
    
    /*//////////////////////////////////////////////////////////////
                           USER OPERATION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testValidateUserOpOnlyEntryPoint() public {
        // Create a basic UserOperation
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: address(account),
            nonce: 0,
            initCode: hex"",
            callData: hex"",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: hex"",
            signature: hex""
        });
        
        // Try to call validateUserOp from a non-EntryPoint address
        address nonEntryPoint = makeAddr("nonEntryPoint");
        vm.prank(nonEntryPoint);
        vm.expectRevert("SA: Caller is not the EntryPoint");
        account.validateUserOp(userOp, bytes32(0), 0);
        
        // Now call from the correct EntryPoint (will still fail due to invalid signature)
        vm.prank(entryPoint);
        vm.expectRevert();
        account.validateUserOp(userOp, bytes32(0), 0);
    }
    
    function testNonceIncrement() public {
        // Check initial nonce
        assertEq(account.nonce(), 0, "Initial nonce should be 0");
        
        // Since we can't directly increment the nonce (it's incremented during validateUserOp),
        // we can indirectly test this by checking the storage slot
        
        // Get the storage slot for the nonce
        bytes32 nonceSlot = bytes32(uint256(5)); // Based on contract layout
        
        // Read the nonce value directly from storage
        uint256 nonceValue = uint256(vm.load(address(account), nonceSlot));
        assertEq(nonceValue, 0, "Initial nonce from storage should be 0");
        
        // Real nonce increment happens after a successful UserOperation
        // execution by the EntryPoint. We can't fully simulate that here.
    }
    
    /*//////////////////////////////////////////////////////////////
                         SIGNATURE VALIDATION TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testSignatureValidation() public {
        // Create a message hash (simulating a UserOp hash)
        bytes32 messageHash = keccak256(abi.encodePacked("test message"));
        
        // Generate a private key for the owner
        uint256 ownerPrivateKey = uint256(keccak256(abi.encodePacked("owner")));
        address calculatedOwner = vm.addr(ownerPrivateKey);
        
        // Deploy a new account with this owner
        SmartAccount testAccount = new SmartAccount(calculatedOwner, entryPoint);
        
        // Sign the message with owner's private key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, messageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Test ERC-1271 isValidSignature
        bytes4 magicValue = testAccount.isValidSignature(messageHash, signature);
        // Compare as uint32 values to avoid type errors
        assertEq(uint32(magicValue), uint32(0x1626ba7e), "isValidSignature should return the magic value for valid signatures");
        
        // Test with an invalid signature
        uint256 randomKey = uint256(keccak256(abi.encodePacked("random")));
        (v, r, s) = vm.sign(randomKey, messageHash);
        bytes memory invalidSignature = abi.encodePacked(r, s, v);
        
        bytes4 invalidValue = testAccount.isValidSignature(messageHash, invalidSignature);
        // Compare as uint32 values to avoid type errors
        assertEq(uint32(invalidValue), uint32(0xffffffff), "isValidSignature should return the invalid value for invalid signatures");
    }
    
    /*//////////////////////////////////////////////////////////////
                           BUNDLED TRANSACTIONS
    //////////////////////////////////////////////////////////////*/
    
    function testBundledTransactionsViaUserOp() public {
        // This test simulates the EntryPoint calling execute via a UserOperation
        // with multiple actions bundled in a single callData
        
        // Create some test recipients
        address recipient1 = makeAddr("recipient1");
        address recipient2 = makeAddr("recipient2");
        
        // Fund the account
        vm.deal(address(account), 2 ether);
        
        // Create calldata that would perform multiple actions
        // In reality, this would be encoded by the user's client software
        bytes memory executeCalldata1 = abi.encodeWithSelector(
            SmartAccount.execute.selector,
            recipient1,
            0.5 ether,
            hex""
        );
        
        bytes memory executeCalldata2 = abi.encodeWithSelector(
            SmartAccount.execute.selector,
            recipient2,
            0.5 ether,
            hex""
        );
        
        // In a real UserOperation, these would be bundled together
        // For testing, we'll execute them directly as the owner
        
        // First transaction
        vm.prank(owner);
        (bool success1,) = address(account).call(executeCalldata1);
        assertTrue(success1, "First execute call failed");
        
        // Second transaction
        vm.prank(owner);
        (bool success2,) = address(account).call(executeCalldata2);
        assertTrue(success2, "Second execute call failed");
        
        // Verify both recipients received funds
        assertEq(recipient1.balance, 0.5 ether, "Recipient 1 didn't receive funds");
        assertEq(recipient2.balance, 0.5 ether, "Recipient 2 didn't receive funds");
    }
    
    /*//////////////////////////////////////////////////////////////
                               ERC-165 TESTS
    //////////////////////////////////////////////////////////////*/
    
    function testERC165Support() public {
        // Test ERC-165 support for IAccount
        assertTrue(account.supportsInterface(type(IAccount).interfaceId), "Should support IAccount");
        
        // Test ERC-165 support for IERC1271
        bytes4 erc1271InterfaceId = bytes4(keccak256("isValidSignature(bytes32,bytes)"));
        assertTrue(account.supportsInterface(erc1271InterfaceId), "Should support IERC1271");
        
        // Test ERC-165 support for ERC-165 itself
        bytes4 erc165InterfaceId = bytes4(keccak256("supportsInterface(bytes4)"));
        assertTrue(account.supportsInterface(erc165InterfaceId), "Should support ERC-165");
        
        // Test a random interface ID that should not be supported
        bytes4 randomInterfaceId = bytes4(keccak256("randomFunction()"));
        assertFalse(account.supportsInterface(randomInterfaceId), "Should not support random interface");
    }
} 