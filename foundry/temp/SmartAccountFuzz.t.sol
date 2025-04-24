// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/SmartAccount.sol";
import "../../contracts/mocks/MockPlugin.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";

/// @title SmartAccountFuzz – basic fuzz & invariant tests for SmartAccount
/// @notice Run with `forge test -vv` inside the `foundry` directory
contract SmartAccountFuzz is Test {
    SmartAccount internal smart;
    address internal owner;
    address internal entryPoint;
    MockPlugin internal mockPlugin;

    function setUp() public {
        // Create owner and EntryPoint addresses
        owner = makeAddr("owner");
        entryPoint = makeAddr("entryPoint");
        
        // Deploy SmartAccount
        smart = new SmartAccount(owner, entryPoint);
        
        // Deploy a mock plugin for testing
        mockPlugin = new MockPlugin();
    }

    /*//////////////////////////////////////////////////////////////
                                 FUZZ
    //////////////////////////////////////////////////////////////*/

    /// @dev Fuzz enable/disable path – should never revert (except expected) and maintain isPlugin truthiness.
    function test_enableDisable_plugin(address plugin) public {
        vm.assume(plugin != address(0) && plugin != address(smart));

        // Enable as owner
        vm.prank(owner);
        smart.enablePlugin(plugin);
        assertTrue(smart.isPlugin(plugin));

        // Disable as owner
        vm.prank(owner);
        smart.disablePlugin(plugin);
        assertFalse(smart.isPlugin(plugin));
    }
    
    /// @dev Fuzz test for signature validation via ERC1271
    function testFuzz_isValidSignature(bytes32 messageHash, uint8 v, bytes32 r, bytes32 s) public {
        // Create signature from owner
        bytes memory signature = abi.encodePacked(r, s, v);
        
        // Recover the signer (for valid signatures, this should be the owner)
        address signer = ecrecover(messageHash, v, r, s);
        
        // If signature is valid for owner
        if (signer == owner) {
            // Should return magic value
            bytes4 result = smart.isValidSignature(messageHash, signature);
            assertEq(result, 0x1626ba7e, "Should return ERC1271_MAGIC_VALUE for valid signature");
        } else {
            // Should return invalid value
            bytes4 result = smart.isValidSignature(messageHash, signature);
            assertEq(result, 0xffffffff, "Should return ERC1271_INVALID_VALUE for invalid signature");
        }
    }
    
    /// @dev Fuzz test for execute function with varying parameters
    function testFuzz_execute(address dest, uint256 value, bytes calldata data) public {
        // Skip if destination is zero address
        vm.assume(dest != address(0));
        
        // Skip if destination is the smart account itself (would revert)
        vm.assume(dest != address(smart));
        
        // Ensure we have enough ETH balance
        vm.deal(address(smart), value > 0 ? value : 1 ether);
        
        // Create a mock contract destination that won't revert
        bytes memory code = abi.encodePacked(
            hex"6080604052348015600f57600080fd5b50600436106044577c01000000000000000000000000000000000000000000000000000000006000350463ffffffff168063c2985578146049575b600080fd5b604a005b00fea26469706673582212209c2b0d713575755f3a2753b8958d16d185ce9e81f39de6c4b77d905cf132742264736f6c634300081100330000000000000000000000000000000000000000"
        );
        vm.etch(dest, code);
        
        // Execute as owner
        vm.prank(owner);
        smart.execute(dest, value, data);
    }
    
    /// @dev Fuzz test for max plugins limit
    function testFuzz_MaxPluginsLimit(uint256 maxPluginsInput) public {
        // Bound max plugins to a reasonable range
        uint256 newMaxPlugins = bound(maxPluginsInput, 1, 1000);
        
        // Set max plugins as owner
        vm.prank(owner);
        smart.setMaxPlugins(newMaxPlugins);
        
        // Verify max plugins was updated
        assertEq(smart.maxPlugins(), newMaxPlugins, "maxPlugins not updated correctly");
        
        // Try to set invalid max plugins (0)
        vm.expectRevert("SA: Max plugins must be > 0");
        vm.prank(owner);
        smart.setMaxPlugins(0);
    }
    
    /// @dev Fuzz test for enabling multiple plugins up to maxPlugins
    function testFuzz_EnableMultiplePlugins(uint256 pluginCount) public {
        // Bound plugin count to a reasonable range
        pluginCount = bound(pluginCount, 1, 20);
        
        // Set max plugins
        vm.prank(owner);
        smart.setMaxPlugins(pluginCount);
        
        // Create and enable multiple plugins
        address[] memory plugins = new address[](pluginCount);
        for (uint256 i = 0; i < pluginCount; i++) {
            plugins[i] = makeAddr(string(abi.encodePacked("plugin", vm.toString(i))));
            vm.prank(owner);
            smart.enablePlugin(plugins[i]);
        }
        
        // Verify all plugins were enabled
        address[] memory activePlugins = smart.getPlugins();
        assertEq(activePlugins.length, pluginCount, "Plugin count mismatch");
        
        // Try to add one more plugin (should fail)
        address extraPlugin = makeAddr("extraPlugin");
        vm.expectRevert("SA: Max plugins reached");
        vm.prank(owner);
        smart.enablePlugin(extraPlugin);
    }
    
    /// @dev Fuzz test for validateUserOp with different signatures
    function testFuzz_validateUserOp(bytes calldata signature) public {
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
        
        // Create EIP-712 hash (simplified for testing)
        bytes32 userOpHash = keccak256(abi.encode(userOp));
        
        // Try to validate user op - should revert if signature is not valid
        vm.prank(entryPoint);
        vm.expectRevert("SA: Invalid signature");
        smart.validateUserOp(userOp, userOpHash, 0);
    }

    /*//////////////////////////////////////////////////////////////
                              INVARIANTS
    //////////////////////////////////////////////////////////////*/

    // Invariant: plugins length must never exceed maxPlugins
    function invariant_PluginCountBounded() public {
        uint256 len = smart.getPlugins().length;
        assertLe(len, smart.maxPlugins());
    }
    
    // Invariant: Only EntryPoint can call validateUserOp
    function invariant_OnlyEntryPointValidateUserOp() public {
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
        
        bytes32 userOpHash = keccak256(abi.encode(userOp));
        
        // Call from an address that is not EntryPoint - should revert
        address nonEntryPoint = makeAddr("nonEntryPoint");
        vm.assume(nonEntryPoint != entryPoint);
        
        vm.prank(nonEntryPoint);
        vm.expectRevert("SA: Caller is not the EntryPoint");
        smart.validateUserOp(userOp, userOpHash, 0);
    }
} 