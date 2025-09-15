 // SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import {Token} from "./Token.sol";

contract Factory {
    address public owner;
    uint256 public immutable fee;

    uint256 public totalTokens;
    address[] public tokens;

    mapping(address => TokenSale) public tokenToSale;

    struct TokenSale {
        address token;
        string name;
        address creator;
        uint256 sold;
        uint256 raised;
        bool isOpen;
    }

    event Created(address indexed token);

    constructor(uint256 _fee){
        owner = msg.sender;
        fee = _fee;
    }

    function getTokenSale(uint256 _index) public view returns (TokenSale memory) {
        return tokenToSale[tokens[_index]];
    }

    function create(string memory _name, string memory _symbol) external payable {
        // Make sure that the fee is correct
        require(msg.value >= fee, "Factory: Creator fee not met");

        // Create a new token
        Token token = new Token(msg.sender, _name, _symbol, 1_000_000 ether);

        // Save the token for later use
        tokens.push(address(token));

        totalTokens++;

        // List the token for sale
        TokenSale memory sale = TokenSale(
            address(token),
            _name,
            msg.sender,
            0,
            0,
            true
        );

        tokenToSale[address(token)] = sale;

        // Tell people it's live
        emit Created(address(token));
    }
}
