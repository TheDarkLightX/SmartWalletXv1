// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23; // Standardized Pragma

// Interface for the GuardianManager contract
interface IGuardianManager {
    function proposedAt() external view returns (uint256);
    function executed() external view returns (bool);
    function TIMELOCK() external view returns (uint256); // Assumes TIMELOCK is viewable
}

/**
 * @title RecoveryGuard
 * @dev A guard intended to interact with a GuardianManager during a recovery process.
 * Its primary function appears to be blocking actions during the recovery timelock.
 * Incorporates fixes based on Audit #1 and Audit #2 findings/discussions.
 */
contract RecoveryGuard {
    IGuardianManager public immutable gm; // Address of the GuardianManager

    /**
     * @dev Note (Audit Finding High): This guard's functionality is critically dependent
     * on the provided `guardianManager` address correctly implementing the
     * `IGuardianManager` interface (`proposedAt()`, `executed()`, `TIMELOCK()`).
     * The primary fix for the related High severity audit finding lies within
     * the implementation of the GuardianManager contract itself.
     */
    constructor(address guardianManager) {
        require(guardianManager != address(0), "RecoveryGuard: Invalid GuardianManager address");
        gm = IGuardianManager(guardianManager);
    }

    /**
     * @notice Pre-execution hook. Checks if a recovery process is active and within its timelock period.
     * @dev This function REVERTS if a recovery is proposed, not yet executed, AND
     * the current timestamp is within the timelock period [proposed, proposed + TIMELOCK).
     * It ALLOWS execution if no recovery is active OR if the timelock has passed.
     * @return uint256 Returns 0 (no gas cost estimate), assuming handled elsewhere.
     */
    function preExec(bytes calldata /* contextData */, bytes32 /* contextHash */) external view returns (uint256) {
        // Parameters commented out to silence unused warnings

        uint256 proposed = gm.proposedAt();

        // Only apply guard logic if a recovery is proposed and not yet executed
        if (proposed != 0 && !gm.executed()) {
            uint256 timelockEnd = proposed + gm.TIMELOCK();
            // @dev Warning: Logic assumes the intent is to block execution *during* the timelock.
            // Timelock period is [proposed, proposed + TIMELOCK).
            // Block if current time is within this period.
            // Logic fixed for >= based on Audit #2 low severity finding discussion.
            require(block.timestamp < proposed || block.timestamp >= timelockEnd, "RG: Action blocked during recovery timelock");
        }
        // If no recovery is active or it's already executed, the guard allows execution (returns 0).
        return 0;
    }

    /**
     * @notice Post-execution hook. Currently performs no actions.
     */
    function postExec(bytes calldata /* contextData */, bytes32 /* contextHash */, bool /* success */) external pure {
        // Parameters commented out to silence unused warnings
        // No actions needed in postExec for this guard.
    }
}

