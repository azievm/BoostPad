const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("Factory", function () {
  const FEE = ethers.parseUnits("0.001", 18);

  async function deployFactoryFixture() {
    // Fetch accout
    const [deployer, creator, buyer] = await ethers.getSigners();
    // Fetch the contract
    const Factory = await ethers.getContractFactory("Factory");
    // Deploy the contract
    const factory = await Factory.deploy(FEE);

    //Create token
    const transaction = await factory
      .connect(creator)
      .create("Dapp Uni", "DAPP", "A test token for DeFi", "https://example.com/image.png", { value: FEE });
    await transaction.wait();

    // Get token address
    const tokenAddress = await factory.tokens(0);
    const token = await ethers.getContractAt("Token", tokenAddress);

    return { factory, token, deployer, creator, buyer };
  }

  async function buyTokenFixture() {
    const { factory, token, creator, buyer } = await deployFactoryFixture();

    const AMOUNT = ethers.parseUnits("1000", 18);
    
    // Get the actual cost using the bonding curve
    const COST = await factory.getBuyPrice(await token.getAddress(), AMOUNT);

    // Buy tokens
    const transaction = await factory
      .connect(buyer)
      .buy(await token.getAddress(), AMOUNT, { value: COST });
    await transaction.wait();

    return { factory, token, creator, buyer, AMOUNT, COST };
  }

  describe("Deployment", function () {
    it("Should set the fee", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);
      expect(await factory.fee()).to.equal(FEE);
    });

    it("Should set the owner", async function () {
      const { factory, deployer } = await loadFixture(deployFactoryFixture);
      expect(await factory.owner()).to.equal(deployer.address);
    });
  });

  describe("Creating", function () {
    it("Should set the owner", async function () {
      const { factory, token } = await loadFixture(deployFactoryFixture);
      expect(await token.owner()).to.equal(await factory.getAddress());
    });

    it("Should set the creator", async function () {
      const { token, creator } = await loadFixture(deployFactoryFixture);
      expect(await token.creator()).to.equal(await creator.address);
    });

    it("Should set the supply", async function () {
      const { factory, token } = await loadFixture(deployFactoryFixture);

      const totalSupply = ethers.parseUnits("1000000000", 18); // 1B tokens

      expect(await token.balanceOf(await factory.getAddress())).to.equal(
        totalSupply
      );
    });

    it("Should update ETH balance", async function () {
      const { factory } = await loadFixture(deployFactoryFixture);

      const balance = await ethers.provider.getBalance(
        await factory.getAddress()
      );

      expect(balance).to.equal(FEE);
    });

    it("Should create the sale", async function () {
      const { factory, token, creator } = await loadFixture(
        deployFactoryFixture
      );

      const count = await factory.totalTokens();
      expect(count).to.equal(1);

      const sale = await factory.getTokenSale(0);
      expect(sale.token).to.equal(await token.getAddress());
      expect(sale.creator).to.equal(await creator.address);
      expect(sale.sold).to.equal(0);
      expect(sale.raised).to.equal(0);
      expect(sale.isOpen).to.equal(true);
    });
  });

  describe("Buying", function () {
    // Check contract received ETH
    it("Should update ETH balance", async function () {
      const { factory, COST } = await loadFixture(buyTokenFixture);

      const balance = await ethers.provider.getBalance(
        await factory.getAddress()
      );

      expect(balance).to.equal(FEE + COST);
    });

    // Check that buyer received tokens
    it("Should update token balances", async function () {
      const { token, buyer, AMOUNT } = await loadFixture(buyTokenFixture);

      const balance = await token.balanceOf(buyer.address);
      expect(balance).to.equal(AMOUNT);
    });

    it("Should update token sale", async function () {
      const { factory, token, AMOUNT, COST } = await loadFixture(buyTokenFixture);

      const sale = await factory.tokenToSale(await token.getAddress());

      expect(sale.sold).to.equal(AMOUNT);
      expect(sale.raised).to.equal(COST);
      expect(sale.isOpen).to.equal(true);
    });

    it("Should calculate bonding curve price", async function () {
      const { factory, token, AMOUNT } = await loadFixture(buyTokenFixture);

      const price = await factory.getBuyPrice(await token.getAddress(), AMOUNT);
      expect(price).to.be.greaterThan(0);
    });
  });

  describe("Graduation", function () {
    it("Should graduate token when target reached", async function () {
      const { factory, token, creator, buyer } = await loadFixture(
        buyTokenFixture
      );

      // Buy enough tokens to reach graduation target (24 ETH)
      // We need to buy close to the token limit to reach 24 ETH
      const largeAmount = ethers.parseUnits("500000000", 18); // 500M tokens (close to limit)
      const largeCost = await factory.getBuyPrice(await token.getAddress(), largeAmount);
      
      const buyTx = await factory
        .connect(buyer)
        .buy(await token.getAddress(), largeAmount, { value: largeCost });
      await buyTx.wait();

      const sale = await factory.tokenToSale(await token.getAddress());
      expect(sale.graduated).to.equal(true);
      expect(sale.isOpen).to.equal(false);

      // Creator should be able to graduate the token
      const graduateTx = await factory
        .connect(creator)
        .graduateToken(await token.getAddress());

      await graduateTx.wait();
    });
  });

  describe("Withdrawing Fees", function () {
    it("Should update ETH balances", async function () {
      const { factory, deployer } = await loadFixture(deployFactoryFixture);

      const transaction = await factory.connect(deployer).withdraw(FEE);
      await transaction.wait();

      const balance = await ethers.provider.getBalance(
        await factory.getAddress()
      );

      expect(balance).to.equal(0);
    });
  });
});
