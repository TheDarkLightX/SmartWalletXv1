// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../../contracts/RecoveryGuard.sol";

// Mock GuardianManager for testing
contract MockGuardianManager {
    uint256 public proposedAt;
    bool public executed;
    uint256 public constant TIMELOCK = 48 hours;
    
    function setProposedAt(uint256 _proposedAt) external {
        proposedAt = _proposedAt;
    }
    
    function setExecuted(bool _executed) external {
        executed = _executed;
    }
}

/// @title RecoveryGuardTest - Comprehensive tests for RecoveryGuard contract
/// @notice Run with `forge test -vv --match-contract RecoveryGuardTest` inside the `foundry` directory
contract RecoveryGuardTest is Test {
    // Test contracts
    RecoveryGuard internal recoveryGuard;
    MockGuardianManager internal mockGM;
    
    // Test parameters
    bytes public contextData;
    bytes32 public contextHash;
    
    function setUp() public {
        // Deploy mock GuardianManager
        mockGM = new MockGuardianManager();
        
        // Deploy RecoveryGuard with mock GuardianManager
        recoveryGuard = new RecoveryGuard(address(mockGM));
        
        // Setup test parameters
        contextData = abi.encode("testData");
        contextHash = keccak256(abi.encodePacked("testHash"));
    }
    
    /*//////////////////////////////////////////////////////////////
                           STANDARD TESTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Test that constructor reverts with zero address
    function test_Constructor_RevertZeroAddress() public {
        vm.expectRevert("RecoveryGuard: Invalid GuardianManager address");
        new RecoveryGuard(address(0));
    }
    
    /// @notice Test that preExec allows execution when no recovery is proposed
    function test_PreExec_NoRecoveryProposed() public {
        // Set proposedAt to 0 (no recovery proposed)
        mockGM.setProposedAt(0);
        mockGM.setExecuted(false);
        
        // Should not revert
        uint256 result = recoveryGuard.preExec(contextData, contextHash);
        assertEq(result, 0, "preExec should return 0");
    }
    
    /// @notice Test that preExec allows execution when recovery is already executed
    function test_PreExec_RecoveryExecuted() public {
        // Set a recovery as proposed but already executed
        mockGM.setProposedAt(block.timestamp - 1 hours);
        mockGM.setExecuted(true);
        
        // Should not revert
        uint256 result = recoveryGuard.preExec(contextData, contextHash);
        assertEq(result, 0, "preExec should return 0");
    }
    
    /// @notice Test that preExec reverts during the timelock period
    function test_PreExec_RevertDuringTimelock() public {
        // Set a recovery as proposed but not yet executed
        uint256 proposedTime = block.timestamp - 1 hours;
        mockGM.setProposedAt(proposedTime);
        mockGM.setExecuted(false);
        
        // Should revert as we're within the timelock period
        vm.expectRevert("RG: Action blocked during recovery timelock");
        recoveryGuard.preExec(contextData, contextHash);
    }
    
    /// @notice Test that preExec allows execution before the proposed time
    function test_PreExec_AllowBeforeProposed() public {
        // Set a recovery as proposed in the future (shouldn't happen in real scenario, but testing edge case)
        uint256 proposedTime = block.timestamp + 1 hours;
        mockGM.setProposedAt(proposedTime);
        mockGM.setExecuted(false);
        
        // Should not revert as we're before the proposed time
        uint256 result = recoveryGuard.preExec(contextData, contextHash);
        assertEq(result, 0, "preExec should return 0");
    }
    
    /// @notice Test that preExec allows execution after the timelock period
    function test_PreExec_AllowAfterTimelock() public {
        // Set a recovery as proposed with timelock already passed
        uint256 proposedTime = block.timestamp - 49 hours; // More than TIMELOCK (48 hours)
        mockGM.setProposedAt(proposedTime);
        mockGM.setExecuted(false);
        
        // Should not revert as we're after the timelock period
        uint256 result = recoveryGuard.preExec(contextData, contextHash);
        assertEq(result, 0, "preExec should return 0");
    }
    
    /// @notice Test the postExec function (which should do nothing)
    function test_PostExec() public {
        // postExec should not revert and does nothing
        recoveryGuard.postExec(contextData, contextHash, true);
        // No assertions needed as function does nothing
    }
    
    /// @notice Test the boundary conditions of the timelock
    function test_PreExec_TimelockBoundaries() public {
        // Set a recovery as proposed
        uint256 proposedTime = block.timestamp - 1 hours;
        mockGM.setProposedAt(proposedTime);
        mockGM.setExecuted(false);
        
        // Should revert as we're within the timelock period
        vm.expectRevert("RG: Action blocked during recovery timelock");
        recoveryGuard.preExec(contextData, contextHash);
        
        // Set time to exactly when timelock ends
        uint256 timelockEnd = proposedTime + mockGM.TIMELOCK();
        vm.warp(timelockEnd);
        
        // Should not revert as we're at the end of the timelock period
        uint256 result = recoveryGuard.preExec(contextData, contextHash);
        assertEq(result, 0, "preExec should return 0 at timelock end");
        
        // Set time to 1 second before timelock ends
        vm.warp(timelockEnd - 1);
        
        // Should revert as we're still within the timelock period
        vm.expectRevert("RG: Action blocked during recovery timelock");
        recoveryGuard.preExec(contextData, contextHash);
    }
    
    /*//////////////////////////////////////////////////////////////
                              FUZZ TESTS
    //////////////////////////////////////////////////////////////*/
    
    /// @notice Fuzz test for preExec with varying proposed times
    function testFuzz_PreExec_VaryingProposedTimes(uint256 proposedTime) public {
        // Bound proposedTime to reasonable values
        proposedTime = bound(proposedTime, 1, type(uint256).max - mockGM.TIMELOCK());
        
        mockGM.setProposedAt(proposedTime);
        mockGM.setExecuted(false);
        
        // Calculate timelock end
        uint256 timelockEnd = proposedTime + mockGM.TIMELOCK();
        
        // If current time is before proposed or after timelock, should succeed
        if (block.timestamp < proposedTime || block.timestamp >= timelockEnd) {
            uint256 result = recoveryGuard.preExec(contextData, contextHash);
            assertEq(result, 0, "preExec should return 0");
        } 
        // If current time is within timelock period, should revert
        else {
            vm.expectRevert("RG: Action blocked during recovery timelock");
            recoveryGuard.preExec(contextData, contextHash);
        }
    }
    
    /// @notice Fuzz test for various execution states
    function testFuzz_PreExec_ExecutionStates(bool isExecuted, uint256 timeOffset) public {
        // Bound timeOffset to avoid overflow
        timeOffset = bound(timeOffset, 0, 100 days);
        
        uint256 proposedTime = block.timestamp - timeOffset;
        mockGM.setProposedAt(proposedTime > 0 ? proposedTime : 0); // Ensure proposedTime is not negative
        mockGM.setExecuted(isExecuted);
        
        // If executed or no recovery (proposedAt = 0), should always succeed
        if (isExecuted || proposedTime == 0) {
            uint256 result = recoveryGuard.preExec(contextData, contextHash);
            assertEq(result, 0, "preExec should return 0");
        } 
        // Otherwise, check timelock logic
        else {
            uint256 timelockEnd = proposedTime + mockGM.TIMELOCK();
            
            if (block.timestamp < proposedTime || block.timestamp >= timelockEnd) {
                uint256 result = recoveryGuard.preExec(contextData, contextHash);
                assertEq(result, 0, "preExec should return 0");
            } else {
                vm.expectRevert("RG: Action blocked during recovery timelock");
                recoveryGuard.preExec(contextData, contextHash);
            }
        }
    }
    
    /// @notice Fuzz test for postExec with different parameters
    function testFuzz_PostExec(bytes calldata fuzzContextData, bytes32 fuzzContextHash, bool success) public {
        // postExec should not revert with any parameters
        recoveryGuard.postExec(fuzzContextData, fuzzContextHash, success);
        // No assertions needed as function does nothing
    }
} 