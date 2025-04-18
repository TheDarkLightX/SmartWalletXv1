import { ethers } from "hardhat";

async function main() {
  // TODO: replace these with your real guardian addresses
  const guardians = [
    "0xAbC123...000",
    "0xDeF456...111",
    "0x789GHI...222"
  ];
  const threshold = 2;

  const Wallet = await ethers.getContractFactory("SmartWallet");
  const wallet = await Wallet.deploy(
    guardians,
    threshold,
    { value: ethers.utils.parseEther("0.1") }
  );

  await wallet.deployed();
  console.log("SmartWallet deployed to", wallet.address);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});