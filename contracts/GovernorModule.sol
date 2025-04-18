// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./KeyRegistry.sol";

contract GovernorModule is Ownable {
    using ECDSA for bytes32;

    KeyRegistry public immutable keyRegistry;

    struct Allowance {
        uint128 amount;
        uint48 expiry;
        bool enabled;
    }

    mapping(address => mapping(address => mapping(address => Allowance))) public allowances;
    mapping(address => bool) public isSessionKey;

    event SessionKeyEnabled(address indexed key);
    event SessionKeyRevoked(address indexed key);
    event AllowanceSet(address key, address token, address dest, uint128 amount, uint48 expiry);
    event AllowanceUsed(address key, address token, address dest, uint128 amount);

    constructor(address _registry) {
        keyRegistry = KeyRegistry(_registry);
    }

    function enableSessionKey(address key) external onlyOwner {
        require(keyRegistry.isAttested(key), "KEY_NOT_ATTESTED");
        isSessionKey[key] = true;
        emit SessionKeyEnabled(key);
    }

    function revokeSessionKey(address key) external onlyOwner {
        isSessionKey[key] = false;
        emit SessionKeyRevoked(key);
    }

    function setAllowance(address key, address token, address dest, uint128 amount, uint48 expiry) external onlyOwner {
        allowances[key][dest][token] = Allowance({amount: amount, expiry: expiry, enabled: true});
        emit AllowanceSet(key, token, dest, amount, expiry);
    }

    function preExec(bytes calldata opData, bytes32 opHash) external returns (uint256) {
        (address key, address token, address dest, uint128 spend) = abi.decode(opData, (address, address, address, uint128));
        require(isSessionKey[key], "KEY_OFF");
        require(keyRegistry.isAttested(key), "KEY_NOT_ATTESTED");
        Allowance storage a = allowances[key][dest][token];
        require(a.enabled && block.timestamp <= a.expiry, "ALLOW_EXPIRED");
        require(a.amount >= spend, "ALLOW_LOW");
        bytes32 signed = opHash.toEthSignedMessageHash();
        require(signed.recover(opData) == key || signed.recover(opData) == owner(), "BAD_SIG");
        a.amount -= spend;
        emit AllowanceUsed(key, token, dest, spend);
        return 0;
    }

    function postExec(bytes calldata, bytes32, bool) external pure {}
}
