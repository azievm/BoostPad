# BoostPad - Pump.fun Style Token Launchpad

A decentralized token launchpad inspired by pump.fun, built for Ethereum Sepolia testnet. Create, trade, and launch tokens using a bonding curve mechanism.

## 🚀 Features

- **Token Creation**: Launch ERC-20 tokens with custom metadata
- **Bonding Curve Trading**: Buy/sell tokens with automated pricing
- **Graduation System**: Tokens graduate to DEX when reaching funding target
- **Real-time Analytics**: Track market cap, progress, and trading activity
- **Mobile Responsive**: Works seamlessly on all devices

## 🛠 Technology Stack

- **Smart Contracts**: Solidity 0.8.27
- **Frontend**: Next.js 15, React 19, Ethers.js 6
- **Development**: Hardhat, OpenZeppelin
- **Network**: Ethereum Sepolia Testnet

## 📋 Requirements

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [MetaMask](https://metamask.io/) browser extension
- Sepolia ETH for transactions

## 🔧 Setup Instructions

### 1. Clone Repository
```bash
git clone <repository-url>
cd BoostPad
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
```bash
cp .env.example .env
```
Fill in your environment variables:
- `INFURA_API_KEY`: Get from [Infura](https://infura.io/)
- `PRIVATE_KEY`: Your wallet private key (for deployment)
- `ETHERSCAN_API_KEY`: Get from [Etherscan](https://etherscan.io/apis)

### 4. Deploy to Sepolia
```bash
npx hardhat ignition deploy ignition/modules/Factory.js --network sepolia
```

### 5. Update Configuration
After deployment, update `app/config.json` with the deployed contract address.

### 6. Start Development Server
```bash
npm run dev
```

## 📖 Smart Contract Functions

### Factory Contract

#### Core Functions

**`create(string name, string symbol, string description, string imageUrl)`**
- Creates a new ERC-20 token with 1B total supply
- Requires 0.01 ETH creation fee
- Initializes bonding curve trading
- Emits `Created` event

**`buy(address token, uint256 amount)`**
- Purchases tokens using bonding curve pricing
- Automatically calculates ETH cost
- Updates market metrics
- Refunds excess ETH
- Emits `Buy` event

**`sell(address token, uint256 amount)`**
- Sells tokens back to bonding curve
- Calculates ETH refund amount
- Updates user balances
- Emits `Sell` event

#### View Functions

**`getBuyPrice(address token, uint256 amount) → uint256`**
- Returns ETH cost for buying specified token amount
- Uses constant product formula: `k = x * y`
- Accounts for virtual reserves

**`getSellPrice(address token, uint256 amount) → uint256`**
- Returns ETH refund for selling specified token amount
- Uses same bonding curve in reverse

**`getMarketCap(address token) → uint256`**
- Calculates current market capitalization
- Based on current token price and total supply

**`getAllTokens() → TokenSale[]`**
- Returns array of all created tokens
- Includes metadata and trading statistics

**`getUserBalance(address token, address user) → uint256`**
- Returns user's token balance for specific token

#### Admin Functions

**`graduateToken(address token)`**
- Transfers remaining tokens and ETH to creator
- Only callable by token creator after graduation
- In production, would add liquidity to DEX

**`withdraw(uint256 amount)`**
- Owner-only function to withdraw fees
- Emergency function for contract maintenance

**`emergencyClose(address token)`**
- Owner-only function to close token trading
- Used for emergency situations

### Token Contract

Standard ERC-20 implementation with:
- **Name, Symbol, Decimals**: Standard token metadata
- **Total Supply**: 1,000,000,000 tokens (1B)
- **Owner**: Factory contract (for initial distribution)
- **Creator**: Original token creator address

## 🎯 Bonding Curve Mechanics

### Pricing Formula
The platform uses a constant product bonding curve:
```
k = (virtualETH + raisedETH) * (virtualTokens - soldTokens)
```

### Constants
- **Virtual ETH Reserve**: 30 ETH
- **Virtual Token Reserve**: 1.073B tokens
- **Token Limit**: 800M tokens (bonding curve portion)
- **Graduation Target**: 24 ETH raised

### Trading Flow
1. **Token Creation**: 1B tokens minted to Factory contract
2. **Bonding Curve**: First 800M tokens sold via curve
3. **Graduation**: At 24 ETH raised, remaining tokens + ETH go to creator
4. **DEX Listing**: In production, would create Uniswap liquidity

## 🎨 Frontend Components

### Header
- Wallet connection interface
- Network detection and switching
- Account display with address truncation

### Create
- Token creation form with validation
- Image URL support for token branding
- Real-time fee calculation
- Transaction status feedback

### List
- Grid display of all tokens
- Real-time market data
- Progress bars showing graduation status
- Sorting by creation time

### Token
- Individual token card component
- Market cap and progress display
- Creator information
- Graduation status indicator

### Trade
- Buy/sell interface with tabs
- Real-time price calculation
- User balance display
- Transaction cost preview

## 🔒 Security Features

- **Reentrancy Protection**: Safe external calls
- **Input Validation**: Comprehensive parameter checking
- **Access Control**: Owner-only administrative functions
- **Emergency Controls**: Circuit breakers for critical situations
- **Overflow Protection**: SafeMath equivalent built into Solidity 0.8.27

## 🧪 Testing

Run the test suite:
```bash
npx hardhat test
```

Test coverage includes:
- Token creation and validation
- Bonding curve price calculations
- Buy/sell functionality
- Graduation mechanics
- Access control

## 🚀 Deployment

### Local Development
```bash
npx hardhat node
npx hardhat ignition deploy ignition/modules/Factory.js --network localhost
```

### Sepolia Testnet
```bash
npx hardhat ignition deploy ignition/modules/Factory.js --network sepolia
```

### Verification
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> "10000000000000000"
```

## 📊 Usage Examples

### Creating a Token
1. Connect MetaMask to Sepolia
2. Click "start a new coin"
3. Fill in token details
4. Pay 0.01 ETH creation fee
5. Token appears in listings

### Trading Tokens
1. Click on any token card
2. Choose Buy or Sell tab
3. Enter desired amount
4. Review price calculation
5. Confirm transaction

### Graduation Process
1. Token reaches 24 ETH raised
2. Automatically marked as graduated
3. Creator can call `graduateToken()`
4. Remaining tokens and ETH transferred

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

This is experimental software for educational purposes. Use at your own risk. Not audited for production use.
