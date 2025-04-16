import { ethers } from "ethers";

// Network configuration
export const networks = {
  pulsechain: {
    name: "PulseChain",
    chainId: 369,
    rpcUrl: "https://rpc.pulsechain.com",
    blockExplorer: "https://scan.pulsechain.com",
    isTestnet: false,
    nativeCurrency: {
      name: "PLS",
      symbol: "PLS",
      decimals: 18
    }
  },
  ethereum: {
    name: "Ethereum",
    chainId: 1,
    rpcUrl: "https://mainnet.infura.io/v3/your-infura-key-here",
    blockExplorer: "https://etherscan.io",
    isTestnet: false,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
    }
  }
};

// Default to PulseChain
export const defaultNetwork = networks.pulsechain;

// Initialize provider for a specific network
export const getProvider = (networkKey: 'pulsechain' | 'ethereum' = 'pulsechain') => {
  return new ethers.JsonRpcProvider(
    networks[networkKey].rpcUrl
  );
};

// Create a wallet instance from a private key
export const getWallet = (privateKey: string, networkKey: 'pulsechain' | 'ethereum' = 'pulsechain') => {
  const provider = getProvider(networkKey);
  return new ethers.Wallet(privateKey, provider);
};

// Get account balance
export const getBalance = async (address: string, networkKey: 'pulsechain' | 'ethereum' = 'pulsechain') => {
  const provider = getProvider(networkKey);
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance);
};

// Send a transaction
export const sendTransaction = async (
  privateKey: string,
  toAddress: string,
  amount: string,
  networkKey: 'pulsechain' | 'ethereum' = 'pulsechain',
  gasLimit = 21000
) => {
  const wallet = getWallet(privateKey, networkKey);
  const amountWei = ethers.parseEther(amount);
  
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
  amount: string,
  networkKey: 'pulsechain' | 'ethereum' = 'pulsechain'
) => {
  const provider = getProvider(networkKey);
  const amountWei = ethers.parseEther(amount);
  
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

// Convert Wei to ETH/PLS
export const weiToEth = (weiAmount: string) => {
  return ethers.formatEther(weiAmount);
};

// Convert ETH/PLS to Wei
export const ethToWei = (ethAmount: string) => {
  return ethers.parseEther(ethAmount).toString();
};

// Generates a random wallet (for demo purposes)
export const generateWallet = () => {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey
  };
};

// Helper to get native currency symbol based on network
export const getNativeCurrencySymbol = (networkKey: 'pulsechain' | 'ethereum' = 'pulsechain'): string => {
  return networks[networkKey].nativeCurrency.symbol;
};
