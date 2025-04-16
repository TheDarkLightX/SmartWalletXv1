import { ethers } from "ethers";

// Network configuration
export const networks = {
  pulsechain: {
    name: "PulseChain",
    chainId: 369,
    rpcUrl: "https://rpc.pulsechain.com",
    blockExplorer: "https://scan.pulsechain.com",
    isTestnet: false
  },
  ethereum: {
    name: "Ethereum",
    chainId: 1,
    rpcUrl: "https://mainnet.infura.io/v3/your-infura-key-here",
    blockExplorer: "https://etherscan.io",
    isTestnet: false
  }
};

// Default to PulseChain
export const defaultNetwork = networks.pulsechain;

// Initialize provider for a specific network
export const getProvider = (networkKey: 'pulsechain' | 'ethereum' = 'pulsechain') => {
  return new ethers.providers.JsonRpcProvider(
    networks[networkKey].rpcUrl
  );
};

// Create a wallet instance from a private key
export const getWallet = (privateKey: string) => {
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
};

// Get account balance
export const getBalance = async (address: string) => {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  return ethers.utils.formatEther(balance);
};

// Send a transaction
export const sendTransaction = async (
  privateKey: string,
  toAddress: string,
  amount: string,
  gasLimit = 21000
) => {
  const wallet = getWallet(privateKey);
  const amountWei = ethers.utils.parseEther(amount);
  
  const tx = await wallet.sendTransaction({
    to: toAddress,
    value: amountWei,
    gasLimit
  });
  
  return tx;
};

// Estimate transaction gas
export const estimateGas = async (
  fromAddress: string,
  toAddress: string,
  amount: string
) => {
  const provider = getProvider();
  const amountWei = ethers.utils.parseEther(amount);
  
  const estimatedGas = await provider.estimateGas({
    from: fromAddress,
    to: toAddress,
    value: amountWei
  });
  
  return estimatedGas.toString();
};

// Format account address for display
export const formatAddress = (address: string) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Convert Wei to ETH
export const weiToEth = (weiAmount: string) => {
  return ethers.utils.formatEther(weiAmount);
};

// Convert ETH to Wei
export const ethToWei = (ethAmount: string) => {
  return ethers.utils.parseEther(ethAmount).toString();
};

// Generates a random wallet (for demo purposes)
export const generateWallet = () => {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
};
