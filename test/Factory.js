const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { Fuzzy_Bubbles } = require("next/font/google");

describe("Factory", function () {
  const FEE = ethers.parseUnits("0.001", 18);

  async function deployFactoryFixture() {
    // Fetch accout
    const [deployer] = await ethers.getSigners();
    // Fetch the contract
    const Factory = await ethers.getContractFactory("Factory");
    // Deploy the contract

    const factory = await Factory.deploy(FEE);

    return { factory, deployer };
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
});
