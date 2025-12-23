import { useEffect, useState } from "react";
import { ethers } from "ethers";
import Token from "./Token";

function List({ toggleTrade, provider, factory }) {
  const [tokens, setTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (provider && factory) {
      loadTokens();
    }
  }, [provider, factory]);

  const loadTokens = async () => {
    try {
      const factoryContract = new ethers.Contract(factory.address, factory.abi, provider);
      const allTokens = await factoryContract.getAllTokens();
      
      // Sort tokens by creation time (newest first)
      const sortedTokens = allTokens.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
      
      setTokens(sortedTokens);
    } catch (error) {
      console.error("Error loading tokens:", error);
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="listings">
        <h1>Loading tokens...</h1>
      </div>
    );
  }

  return (
    <div className="listings">
      <h1>🚀 Live Tokens ({tokens.length})</h1>
      
      <div className="tokens">
        {tokens.length === 0 ? (
          <p>No tokens created yet. Be the first to launch!</p>
        ) : (
          tokens.map((token, index) => (
            <Token 
              key={token.token} 
              token={token} 
              toggleTrade={toggleTrade}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default List;