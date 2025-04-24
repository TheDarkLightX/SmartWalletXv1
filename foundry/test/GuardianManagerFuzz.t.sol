// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/GuardianManager.sol";
import "../../contracts/SmartAccount.sol";

/// @title GuardianManagerFuzz - Fuzz & invariant tests for GuardianManager
/// @notice Run with `forge test -vv` inside the `foundry` directory
contract GuardianManagerFuzz is Test {
    GuardianManager internal guardian;
    SmartAccount internal wallet;
    address internal constant ENTRY_POINT = address(0x1234);
    address internal owner;
    address[] internal initialGuardians;
    
    function setUp() public {
        // Create owner with this contract as the EntryPoint
        owner = makeAddr("owner");
        
        // Deploy the SmartAccount 
        wallet = new SmartAccount(owner, ENTRY_POINT);
        
        // Set up initial guardians
        address guard1 = makeAddr("guardian1");
        address guard2 = makeAddr("guardian2");
        address guard3 = makeAddr("guardian3");
        initialGuardians = new address[](3);
        initialGuardians[0] = guard1;
        initialGuardians[1] = guard2;
        initialGuardians[2] = guard3;
        
        // Deploy the GuardianManager
        guardian = new GuardianManager(
            address(wallet), 
            owner, 
            initialGuardians, 
            2 // Initial threshold
        );
    }

    /*//////////////////////////////////////////////////////////////
                                 FUZZ
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Fuzz test for adding and removing guardians
    function testFuzz_AddRemoveGuardian(address newGuardian) public {
        // Filter out zero address and existing guardians
        vm.assume(newGuardian != address(0));
        vm.assume(newGuardian != initialGuardians[0]);
        vm.assume(newGuardian != initialGuardians[1]);
        vm.assume(newGuardian != initialGuardians[2]);
        
        // Add guardian (as owner)
        vm.prank(owner);
        guardian.addGuardian(newGuardian);
        
        // Verify guardian was added
        address[] memory guardians = guardian.getGuardians();
        bool found = false;
        for (uint i = 0; i < guardians.length; i++) {
            if (guardians[i] == newGuardian) {
                found = true;
                break;
            }
        }
        assertTrue(found, "Guardian was not added correctly");
        assertTrue(guardian.isGuardian(newGuardian), "isGuardian check failed");
        
        // Remove guardian (as owner)
        vm.prank(owner);
        guardian.removeGuardian(newGuardian);
        
        // Verify guardian was removed
        guardians = guardian.getGuardians();
        found = false;
        for (uint i = 0; i < guardians.length; i++) {
            if (guardians[i] == newGuardian) {
                found = true;
                break;
            }
        }
        assertFalse(found, "Guardian was not removed correctly");
        assertFalse(guardian.isGuardian(newGuardian), "isGuardian should be false");
    }
    
    /// @dev Fuzz test for the recovery process
    function testFuzz_RecoveryProcess(address newAccount) public {
        // Filter out zero address and existing guardians
        vm.assume(newAccount != address(0));
        
        // Propose recovery as a guardian
        vm.prank(initialGuardians[0]);
        guardian.proposeRecovery(newAccount);
        
        // Approve recovery by required number of guardians
        vm.prank(initialGuardians[0]);
        guardian.approveRecovery();
        
        vm.prank(initialGuardians[1]);
        guardian.approveRecovery();
        
        // Warp time to after timelock period (72 hours)
        vm.warp(block.timestamp + 72 hours + 1);
        
        // Finalize recovery (anyone can call)
        guardian.finalizeRecovery();
        
        // Verify ownership was transferred
        assertEq(wallet.owner(), newAccount, "Wallet ownership not transferred");
    }
    
    /// @dev Fuzz test for owner cancelling recovery
    function testFuzz_OwnerCancelRecovery(address newAccount) public {
        // Filter out zero address
        vm.assume(newAccount != address(0));
        
        // Propose recovery as a guardian
        vm.prank(initialGuardians[0]);
        guardian.proposeRecovery(newAccount);
        
        // Current owner cancels recovery
        vm.prank(owner);
        guardian.cancelRecovery();
        
        // Attempt to approve - should revert
        vm.expectRevert("GM: No recovery active");
        vm.prank(initialGuardians[1]);
        guardian.approveRecovery();
    }
    
    /*//////////////////////////////////////////////////////////////
                              INVARIANTS
    //////////////////////////////////////////////////////////////*/
    
    /// @dev Invariant: threshold should never be greater than guardian count
    function invariant_ThresholdNotGreaterThanGuardianCount() public {
        uint256 threshold = guardian.threshold();
        uint256 guardianCount = guardian.getGuardians().length;
        
        // If there are no guardians, threshold should be 0
        if (guardianCount == 0) {
            assertEq(threshold, 0, "Threshold should be 0 when no guardians");
        } else {
            // Otherwise threshold should be between 1 and guardianCount
            assertTrue(threshold > 0, "Threshold should be positive when guardians exist");
            assertTrue(threshold <= guardianCount, "Threshold must not exceed guardian count");
        }
    }
} 