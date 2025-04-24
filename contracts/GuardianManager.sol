// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28; // Standardized Pragma

import "@openzeppelin/contracts/access/Ownable.sol"; // OZ v4.x Ownable
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol"; // OZ v4.x EnumerableSet

// Interface assumption for Smart Account owner check
interface ISmartAccount {
    function owner() external view returns (address);
    function transferOwnership(address newOwner) external;
}

/**
 * @title GuardianManager
 * @dev Manages guardians and the social recovery process for an associated SmartAccount.
 * Allows proposing a new owner, guardian voting, and finalization after a timelock.
 * Includes an emergency bypass for the original owner.
 * Incorporates fixes based on Audit #1 and Audit #2, adjusted for OZv4.
 */
contract GuardianManager is Ownable { // Inherits OZv4 Ownable
    using EnumerableSet for EnumerableSet.AddressSet;

    // --- Structs ---
    struct Recovery {
        address newOwner;       // The proposed new owner address
        uint256 approvals;      // Counter for guardian approvals
        uint256 proposedAt;     // Timestamp when the recovery was proposed
        bool executed;          // Flag indicating if recovery has been finalized
        mapping(address => bool) voted; // Tracks which guardians have voted in this proposal
    }

    // --- Events ---
    event GuardianAdded(address indexed guardian);
    event GuardianRemoved(address indexed guardian);
    event ThresholdChanged(uint256 newThreshold); // Added for clarity
    event RecoveryProposed(address indexed newOwner);
    event RecoveryApproved(address indexed guardian);
    event RecoveryCancelled(address indexed canceller); // Added canceller
    event RecoveryFinalised(address indexed newOwner);
    event RecoveryCancelledByOwner(address indexed owner); // Renamed from previous draft

    // --- Constants ---
    uint256 public constant TIMELOCK = 72 hours; // 3 days

    // --- State ---
    EnumerableSet.AddressSet private guardians; // Set of guardian addresses
    uint256 public threshold; // Minimum approvals needed for recovery
    Recovery private recovery; // Stores the single active/last recovery attempt
    address public immutable wallet; // The SmartAccount this manager controls recovery for

    // --- Constructor ---
    // Sets the target wallet, initial owner (of this contract), and initial threshold
    // Uses _transferOwnership for OZ v4.x compatibility
    constructor(
        address walletAddress,
        address _initialOwner, // Renamed parameter
        address[] memory initialGuardians,
        uint256 initialThreshold
    ) { // OZv4 Ownable constructor is implicit
        require(walletAddress != address(0), "GM: Invalid wallet address"); // Using GM: prefix
        require(_initialOwner != address(0), "GM: Invalid initial owner");
        wallet = walletAddress;
        _transferOwnership(_initialOwner); // Set initial owner using OZ v4 pattern

        // Add initial guardians
        for (uint i = 0; i < initialGuardians.length; i++) {
            require(initialGuardians[i] != address(0), "GM: Invalid initial guardian address");
            require(guardians.add(initialGuardians[i]), "GM: Duplicate initial guardian");
            emit GuardianAdded(initialGuardians[i]);
        }

        // Set initial threshold
        uint256 guardianCount = guardians.length();
        require(guardianCount > 0, "GM: Must have at least one guardian");
        require(initialThreshold > 0, "GM: Initial threshold must be > 0");
        require(initialThreshold <= guardianCount, "GM: Initial threshold > guardian count");
        threshold = initialThreshold;
        emit ThresholdChanged(initialThreshold);
    }

    // --- Views ---

    /**
     * @notice Returns the timestamp when the current recovery was proposed. Returns 0 if none active.
     */
    function proposedAt() external view returns (uint256) {
        return recovery.proposedAt;
    }

    /**
     * @notice Returns true if the current recovery proposal has been executed.
     */
    function executed() external view returns (bool) {
        return recovery.executed;
    }

    /**
     * @notice Returns the list of current guardian addresses.
     */
    function getGuardians() external view returns (address[] memory) {
        return guardians.values();
    }

    /**
     * @notice Checks if a given account is currently a guardian.
     */
    function isGuardian(address account) external view returns (bool) {
        return guardians.contains(account);
    }

    // --- Guardian Management (Owner Only) ---

    /**
     * @notice Adds a new guardian.
     * @dev Callable only by the owner of this GuardianManager contract.
     */
    function addGuardian(address guardian) external onlyOwner {
        require(guardian != address(0), "GM: Guardian cannot be zero address");
        require(guardians.add(guardian), "GM: Guardian already exists");
        emit GuardianAdded(guardian);
    }

    /**
     * @notice Removes an existing guardian.
     * @dev Callable only by the owner of this GuardianManager contract.
     * Adjusts threshold downwards if necessary to remain valid.
     */
    function removeGuardian(address guardian) external onlyOwner {
        require(guardians.remove(guardian), "GM: Guardian does not exist");
        emit GuardianRemoved(guardian);

        uint256 currentGuardians = guardians.length();
        // Prevent setting threshold to 0 unless last guardian is removed
        if (threshold > currentGuardians && currentGuardians > 0) {
            threshold = currentGuardians;
            emit ThresholdChanged(threshold);
        } else if (currentGuardians == 0) {
             // If last guardian removed, recovery is impossible. Set threshold to 0.
             threshold = 0;
             emit ThresholdChanged(0);
        }
        // Consider if an active recovery should be cancelled if threshold becomes un-meetable.
    }

    /**
     * @notice Sets the recovery threshold (number of guardian approvals needed).
     * @dev Callable only by the owner of this GuardianManager contract.
     */
    function setThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold > 0, "GM: Threshold must be > 0");
        uint256 currentGuardians = guardians.length();
        require(currentGuardians > 0, "GM: No guardians set, cannot set threshold");
        require(_threshold <= currentGuardians, "GM: Threshold > guardian count");
        threshold = _threshold;
        emit ThresholdChanged(_threshold);
    }

    // --- Recovery Process ---

    /**
     * @notice Allows a guardian to propose a new owner for the associated SmartAccount.
     * @dev Resets any previous recovery attempt state. Cannot be called if a recovery is active.
     * @param newOwner The address of the proposed new owner.
     */
    function proposeRecovery(address newOwner) external {
        require(guardians.contains(msg.sender), "GM: Caller is not a guardian");
        require(newOwner != address(0), "GM: New owner cannot be zero address");
        // Check added previously: Only one active recovery allowed
        require(recovery.proposedAt == 0 || recovery.executed, "GM: Recovery already active");

        // Reset recovery state for new proposal
        // Note: 'voted' mapping state persists but becomes irrelevant due to proposedAt check
        // We explicitly reset relevant fields.
        recovery.newOwner = newOwner;
        recovery.approvals = 0; // Start approvals at 0, require explicit approve calls
        recovery.proposedAt = block.timestamp;
        recovery.executed = false;

        emit RecoveryProposed(newOwner);
        // Proposer must call approveRecovery separately
    }

    /**
     * @notice Allows a guardian to approve the currently active recovery proposal.
     * @dev Each guardian can only approve once per proposal.
     */
    function approveRecovery() external {
        require(guardians.contains(msg.sender), "GM: Caller is not a guardian");
        require(recovery.proposedAt != 0, "GM: No recovery active");
        require(!recovery.executed, "GM: Recovery already executed");
        require(!recovery.voted[msg.sender], "GM: Guardian already voted"); // Prevent duplicate votes

        recovery.voted[msg.sender] = true;
        recovery.approvals += 1;

        emit RecoveryApproved(msg.sender);
    }

    /**
     * @notice Allows the current SmartAccount owner to cancel an active recovery proposal
     * *before* the threshold has been met.
     */
    function cancelRecovery() external {
        // Verify caller is the current owner of the associated SmartAccount
        address currentWalletOwner = ISmartAccount(wallet).owner();
        require(msg.sender == currentWalletOwner, "GM: Caller is not wallet owner");
        require(recovery.proposedAt != 0, "GM: No recovery active");
        require(!recovery.executed, "GM: Recovery already executed");
        // Allow cancellation only *before* threshold is met
        require(recovery.approvals < threshold, "GM: Threshold already met, cannot cancel");

        // Reset recovery state variables
        _resetRecoveryState();

        emit RecoveryCancelled(msg.sender);
    }

    /**
     * @notice Finalizes the recovery process after threshold met and timelock passed.
     * @dev Transfers ownership of the associated SmartAccount to the proposed new owner.
     */
    function finalizeRecovery() external {
        require(recovery.proposedAt != 0, "GM: No recovery active");
        require(!recovery.executed, "GM: Recovery already executed");
        require(recovery.approvals >= threshold, "GM: Threshold not met");
        // Use >= for timelock check (allows finalization exactly when timelock ends)
        require(block.timestamp >= recovery.proposedAt + TIMELOCK, "GM: Timelock still active");

        address newOwner = recovery.newOwner;
        recovery.executed = true; // Mark executed *before* external call for security
        emit RecoveryFinalised(newOwner);

        // Transfer ownership of the actual SmartAccount wallet
        ISmartAccount(wallet).transferOwnership(newOwner);

        // State is NOT reset here automatically. A new proposal will overwrite it.
    }

    /**
     * @notice Allows the current SmartAccount owner to cancel an active, unexecuted
     * recovery attempt *after* the timelock has expired.
     * @dev Serves as an emergency bypass if guardians fail to finalize a valid recovery.
     */
    function emergencyCancelRecovery() external {
        // Verify caller is the current owner of the associated SmartAccount
        address currentWalletOwner = ISmartAccount(wallet).owner();
        require(msg.sender == currentWalletOwner, "GM: Caller is not wallet owner");
        require(recovery.proposedAt != 0, "GM: No recovery active");
        require(!recovery.executed, "GM: Recovery already executed");
        // Require timelock to have passed
        require(block.timestamp >= recovery.proposedAt + TIMELOCK, "GM: Timelock still active");

        // Reset recovery state variables
        _resetRecoveryState();

        emit RecoveryCancelledByOwner(msg.sender);
    }

    // --- Internal Functions ---

    /**
     * @dev Internal function to reset the recovery state variables.
     * Does not clear the 'voted' mapping itself but makes it irrelevant.
     */
    function _resetRecoveryState() internal {
        recovery.newOwner = address(0);
        recovery.approvals = 0;
        recovery.proposedAt = 0;
        // executed is already false or becomes irrelevant when proposedAt is 0
        // voted mapping cannot be deleted, but is gated by proposedAt != 0 checks
    }
}

