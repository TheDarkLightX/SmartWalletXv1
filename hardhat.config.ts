import { HardhatUserConfig } from "hardhat/types";
import "@nomiclabs/hardhat-ethers";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    pulsechain: {
      url: "https://rpc.pulsechain.com",
      chainId: 369,
      accounts: ["<YOUR_PRIVATE_KEY>"]
    }
  }
};
export default config;