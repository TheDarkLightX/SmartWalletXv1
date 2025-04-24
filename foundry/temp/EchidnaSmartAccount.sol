// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "../SmartAccount.sol";
import "../mocks/MockPlugin.sol";

// Cheatcodes interface (for vm.prank)
interface vm_cheatcodes {
    function prank(address) external;
}

/**
 * @title EchidnaSmartAccount
 * @dev Test contract for Echidna fuzz testing of SmartAccount
 * Run with: echidna-test contracts/test/EchidnaSmartAccount.sol --contract EchidnaSmartAccount --config echidna.config.yaml
 */
contract EchidnaSmartAccount {
    SmartAccount private account;
    address private owner;
    address private entryPoint;
    MockPlugin private plugin;
    
    address[] private plugins;
    mapping(address => bool) private pluginAdded;
    
    // Track contract state
    uint private pluginCount = 0;
    uint private maxPluginsValue = 10; // Default from SmartAccount
    
    constructor() {
        // Setup with fixed addresses for deterministic testing
        owner = address(0x10000);
        entryPoint = address(0x20000);
        
        // Deploy the SmartAccount
        account = new SmartAccount(owner, entryPoint);
        
        // Deploy a MockPlugin
        plugin = new MockPlugin();
    }
    
    // Helper function to call functions as owner
    function _asOwner() internal {
        vm_cheatcodes.prank(owner);
    }
    
    // Helper function for EntryPoint
    function _asEntryPoint() internal {
        vm_cheatcodes.prank(entryPoint);
    }
    
    /**
     * @dev Enable a plugin (valid address that hasn't been added)
     * @param pluginSeed Random seed for plugin address generation
     */
    function echidna_enable_plugin(uint256 pluginSeed) public {
        // Generate a deterministic plugin address that's not already added
        address pluginAddr = address(uint160(uint256(keccak256(abi.encodePacked(pluginSeed)))));
        
        // Skip invalid addresses
        if (pluginAddr == address(0) || pluginAddr == address(account) || pluginAdded[pluginAddr]) {
            return;
        }
        
        // Check if we can add more plugins
        if (pluginCount >= maxPluginsValue) {
            return;
        }
        
        // Enable plugin
        _asOwner();
        account.enablePlugin(pluginAddr);
        
        // Track state
        plugins.push(pluginAddr);
        pluginAdded[pluginAddr] = true;
        pluginCount++;
    }
    
    /**
     * @dev Disable a plugin that was previously added
     * @param pluginIndex Index of the plugin to disable
     */
    function echidna_disable_plugin(uint256 pluginIndex) public {
        // Skip if no plugins or invalid index
        if (pluginCount == 0 || pluginIndex >= pluginCount) {
            return;
        }
        
        // Get the plugin address to disable
        address pluginAddr = plugins[pluginIndex];
        
        // Disable plugin
        _asOwner();
        account.disablePlugin(pluginAddr);
        
        // Update state (remove by swapping with last element)
        pluginAdded[pluginAddr] = false;
        plugins[pluginIndex] = plugins[pluginCount - 1];
        plugins.pop();
        pluginCount--;
    }
    
    /**
     * @dev Change the max plugins value
     * @param newMaxPlugins New maximum plugin count
     */
    function echidna_set_max_plugins(uint256 newMaxPlugins) public {
        // Ensure value is reasonable and valid
        if (newMaxPlugins == 0 || newMaxPlugins > 1000) {
            return;
        }
        
        // Update max plugins
        _asOwner();
        account.setMaxPlugins(newMaxPlugins);
        
        // Update local state
        maxPluginsValue = newMaxPlugins;
    }
    
    // Property: Plugin count should never exceed max plugins
    function echidna_plugin_count_invariant() public view returns (bool) {
        return pluginCount <= maxPluginsValue;
    }
    
    // Property: Plugin count should match the length of our tracked plugins array
    function echidna_plugin_array_consistency() public view returns (bool) {
        return pluginCount == plugins.length;
    }
    
    // Property: Plugin count from the contract should match our tracked count
    function echidna_plugin_count_match() public view returns (bool) {
        address[] memory accountPlugins = account.getPlugins();
        return accountPlugins.length == pluginCount;
    }
} 