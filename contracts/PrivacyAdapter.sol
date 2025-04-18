// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAztecBridge {
    function deposit(address token, uint256 amount, address recipient) external returns (bytes32 noteHash);
    function withdraw(bytes32 noteHash, address recipient) external returns (uint256 amount);
}

interface IZkSyncL1Bridge {
    function deposit(address l2Receiver, address l1Token, uint256 amount) external payable returns (bytes32 l2TxHash);
    function claimWithdrawal(address l2Token, uint256 amount, bytes calldata proof) external;
}

contract PrivacyAdapter is ReentrancyGuard {
    IAztecBridge public immutable aztec;
    IZkSyncL1Bridge public immutable zksync;

    event AztecShield(address indexed token, uint256 amount, bytes32 noteHash, address recipient);
    event AztecUnshield(bytes32 noteHash, uint256 amount, address recipient);
    event ZkSyncDeposit(address indexed token, uint256 amount, bytes32 l2TxHash, address recipient);
    event ZkSyncWithdraw(address indexed token, uint256 amount, address recipient);

    constructor(address _aztec, address _zksync) {
        aztec = IAztecBridge(_aztec);
        zksync = IZkSyncL1Bridge(_zksync);
    }

    function shieldAztec(address token, uint256 amount, address recipient) external nonReentrant returns (bytes32 noteHash) {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(address(aztec), amount);
        noteHash = aztec.deposit(token, amount, recipient);
        emit AztecShield(token, amount, noteHash, recipient);
    }

    function unshieldAztec(bytes32 noteHash, address recipient) external nonReentrant returns (uint256 withdrawn) {
        withdrawn = aztec.withdraw(noteHash, recipient);
        emit AztecUnshield(noteHash, withdrawn, recipient);
    }

    function depositZkSync(address token, uint256 amount, address recipient) external nonReentrant returns (bytes32 l2TxHash) {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        IERC20(token).approve(address(zksync), amount);
        l2TxHash = zksync.deposit(recipient, token, amount);
        emit ZkSyncDeposit(token, amount, l2TxHash, recipient);
    }

    function claimZkSyncWithdrawal(address l2Token, uint256 amount, bytes calldata proof) external nonReentrant {
        zksync.claimWithdrawal(l2Token, amount, proof);
        IERC20(l2Token).transfer(msg.sender, amount);
        emit ZkSyncWithdraw(l2Token, amount, msg.sender);
    }
}
