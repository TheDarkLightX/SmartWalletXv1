// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IGuardianManager {
    function proposedAt() external view returns (uint256);
    function executed() external view returns (bool);
    function TIMELOCK() external view returns (uint256);
}

contract RecoveryGuard {
    IGuardianManager public immutable gm;

    constructor(address guardianManager) {
        gm = IGuardianManager(guardianManager);
    }

    function preExec(bytes calldata, bytes32) external view returns (uint256) {
        uint256 proposed = gm.proposedAt();
        if (proposed != 0 && !gm.executed()) {
            require(block.timestamp < proposed || block.timestamp > proposed + gm.TIMELOCK(), "RECOVERY_PENDING");
        }
        return 0;
    }

    function postExec(bytes calldata, bytes32, bool) external pure {}
}
