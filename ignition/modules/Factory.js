// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("hardhat");

const FactoryModule = buildModule("FactoryModule", (m) => {
  // Creation fee: 0.01 ETH
  const fee = m.getParameter("fee", "10000000000000000"); // 0.01 ETH in wei

  const factory = m.contract("Factory", [fee]);

  return { factory };
});

module.exports = FactoryModule;
