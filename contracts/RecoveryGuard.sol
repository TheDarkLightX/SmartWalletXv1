// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28; // Standardized Pragma

// --- Interfaces ---
/**
 * @title IGuardianManager
 * @notice Interface for interacting with the GuardianManager contract
 * @dev The RecoveryGuard depends on these functions to determine recovery status
 */
interface IGuardianManager {
    /** @notice Returns the timestamp when the current recovery was proposed */
    function proposedAt() external view returns (uint256);
    
    /** @notice Returns whether the recovery process has been executed */
    function executed() external view returns (bool);
    
    /** @notice Returns the timelock duration required for the recovery process */
    function TIMELOCK() external view returns (uint256);
}

/**
 * @title RecoveryGuard
 * @notice A security guard that blocks wallet operations during an active recovery process.
 * This contract serves as a protective mechanism that prevents potentially malicious
 * transactions from being executed while a social recovery process is in progress.
 * @dev Designed to work with a GuardianManager contract that implements the IGuardianManager
 * interface. The guard checks the recovery status via the GuardianManager and reverts
 * transactions that are attempted during the timelock period of an active recovery.
 * Incorporates fixes based on Audit #1 and Audit #2 findings.
 */
contract RecoveryGuard {
    // --- State ---
    /** @notice Immutable reference to the GuardianManager contract */
    IGuardianManager public immutable gm;

    // --- Constructor ---
    /**
     * @notice Deploys the RecoveryGuard with a reference to the GuardianManager.
     * @dev Sets an immutable reference to the GuardianManager contract that will be
     * used to check recovery status. This guard's functionality is critically dependent
     * on the provided address correctly implementing the IGuardianManager interface.
     * @param guardianManager The address of the GuardianManager contract.
     */
    constructor(address guardianManager) {
        require(guardianManager != address(0), "RecoveryGuard: Invalid GuardianManager address");
        gm = IGuardianManager(guardianManager);
    }

    /**
     * @notice Pre-execution hook that checks if a recovery process is active.
     * @dev This function REVERTS if a recovery is proposed, not yet executed, AND
     * the current timestamp is within the timelock period [proposed, proposed + TIMELOCK).
     * It ALLOWS execution if no recovery is active OR if the timelock has passed.
     * The timelock boundary condition was fixed based on Audit #2 findings.
     * @param contextData Execution context data (unused but included for interface compatibility)
     * @param contextHash Hash of execution context (unused but included for interface compatibility)
     * @return uint256 Returns 0 (no gas cost estimate), assuming gas handling occurs elsewhere.
     */
    function preExec(bytes calldata contextData, bytes32 contextHash) external view returns (uint256) {
        // Silence unused variable warnings
        contextData;
        contextHash;

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
     * @notice Post-execution hook called after a transaction is executed.
     * @dev This function is included for interface compatibility but performs no actions.
     * Future versions might implement additional checks or logging after execution.
     * @param contextData Execution context data (unused but included for interface compatibility)
     * @param contextHash Hash of execution context (unused but included for interface compatibility)
     * @param success Whether the execution was successful (unused but included for interface compatibility)
     */
    function postExec(bytes calldata contextData, bytes32 contextHash, bool success) external pure {
        // Silence unused variable warnings
        contextData;
        contextHash;
        success;
        // No actions needed in postExec for this guard.
    }
}

