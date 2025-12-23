"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Components
import Header from "./components/Header";
import List from "./components/List";
import Create from "./components/Create";
import Trade from "./components/Trade";

// ABIs & Config
import Factory from "./abis/Factory.json";
import config from "./config.json";

export default function Home() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [factory, setFactory] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  const loadBlockchainData = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask to use this application");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      setProvider(provider);

      const network = await provider.getNetwork();
      const chainId = network.chainId.toString();
      
      console.log("Connected to network:", chainId);

      // Load factory configuration
      const factoryConfig = config[chainId]?.factory;
      if (factoryConfig) {
        setFactory({
          address: factoryConfig.address,
          abi: Factory.abi
        });
      } else {
        console.error("Unsupported network. Please switch to Sepolia or localhost.");
      }

    } catch (error) {
      console.error("Error loading blockchain data:", error);
    }
  };

  const toggleCreate = () => {
    setShowCreate(!showCreate);
  };

  const toggleTrade = (token) => {
    setSelectedToken(token);
    setShowTrade(!showTrade);
  };

  useEffect(() => {
    loadBlockchainData();
    
    // Listen for network changes
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <div className="page">
      <Header account={account} setAccount={setAccount} />
      
      <main>
        <div className="create">
          <h2>🚀 Launch Your Token</h2>
          <p>Create and trade tokens on the bonding curve</p>
          <button onClick={toggleCreate} className="btn--fancy">
            [ start a new coin ]
          </button>
        </div>

        {provider && factory.address && (
          <List 
            toggleTrade={toggleTrade}
            provider={provider}
            factory={factory}
          />
        )}
      </main>

      {showCreate && (
        <Create
          toggleCreate={toggleCreate}
          provider={provider}
          factory={factory}
          account={account}
        />
      )}

      {showTrade && selectedToken && (
        <Trade
          toggleTrade={toggleTrade}
          token={selectedToken}
          provider={provider}
          factory={factory}
          account={account}
        />
      )}
    </div>
  );
}
