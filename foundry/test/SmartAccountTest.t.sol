// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/SmartAccount.sol";
import "../../contracts/mocks/MockPlugin.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

/// @title SmartAccountTest – comprehensive unit tests for SmartAccount
/// @notice Run with `forge test -vv` inside the `foundry` directory
contract SmartAccountTest is Test {
    SmartAccount internal smart;
    address internal owner;
    address internal entryPoint;
    MockPlugin internal plugin1;
    MockPlugin internal plugin2;
    uint256 internal ownerPrivateKey;
    
    bytes4 internal constant ERC1271_MAGIC_VALUE = 0x1626ba7e;
    bytes4 internal constant ERC1271_INVALID_VALUE = 0xffffffff;

    function setUp() public {
        // Generate owner with private key for signing
        ownerPrivateKey = 0x1234;
        owner = vm.addr(ownerPrivateKey);
        
        // Create EntryPoint address
        entryPoint = makeAddr("entryPoint");
        
        // Deploy SmartAccount
        smart = new SmartAccount(owner, entryPoint);
        
        // Deploy mock plugins for testing
        plugin1 = new MockPlugin();
        plugin2 = new MockPlugin();
        
        // Fund account with ETH for tests
        vm.deal(address(smart), 10 ether);
    }
    
    /*//////////////////////////////////////////////////////////////
                            BASIC FUNCTIONALITY
    //////////////////////////////////////////////////////////////*/
    
    function test_Initialization() public {
        // Verify basic setup
        assertEq(smart.owner(), owner);
        assertEq(smart.entryPoint(), entryPoint);
        assertEq(smart.getPlugins().length, 0);
        assertEq(smart.maxPlugins(), 10); // Default max plugins
    }
    
    function test_InitializationFailure() public {
        // Should revert if owner is zero address
        vm.expectRevert("SA: Owner cannot be 0");
        new SmartAccount(address(0), entryPoint);
        
        // Should revert if entryPoint is zero address
        vm.expectRevert("SA: EntryPoint cannot be 0");
        new SmartAccount(owner, address(0));
    }
    
    /*//////////////////////////////////////////////////////////////
                            PLUGIN MANAGEMENT
    //////////////////////////////////////////////////////////////*/
    
    function test_EnablePlugin() public {
        // Enable plugin as owner
        vm.prank(owner);
        smart.enablePlugin(address(plugin1));
        
        // Verify plugin was enabled
        assertTrue(smart.isPlugin(address(plugin1)));
        assertEq(smart.getPlugins().length, 1);
        assertEq(smart.getPlugins()[0], address(plugin1));
    }
    
    function test_EnablePluginUnauthorized() public {
        // Try to enable plugin as non-owner
        address nonOwner = makeAddr("nonOwner");
        vm.prank(nonOwner);
        vm.expectRevert("SA: Only owner can enable plugins");
        smart.enablePlugin(address(plugin1));
    }
    
    function test_EnableZeroAddressPlugin() public {
        // Try to enable zero address plugin
        vm.prank(owner);
        vm.expectRevert("SA: Plugin cannot be 0");
        smart.enablePlugin(address(0));
    }
    
    function test_EnableSelfAsPlugin() public {
        // Try to enable SmartAccount as its own plugin
        vm.prank(owner);
        vm.expectRevert("SA: Cannot add self as plugin");
        smart.enablePlugin(address(smart));
    }
    
    function test_EnableDuplicatePlugin() public {
        // Enable plugin first time
        vm.prank(owner);
        smart.enablePlugin(address(plugin1));
        
        // Try to enable same plugin again
        vm.prank(owner);
        vm.expectRevert("SA: Plugin already enabled");
        smart.enablePlugin(address(plugin1));
    }
    
    function test_DisablePlugin() public {
        // Enable plugin first
        vm.prank(owner);
        smart.enablePlugin(address(plugin1));
        
        // Disable plugin
        vm.prank(owner);
        smart.disablePlugin(address(plugin1));
        
        // Verify plugin was disabled
        assertFalse(smart.isPlugin(address(plugin1)));
        assertEq(smart.getPlugins().length, 0);
    }
    
    function test_DisablePluginUnauthorized() public {
        // Enable plugin first
        vm.prank(owner);
        smart.enablePlugin(address(plugin1));
        
        // Try to disable plugin as non-owner
        address nonOwner = makeAddr("nonOwner");
        vm.prank(nonOwner);
        vm.expectRevert("SA: Only owner can disable plugins");
        smart.disablePlugin(address(plugin1));
    }
    
    function test_DisableNonExistentPlugin() public {
        // Try to disable plugin that isn't enabled
        vm.prank(owner);
        vm.expectRevert("SA: Plugin not enabled");
        smart.disablePlugin(address(plugin1));
    }
    
    function test_MaxPluginsLimit() public {
        // Set max plugins to 2
        vm.prank(owner);
        smart.setMaxPlugins(2);
        
        // Add 2 plugins
        vm.startPrank(owner);
        smart.enablePlugin(address(plugin1));
        smart.enablePlugin(address(plugin2));
        vm.stopPrank();
        
        // Try to add a third plugin
        address plugin3 = address(new MockPlugin());
        vm.prank(owner);
        vm.expectRevert("SA: Max plugins reached");
        smart.enablePlugin(plugin3);
        
        // Verify state
        assertEq(smart.getPlugins().length, 2);
        assertEq(smart.maxPlugins(), 2);
    }
    
    function test_SetMaxPlugins() public {
        // Set max plugins to 5
        vm.prank(owner);
        smart.setMaxPlugins(5);
        
        // Verify update
        assertEq(smart.maxPlugins(), 5);
    }
    
    function test_SetMaxPluginsUnauthorized() public {
        // Try to set max plugins as non-owner
        address nonOwner = makeAddr("nonOwner");
        vm.prank(nonOwner);
        vm.expectRevert("SA: Only owner can set max plugins");
        smart.setMaxPlugins(5);
    }
    
    function test_SetInvalidMaxPlugins() public {
        // Try to set max plugins to 0
        vm.prank(owner);
        vm.expectRevert("SA: Max plugins must be > 0");
        smart.setMaxPlugins(0);
    }
    
    /*//////////////////////////////////////////////////////////////
                            EXECUTE FUNCTIONALITY
    //////////////////////////////////////////////////////////////*/
    
    function test_Execute() public {
        // Create test contract destination
        address destination = makeAddr("destination");
        bytes memory code = abi.encodePacked(
            hex"6080604052348015600f57600080fd5b50600436106044577c01000000000000000000000000000000000000000000000000000000006000350463ffffffff168063c2985578146049575b600080fd5b604a005b00fea26469706673582212209c2b0d713575755f3a2753b8958d16d185ce9e81f39de6c4b77d905cf132742264736f6c634300081100330000000000000000000000000000000000000000"
        );
        vm.etch(destination, code);
        
        // Execute transaction
        uint256 value = 1 ether;
        bytes memory data = hex"c2985578"; // Simple function call
        
        uint256 initialBalance = address(destination).balance;
        
        vm.prank(owner);
        smart.execute(destination, value, data);
        
        // Verify ETH transfer
        assertEq(address(destination).balance, initialBalance + value);
    }
    
    function test_ExecuteUnauthorized() public {
        // Try to execute as non-owner
        address nonOwner = makeAddr("nonOwner");
        vm.prank(nonOwner);
        vm.expectRevert("SA: Caller is not owner or entryPoint");
        smart.execute(makeAddr("destination"), 0, hex"");
    }
    
    function test_ExecuteFromEntryPoint() public {
        // Execute from entryPoint
        address destination = makeAddr("destination");
        vm.prank(entryPoint);
        smart.execute(destination, 0, hex"");
        // Should succeed
    }
    
    /*//////////////////////////////////////////////////////////////
                            ERC1271 SIGNATURE VALIDATION
    //////////////////////////////////////////////////////////////*/
    
    function test_ValidSignature() public {
        // Create hash and signature
        bytes32 messageHash = keccak256("test message");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, messageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Validate signature
        bytes4 result = smart.isValidSignature(messageHash, signature);
        assertEq(result, ERC1271_MAGIC_VALUE);
    }
    
    function test_InvalidSignature() public {
        // Create hash and invalid signature (from wrong key)
        bytes32 messageHash = keccak256("test message");
        uint256 wrongKey = 0x5678;
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongKey, messageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Validate signature
        bytes4 result = smart.isValidSignature(messageHash, signature);
        assertEq(result, ERC1271_INVALID_VALUE);
    }
    
    /*//////////////////////////////////////////////////////////////
                            AA FUNCTIONALITY
    //////////////////////////////////////////////////////////////*/
    
    function test_ValidateUserOp() public {
        // Create valid user op with owner signature
        bytes32 userOpHash = keccak256("test user op hash");
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(ownerPrivateKey, userOpHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: address(smart),
            nonce: 0,
            initCode: hex"",
            callData: hex"",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: hex"",
            signature: signature
        });
        
        // Validate user op as entry point
        vm.prank(entryPoint);
        uint256 validationData = smart.validateUserOp(userOp, userOpHash, 0);
        
        // Verify successful validation (validationData should be 0)
        assertEq(validationData, 0);
    }
    
    function test_ValidateUserOpUnauthorized() public {
        // Try to validate from non-entryPoint address
        address nonEntryPoint = makeAddr("nonEntryPoint");
        
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: address(smart),
            nonce: 0,
            initCode: hex"",
            callData: hex"",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: hex"",
            signature: hex""
        });
        
        vm.prank(nonEntryPoint);
        vm.expectRevert("SA: Caller is not the EntryPoint");
        smart.validateUserOp(userOp, bytes32(0), 0);
    }
    
    function test_ValidateUserOpInvalidSignature() public {
        // Create user op with invalid signature
        bytes memory invalidSignature = hex"deadbeef";
        
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: address(smart),
            nonce: 0,
            initCode: hex"",
            callData: hex"",
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: hex"",
            signature: invalidSignature
        });
        
        // Validate user op as entry point
        vm.prank(entryPoint);
        vm.expectRevert("SA: Invalid signature");
        smart.validateUserOp(userOp, bytes32(0), 0);
    }
    
    /*//////////////////////////////////////////////////////////////
                            RECEIVE FUNCTIONALITY
    //////////////////////////////////////////////////////////////*/
    
    function test_ReceiveEther() public {
        // Send ETH to the account
        uint256 initialBalance = address(smart).balance;
        uint256 sendAmount = 1 ether;
        
        (bool success,) = address(smart).call{value: sendAmount}("");
        assertTrue(success);
        
        // Verify balance increased
        assertEq(address(smart).balance, initialBalance + sendAmount);
    }
} 