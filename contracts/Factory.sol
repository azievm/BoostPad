 // SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

contract Factory {
    address public owner;
    uint256 public immutable fee;

    constructor(uint256 _fee){
        owner = msg.sender;
        fee = _fee;
    }
}
