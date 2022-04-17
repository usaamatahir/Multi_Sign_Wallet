// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import fs from "fs";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const [owner, approver2, approver3] = await ethers.getSigners();
  const Wallet = await ethers.getContractFactory("Wallet");
  const wallet = await Wallet.deploy(
    [owner.address, approver2.address, approver3.address],
    2
  );

  await wallet.deployed();

  fs.writeFileSync(
    "./config.ts",
    `export const ContactAddress = "${wallet.address}";\n`,
    "utf8"
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
