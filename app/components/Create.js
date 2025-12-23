import { useState } from "react";
import { ethers } from "ethers";

function Create({ toggleCreate, provider, factory, account }) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createHandler = async (e) => {
    e.preventDefault();
    
    if (!name || !symbol || !description) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    
    try {
      const signer = await provider.getSigner();
      const factoryContract = new ethers.Contract(factory.address, factory.abi, signer);
      
      // Get creation fee (0.01 ETH)
      const fee = ethers.parseEther("0.01");
      
      const transaction = await factoryContract.create(
        name,
        symbol.toUpperCase(),
        description,
        imageUrl || "",
        { value: fee }
      );
      
      await transaction.wait();
      
      // Reset form
      setName("");
      setSymbol("");
      setDescription("");
      setImageUrl("");
      
      alert("Token created successfully!");
      toggleCreate();
      
    } catch (error) {
      console.error("Error creating token:", error);
      alert("Failed to create token. Please try again.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="list">
      <button onClick={toggleCreate} className="btn--fancy">
        ✕
      </button>
      
      <h2>Create Your Token</h2>
      <p className="list__description">
        Launch your own token on the bonding curve. Fee: 0.01 ETH
      </p>
      
      <form onSubmit={createHandler}>
        <input
          type="text"
          placeholder="Token Name (e.g., My Cool Token)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength="32"
          required
        />
        
        <input
          type="text"
          placeholder="Symbol (e.g., MCT)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          maxLength="10"
          required
        />
        
        <textarea
          placeholder="Describe your token..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength="280"
          rows="4"
          required
        />
        
        <input
          type="url"
          placeholder="Image URL (optional)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        
        <input
          type="submit"
          value={isLoading ? "Creating..." : "Create Token"}
          disabled={isLoading || !account}
        />
      </form>
      
      {!account && (
        <p style={{ color: "#ff6b6b", marginTop: "1em" }}>
          Please connect your wallet to create a token
        </p>
      )}
    </div>
  );
}

export default Create;
