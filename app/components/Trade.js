import { useEffect, useState } from "react";
import { ethers } from "ethers";

function Trade({ toggleTrade, token, provider, factory, account }) {
  const [amount, setAmount] = useState("");
  const [cost, setCost] = useState("0");
  const [sellAmount, setSellAmount] = useState("");
  const [sellRefund, setSellRefund] = useState("0");
  const [userBalance, setUserBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("buy");

  useEffect(() => {
    if (token && provider && account) {
      loadUserBalance();
    }
  }, [token, provider, account]);

  useEffect(() => {
    if (amount && token && provider) {
      calculateBuyCost();
    }
  }, [amount, token, provider]);

  useEffect(() => {
    if (sellAmount && token && provider) {
      calculateSellRefund();
    }
  }, [sellAmount, token, provider]);

  const loadUserBalance = async () => {
    try {
      const factoryContract = new ethers.Contract(factory.address, factory.abi, provider);
      const balance = await factoryContract.getUserBalance(token.token, account);
      setUserBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error loading balance:", error);
    }
  };

  const calculateBuyCost = async () => {
    try {
      const factoryContract = new ethers.Contract(factory.address, factory.abi, provider);
      const tokenAmount = ethers.parseEther(amount);
      const price = await factoryContract.getBuyPrice(token.token, tokenAmount);
      setCost(ethers.formatEther(price));
    } catch (error) {
      setCost("0");
    }
  };

  const calculateSellRefund = async () => {
    try {
      const factoryContract = new ethers.Contract(factory.address, factory.abi, provider);
      const tokenAmount = ethers.parseEther(sellAmount);
      const refund = await factoryContract.getSellPrice(token.token, tokenAmount);
      setSellRefund(ethers.formatEther(refund));
    } catch (error) {
      setSellRefund("0");
    }
  };

  const buyHandler = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    try {
      const signer = await provider.getSigner();
      const factoryContract = new ethers.Contract(factory.address, factory.abi, signer);
      
      const tokenAmount = ethers.parseEther(amount);
      const ethCost = ethers.parseEther(cost);
      
      const transaction = await factoryContract.buy(token.token, tokenAmount, {
        value: ethCost
      });
      
      await transaction.wait();
      
      setAmount("");
      setCost("0");
      await loadUserBalance();
      
      alert("Purchase successful!");
      
    } catch (error) {
      console.error("Error buying tokens:", error);
      alert("Purchase failed. Please try again.");
    }
    setIsLoading(false);
  };

  const sellHandler = async (e) => {
    e.preventDefault();
    if (!sellAmount || parseFloat(sellAmount) <= 0) return;

    setIsLoading(true);
    try {
      const signer = await provider.getSigner();
      const factoryContract = new ethers.Contract(factory.address, factory.abi, signer);
      
      const tokenAmount = ethers.parseEther(sellAmount);
      
      const transaction = await factoryContract.sell(token.token, tokenAmount);
      await transaction.wait();
      
      setSellAmount("");
      setSellRefund("0");
      await loadUserBalance();
      
      alert("Sale successful!");
      
    } catch (error) {
      console.error("Error selling tokens:", error);
      alert("Sale failed. Please try again.");
    }
    setIsLoading(false);
  };

  const formatEther = (value) => {
    return parseFloat(ethers.formatEther(value)).toFixed(4);
  };

  const getProgressPercentage = () => {
    const target = 24;
    const raised = parseFloat(ethers.formatEther(token.raised));
    return Math.min((raised / target) * 100, 100);
  };

  return (
    <div className="trade">
      <button onClick={toggleTrade} className="btn--fancy close-btn">
        ✕
      </button>
      
      <div className="trade-header">
        <h2>{token.name} (${token.symbol})</h2>
        {token.description && <p className="token-description">{token.description}</p>}
        
        <div className="token-stats">
          <p>Market Cap: ${formatEther(token.marketCap)}</p>
          <p>Raised: {formatEther(token.raised)} ETH / 24 ETH</p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <p>Your Balance: {parseFloat(userBalance).toFixed(2)} {token.symbol}</p>
        </div>
      </div>

      <div className="trade-tabs">
        <button 
          className={`tab ${activeTab === 'buy' ? 'active' : ''}`}
          onClick={() => setActiveTab('buy')}
        >
          Buy
        </button>
        <button 
          className={`tab ${activeTab === 'sell' ? 'active' : ''}`}
          onClick={() => setActiveTab('sell')}
        >
          Sell
        </button>
      </div>

      {activeTab === 'buy' && (
        <form onSubmit={buyHandler} className="trade-form">
          <input
            type="number"
            placeholder="Amount of tokens to buy"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
          
          <div className="cost-display">
            <p>Cost: {parseFloat(cost).toFixed(6)} ETH</p>
          </div>
          
          <input
            type="submit"
            value={isLoading ? "Buying..." : "Buy Tokens"}
            disabled={isLoading || !account || token.graduated}
          />
          
          {token.graduated && (
            <p className="disclaimer">Token has graduated to DEX</p>
          )}
        </form>
      )}

      {activeTab === 'sell' && (
        <form onSubmit={sellHandler} className="trade-form">
          <input
            type="number"
            placeholder="Amount of tokens to sell"
            value={sellAmount}
            onChange={(e) => setSellAmount(e.target.value)}
            min="0"
            max={userBalance}
            step="0.01"
          />
          
          <div className="cost-display">
            <p>You'll receive: {parseFloat(sellRefund).toFixed(6)} ETH</p>
          </div>
          
          <input
            type="submit"
            value={isLoading ? "Selling..." : "Sell Tokens"}
            disabled={isLoading || !account || token.graduated || parseFloat(userBalance) === 0}
          />
          
          {parseFloat(userBalance) === 0 && (
            <p className="disclaimer">You don't own any tokens to sell</p>
          )}
        </form>
      )}

      {!account && (
        <p className="disclaimer">Connect your wallet to trade</p>
      )}
    </div>
  );
}

export default Trade;