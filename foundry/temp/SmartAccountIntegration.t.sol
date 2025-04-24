// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/SmartAccount.sol";
import "../../contracts/mocks/MockPlugin.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

/// @title SmartAccountIntegration - Real-world integration tests for SmartAccount
/// @notice These tests focus on direct interactions with the actual SmartAccount implementation
contract SmartAccountIntegration is Test {
    SmartAccount internal account;
    address internal owner;
    address internal entryPoint;
    MockPlugin internal mockPlugin;
    
    // Test wallets
    address internal recipient;
    address internal user;
    
    // Common test values
    uint256 internal constant INITIAL_BALANCE = 10 ether;
    
    function setUp() public {
        // Create addresses
        owner = makeAddr("owner");
        entryPoint = makeAddr("entryPoint");
        recipient = makeAddr("recipient");
        user = makeAddr("user");
        
        vm.deal(owner, INITIAL_BALANCE);
        
        // Deploy actual SmartAccount
        vm.prank(owner);
        account = new SmartAccount(owner, entryPoint);
        
        // Fund the account
        vm.deal(address(account), INITIAL_BALANCE);
        
        // Deploy real MockPlugin for interaction testing
        mockPlugin = new MockPlugin();
    }
    
    /*//////////////////////////////////////////////////////////////
                           DIRECT ETH HANDLING
    //////////////////////////////////////////////////////////////*/
    
    function testDirectReceiveEth() public {
        uint256 initialBalance = address(account).balance;
        
        // Send ETH directly to the account
        vm.deal(user, 1 ether);
        vm.prank(user);
        (bool success, ) = address(account).call{value: 1 ether}("");
        
        assertTrue(success, "Direct ETH transfer to account failed");
        assertEq(address(account).balance, initialBalance + 1 ether, "Account balance incorrect after direct ETH transfer");
    }
    
    function testExecuteEthTransfer() public {
        uint256 initialBalance = address(account).balance;
        uint256 transferAmount = 1 ether;
        
        // Send ETH from the account to a recipient using execute
        vm.prank(owner);
        account.execute(recipient, transferAmount, "");
        
        assertEq(recipient.balance, transferAmount, "Recipient didn't receive ETH");
        assertEq(address(account).balance, initialBalance - transferAmount, "Account balance incorrect after transfer");
    }
    
    /*//////////////////////////////////////////////////////////////
                           REAL PLUGIN INTERACTIONS
    //////////////////////////////////////////////////////////////*/
    
    function testPluginLifecycleWithRealCalls() public {
        // Enable the real plugin
        vm.prank(owner);
        account.enablePlugin(address(mockPlugin));
        
        assertTrue(account.isPlugin(address(mockPlugin)), "Plugin not enabled");
        
        // Prepare data for execute that will trigger plugins
        address targetContract = makeAddr("target");
        uint256 value = 0.1 ether;
        bytes memory data = hex"12345678";
        
        // Create contract at target address that won't revert
        bytes memory code = abi.encodePacked(
            hex"6080604052348015600f57600080fd5b50600436106044577c01000000000000000000000000000000000000000000000000000000006000350463ffffffff168063c2985578146049575b600080fd5b604a005b00fea26469706673582212209c2b0d713575755f3a2753b8958d16d185ce9e81f39de6c4b77d905cf132742264736f6c634300081100330000000000000000000000000000000000000000"
        );
        vm.etch(targetContract, code);
        
        // Execute with active plugin - this should trigger preExec and postExec hooks
        vm.deal(address(account), 1 ether); // Make sure account has ETH
        vm.prank(owner);
        account.execute(targetContract, value, data);
        
        // Verify plugin hooks were called
        assertEq(mockPlugin.preExecCalls(), 1, "preExec not called on real plugin");
        assertEq(mockPlugin.postExecCalls(), 1, "postExec not called on real plugin");
        assertTrue(mockPlugin.lastSuccess(), "postExec reported failure");
        
        // Disable the plugin
        vm.prank(owner);
        account.disablePlugin(address(mockPlugin));
        
        assertFalse(account.isPlugin(address(mockPlugin)), "Plugin not disabled");
        
        // Reset plugin counters
        mockPlugin.resetCounters();
        
        // Execute again - should not trigger plugin hooks
        vm.prank(owner);
        account.execute(targetContract, value, data);
        
        // Verify plugin hooks were not called
        assertEq(mockPlugin.preExecCalls(), 0, "preExec called on disabled plugin");
        assertEq(mockPlugin.postExecCalls(), 0, "postExec called on disabled plugin");
    }
    
    /*//////////////////////////////////////////////////////////////
                      USER OPERATION VALIDATION FLOW
    //////////////////////////////////////////////////////////////*/
    
    function testCompleteUserOpValidationFlow() public {
        // Create a valid signature from owner
        bytes32 messageHash = keccak256("test message");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(keccak256(abi.encodePacked(owner))), messageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Enable plugin to test hooks in UserOp validation
        vm.prank(owner);
        account.enablePlugin(address(mockPlugin));
        
        // Set the nonce correctly
        assertEq(account.nonce(), 0, "Initial nonce should be 0");
        
        // Create a valid UserOp
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: address(account),
            nonce: 0,
            initCode: hex"",
            callData: hex"",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: hex"",
            signature: signature
        });
        
        // Nonce check should normally happen by the EntryPoint
        vm.expectRevert("SA: Invalid signature");
        vm.prank(entryPoint);
        account.validateUserOp(userOp, messageHash, 0);
        
        // Now create a proper test with correct signature
        // For a real test, we would need the actual EntryPoint contract and the proper EIP-712 hash
        // This is a simplified version to test that hooks are being triggered
        
        // At minimum, verify plugin hooks are triggered during validation
        uint256 preExecCallsBefore = mockPlugin.preExecCalls();
        
        // Call will still fail with invalid signature, but we can verify hooks are called
        vm.expectRevert("SA: Invalid signature");
        vm.prank(entryPoint);
        account.validateUserOp(userOp, messageHash, 0);
        
        // Verify plugin preExec hook was called during validation
        assertEq(mockPlugin.preExecCalls(), preExecCallsBefore + 1, "Plugin preExec not called during UserOp validation");
    }
    
    /*//////////////////////////////////////////////////////////////
                           EDGE CASES & REVERTS
    //////////////////////////////////////////////////////////////*/
    
    function testRevertOnNonOwnerExecute() public {
        vm.prank(user); // Not the owner
        vm.expectRevert("Ownable: caller is not the owner");
        account.execute(recipient, 1 ether, "");
    }
    
    function testRevertOnZeroAddressDestination() public {
        vm.prank(owner);
        vm.expectRevert("SA: Invalid destination address");
        account.execute(address(0), 1 ether, "");
    }
    
    function testRevertOnNonEntryPointValidation() public {
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
        
        vm.prank(user); // Not the EntryPoint
        vm.expectRevert("SA: Caller is not the EntryPoint");
        account.validateUserOp(userOp, bytes32(0), 0);
    }
    
    function testRevertOnExecutionFailure() public {
        // Create a contract that always reverts
        address reverter = makeAddr("reverter");
        bytes memory revertingCode = hex"60806040523480156100105760006000fd5b50600436106100305760003560e01c8063c298557814610035575b60006000fd5b61003d61003f565b005b60006000fd5b5b5660a165627a7a723058203d541fcb35abc3a1005914814b5ef4abf00e19e8d761326db897c0d7d0cc809d0029";
        vm.etch(reverter, revertingCode);
        
        // Call execute with reverting contract
        vm.prank(owner);
        vm.expectRevert("SA: Transaction execution failed");
        account.execute(reverter, 0, hex"c2985578");
    }
    
    /*//////////////////////////////////////////////////////////////
                              INVARIANTS
    //////////////////////////////////////////////////////////////*/
    
    function invariant_OwnerShouldNeverBeZeroAddress() public view {
        assertTrue(account.owner() != address(0), "Owner should never be zero address");
    }
    
    function invariant_EntryPointShouldBeImmutable() public view {
        assertEq(account.entryPoint(), entryPoint, "EntryPoint address changed");
    }
} 