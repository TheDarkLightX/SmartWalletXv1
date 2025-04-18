// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";

contract KeyRegistry is Ownable {
    mapping(bytes32 => address) public quoteToKey;
    mapping(address => bool) public isKeyRegistered;

    event KeyRegistered(bytes32 indexed quoteHash, address indexed sessionKey);
    event KeyDeregistered(bytes32 indexed quoteHash, address indexed sessionKey);

    function registerKey(bytes32 quoteHash, address sessionKey) external onlyOwner {
        quoteToKey[quoteHash] = sessionKey;
        isKeyRegistered[sessionKey] = true;
        emit KeyRegistered(quoteHash, sessionKey);
    }

    function deregisterKey(bytes32 quoteHash) external onlyOwner {
        address sessionKey = quoteToKey[quoteHash];
        delete quoteToKey[quoteHash];
        isKeyRegistered[sessionKey] = false;
        emit KeyDeregistered(quoteHash, sessionKey);
    }

    function isAttested(address sessionKey) external view returns (bool) {
        return isKeyRegistered[sessionKey];
    }
}
