// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract GuardianManager is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Recovery {
        address newOwner;
        uint256 approvals;
        uint256 proposedAt;
        bool executed;
        mapping(address => bool) voted;
    }

    event GuardianAdded(address guardian);
    event GuardianRemoved(address guardian);
    event RecoveryProposed(address indexed newOwner);
    event RecoveryApproved(address indexed guardian);
    event RecoveryCancelled();
    event RecoveryFinalised(address indexed newOwner);

    uint256 public constant TIMELOCK = 72 hours;
    EnumerableSet.AddressSet private guardians;
    uint256 public threshold = 2;
    Recovery private recovery;

    function addGuardian(address guardian) external onlyOwner {
        guardians.add(guardian);
        emit GuardianAdded(guardian);
    }

    function removeGuardian(address guardian) external onlyOwner {
        guardians.remove(guardian);
        emit GuardianRemoved(guardian);
        if (threshold > guardians.length()) {
            threshold = guardians.length();
        }
    }

    function setThreshold(uint256 _threshold) external onlyOwner {
        threshold = _threshold;
    }

    function proposeRecovery(address newOwner) external {
        require(guardians.contains(msg.sender));
        recovery.newOwner = newOwner;
        recovery.approvals = 1;
        recovery.proposedAt = block.timestamp;
        recovery.executed = false;
        recovery.voted[msg.sender] = true;
        emit RecoveryProposed(newOwner);
    }

    function approveRecovery() external {
        require(guardians.contains(msg.sender));
        recovery.voted[msg.sender] = true;
        recovery.approvals++;
        emit RecoveryApproved(msg.sender);
    }

    function cancelRecovery() external onlyOwner {
        delete recovery;
        emit RecoveryCancelled();
    }

    function finalizeRecovery() external {
        require(recovery.approvals >= threshold);
        require(block.timestamp >= recovery.proposedAt + TIMELOCK);
        _transferOwnership(recovery.newOwner);
        recovery.executed = true;
        emit RecoveryFinalised(recovery.newOwner);
        delete recovery;
    }
}
