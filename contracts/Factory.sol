 // SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.27;

import {Token} from "./Token.sol";

contract Factory {
    uint256 public constant TARGET = 24 ether; // Higher target for pump.fun style
    uint256 public constant TOKEN_LIMIT = 800_000_000 ether; // 800M tokens for bonding curve
    uint256 public constant VIRTUAL_ETH_RESERVE = 30 ether;
    uint256 public constant VIRTUAL_TOKEN_RESERVE = 1_073_000_000 ether;

    address public owner;
    uint256 public immutable fee;

    uint256 public totalTokens;
    address[] public tokens;

    mapping(address => TokenSale) public tokenToSale;
    mapping(address => mapping(address => uint256)) public userTokenBalance;

    struct TokenSale {
        address token;
        string name;
        string symbol;
        string description;
        string imageUrl;
        address creator;
        uint256 sold;
        uint256 raised;
        uint256 marketCap;
        bool isOpen;
        bool graduated;
        uint256 createdAt;
        uint256 replies;
    }

    event Created(address indexed token, string name, string symbol, address creator);
    event Buy(address indexed token, address buyer, uint256 amount, uint256 cost);
    event Sell(address indexed token, address seller, uint256 amount, uint256 refund);
    event Graduated(address indexed token, uint256 liquidityAdded);

    constructor(uint256 _fee){
        owner = msg.sender;
        fee = _fee;
    }

    function getTokenSale(uint256 _index) public view returns (TokenSale memory) {
        return tokenToSale[tokens[_index]];
    }

    // Bonding curve pricing using constant product formula
    function getBuyPrice(address _token, uint256 _amount) public view returns(uint256) {
        TokenSale memory sale = tokenToSale[_token];
        
        uint256 ethReserve = VIRTUAL_ETH_RESERVE + sale.raised;
        uint256 tokenReserve = VIRTUAL_TOKEN_RESERVE - sale.sold;
        
        // Using constant product: x * y = k
        uint256 k = ethReserve * tokenReserve;
        uint256 newTokenReserve = tokenReserve - _amount;
        uint256 newEthReserve = k / newTokenReserve;
        
        return newEthReserve - ethReserve;
    }
    
    function getSellPrice(address _token, uint256 _amount) public view returns(uint256) {
        TokenSale memory sale = tokenToSale[_token];
        
        uint256 ethReserve = VIRTUAL_ETH_RESERVE + sale.raised;
        uint256 tokenReserve = VIRTUAL_TOKEN_RESERVE - sale.sold;
        
        uint256 k = ethReserve * tokenReserve;
        uint256 newTokenReserve = tokenReserve + _amount;
        uint256 newEthReserve = k / newTokenReserve;
        
        return ethReserve - newEthReserve;
    }

    function getMarketCap(address _token) public view returns(uint256) {
        TokenSale memory sale = tokenToSale[_token];
        if (sale.sold == 0) return 0;
        
        uint256 tokenPrice = getBuyPrice(_token, 1 ether);
        return (1_000_000_000 ether * tokenPrice) / 1 ether;
    }

    function create(
        string memory _name, 
        string memory _symbol, 
        string memory _description,
        string memory _imageUrl
    ) external payable {
        require(msg.value >= fee, "Factory: Creator fee not met");
        require(bytes(_name).length > 0, "Factory: Name required");
        require(bytes(_symbol).length > 0, "Factory: Symbol required");

        // Create token with 1B supply
        Token token = new Token(msg.sender, _name, _symbol, 1_000_000_000 ether);

        tokens.push(address(token));
        totalTokens++;

        TokenSale memory sale = TokenSale({
            token: address(token),
            name: _name,
            symbol: _symbol,
            description: _description,
            imageUrl: _imageUrl,
            creator: msg.sender,
            sold: 0,
            raised: 0,
            marketCap: 0,
            isOpen: true,
            graduated: false,
            createdAt: block.timestamp,
            replies: 0
        });

        tokenToSale[address(token)] = sale;

        emit Created(address(token), _name, _symbol, msg.sender);
    }


    function buy(address _token, uint256 _amount) external payable {
        TokenSale storage sale = tokenToSale[_token];

        require(sale.isOpen, "Factory: Token sale closed");
        require(!sale.graduated, "Factory: Token graduated to DEX");
        require(_amount > 0, "Factory: Amount must be positive");
        require(sale.sold + _amount <= TOKEN_LIMIT, "Factory: Exceeds bonding curve limit");

        uint256 cost = getBuyPrice(_token, _amount);
        require(msg.value >= cost, "Factory: Insufficient ETH");

        // Update sale data
        sale.sold += _amount;
        sale.raised += cost;
        sale.marketCap = getMarketCap(_token);

        // Track user balance
        userTokenBalance[_token][msg.sender] += _amount;

        // Check graduation condition
        if (sale.raised >= TARGET) {
            sale.graduated = true;
            sale.isOpen = false;
            emit Graduated(_token, sale.raised);
        }

        Token(_token).transfer(msg.sender, _amount);

        // Refund excess ETH
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        emit Buy(_token, msg.sender, _amount, cost);
    }

    function sell(address _token, uint256 _amount) external {
        TokenSale storage sale = tokenToSale[_token];
        
        require(sale.isOpen, "Factory: Token sale closed");
        require(!sale.graduated, "Factory: Token graduated to DEX");
        require(_amount > 0, "Factory: Amount must be positive");
        require(userTokenBalance[_token][msg.sender] >= _amount, "Factory: Insufficient balance");

        uint256 refund = getSellPrice(_token, _amount);
        require(address(this).balance >= refund, "Factory: Insufficient contract balance");

        // Update sale data
        sale.sold -= _amount;
        sale.raised -= refund;
        sale.marketCap = getMarketCap(_token);

        // Update user balance
        userTokenBalance[_token][msg.sender] -= _amount;

        // Transfer tokens back to contract
        Token(_token).transferFrom(msg.sender, address(this), _amount);

        // Send ETH refund
        payable(msg.sender).transfer(refund);

        emit Sell(_token, msg.sender, _amount, refund);
    }

    function graduateToken(address _token) external {
        TokenSale storage sale = tokenToSale[_token];
        
        require(sale.graduated, "Factory: Token not ready for graduation");
        require(msg.sender == sale.creator, "Factory: Only creator can graduate");

        Token token = Token(_token);
        uint256 remainingTokens = token.balanceOf(address(this));
        
        // In a real implementation, this would add liquidity to Uniswap
        // For now, transfer remaining tokens and raised ETH to creator
        if (remainingTokens > 0) {
            token.transfer(sale.creator, remainingTokens);
        }
        
        if (sale.raised > 0) {
            (bool success, ) = payable(sale.creator).call{value: sale.raised}("");
            require(success, "Factory: ETH transfer failed");
            sale.raised = 0; // Prevent re-withdrawal
        }
    }

    function getAllTokens() external view returns (TokenSale[] memory) {
        TokenSale[] memory allTokens = new TokenSale[](totalTokens);
        for (uint256 i = 0; i < totalTokens; i++) {
            allTokens[i] = tokenToSale[tokens[i]];
        }
        return allTokens;
    }

    function getUserBalance(address _token, address _user) external view returns (uint256) {
        return userTokenBalance[_token][_user];
    }

    function withdraw(uint256 _amount) external {
        require(msg.sender == owner, "Factory: Not owner");
        require(_amount <= address(this).balance, "Factory: Insufficient balance");

        (bool success, ) = payable(owner).call{value: _amount}("");
        require(success, "Factory: ETH transfer failed");
    }

    // Emergency function to close a token sale
    function emergencyClose(address _token) external {
        require(msg.sender == owner, "Factory: Not owner");
        TokenSale storage sale = tokenToSale[_token];
        sale.isOpen = false;
    }
}
