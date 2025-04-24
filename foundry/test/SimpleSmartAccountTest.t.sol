// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../../contracts/SmartAccount.sol";

contract SimpleSmartAccountTest is Test {
    SmartAccount internal account;
    address internal owner;
    address internal entryPoint;
    
    function setUp() public {
        // Create addresses
        owner = makeAddr("owner");
        entryPoint = makeAddr("entryPoint");
        
        // Deploy SmartAccount
        vm.prank(owner);
        account = new SmartAccount(owner, entryPoint);
    }
    
    function testOwnership() public {
        // Verify the owner was set correctly
        assertEq(account.owner(), owner);
    }
    
    function testEntryPoint() public {
        // Verify the entryPoint was set correctly
        assertEq(account.entryPoint(), entryPoint);
    }
    
    function testAddPlugin() public {
        // Create a plugin address
        address plugin = makeAddr("plugin");
        
        // Enable the plugin as owner
        vm.prank(owner);
        account.enablePlugin(plugin);
        
        // Verify the plugin was enabled
        assertTrue(account.isPlugin(plugin));
    }
    
    function testNonOwnerCannotAddPlugin() public {
        // Create a plugin address
        address plugin = makeAddr("plugin");
        address nonOwner = makeAddr("nonOwner");
        
        // Try to enable the plugin as non-owner - should fail
        vm.prank(nonOwner);
        vm.expectRevert("Ownable: caller is not the owner");
        account.enablePlugin(plugin);
    }
    
    function testReceiveEth() public {
        // Get the initial balance
        uint256 initialBalance = address(account).balance;
        
        // Send 1 ETH to the account
        vm.deal(address(this), 1 ether);
        (bool success,) = address(account).call{value: 1 ether}("");
        
        // Verify the ETH was received
        assertTrue(success);
        assertEq(address(account).balance, initialBalance + 1 ether);
    }

    // --- Fuzz Tests ---

    /// @dev Test that we can add and remove random plugin addresses
    function testFuzz_AddRemovePlugin(address randomPlugin) public {
        // Skip invalid addresses
        vm.assume(randomPlugin != address(0) && randomPlugin != address(account));
        
        // Enable the plugin as owner
        vm.prank(owner);
        account.enablePlugin(randomPlugin);
        
        // Verify the plugin was enabled
        assertTrue(account.isPlugin(randomPlugin));
        
        // Disable the plugin
        vm.prank(owner);
        account.disablePlugin(randomPlugin);
        
        // Verify the plugin was disabled
        assertFalse(account.isPlugin(randomPlugin));
    }
    
    /// @dev Test that we can set maxPlugins to various values
    function testFuzz_SetMaxPlugins(uint256 newMaxPlugins) public {
        // Bound to reasonable values
        newMaxPlugins = bound(newMaxPlugins, 1, 1000);
        
        // Set max plugins as owner
        vm.prank(owner);
        account.setMaxPlugins(newMaxPlugins);
        
        // Verify max plugins was updated
        assertEq(account.maxPlugins(), newMaxPlugins);
    }
    
    /// @dev Test that execute function works with simple parameters
    function testFuzz_ExecuteTransfer(uint96 valueToSend) public {
        // Create a recipient
        address recipient = makeAddr("recipient");
        
        // Bound to reasonable amounts (less than 1 ETH)
        uint256 value = bound(valueToSend, 0, 0.5 ether);
        
        // Fund the account
        vm.deal(address(account), 1 ether);
        
        // Execute as owner - simple ETH transfer with empty data
        vm.prank(owner);
        account.execute(recipient, value, "");
        
        // Verify the recipient received the funds
        assertEq(recipient.balance, value);
    }
} 