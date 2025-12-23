import { ethers } from "ethers";

function Token({ toggleTrade, token }) {
  const formatEther = (value) => {
    return parseFloat(ethers.formatEther(value)).toFixed(4);
  };

  const formatMarketCap = (value) => {
    const num = parseFloat(ethers.formatEther(value));
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const getProgressPercentage = () => {
    const target = 24; // 24 ETH target
    const raised = parseFloat(ethers.formatEther(token.raised));
    return Math.min((raised / target) * 100, 100);
  };

  return (
    <button onClick={() => toggleTrade(token)} className="token">
      <div className="token__details">
        {token.imageUrl && (
          <img 
            src={token.imageUrl} 
            alt={token.name}
            className="token__image"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        
        <p className="name">{token.name}</p>
        <p className="symbol">${token.symbol}</p>
        
        {token.description && (
          <p className="description">{token.description}</p>
        )}
        
        <div className="token__stats">
          <p>Market Cap: {formatMarketCap(token.marketCap)}</p>
          <p>Raised: {formatEther(token.raised)} ETH</p>
          
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {getProgressPercentage().toFixed(1)}% to graduation
          </p>
        </div>
        
        <div className="token__meta">
          <p>Created by: {token.creator.slice(0, 6)}...{token.creator.slice(-4)}</p>
          {token.graduated && <span className="graduated">🎓 Graduated</span>}
        </div>
      </div>
    </button>
  );
}

export default Token;