const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env" });

async function main() {

  const Isusu = await ethers.getContractFactory("Isusu");
  const isusu = await Isusu.deploy();

  await isusu.deployed();

  console.log("Isusu was deployed to:", isusu.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
