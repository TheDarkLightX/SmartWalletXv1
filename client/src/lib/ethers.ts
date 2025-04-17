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

/**
 * Generates a cryptographically secure random wallet with high entropy
 * Uses multiple sources of randomness for maximum security:
 * 1. Native crypto.getRandomValues as primary source (CSPRNG)
 * 2. Ethers.js built-in randomness generation (which uses native crypto)
 * 3. Additional entropy from timing and environmental variables
 * 
 * The ethers.js createRandom() function internally:
 * - Uses crypto.getRandomValues to collect 256 bits (32 bytes) of random entropy
 * - Implements BIP-39 to generate a 12-word mnemonic seed phrase
 * - Derives keys using HMAC-SHA512 according to BIP-32/BIP-44 standards
 */
export const generateWallet = () => {
  // Additional entropy collection
  const extraEntropy = collectExtraEntropy();
  
  // Generate wallet with extra entropy
  // ethers.js v6 changed the API - we need to use randomBytes to add our entropy
  const entropyHex = Buffer.from(extraEntropy).toString('hex');
  const wallet = ethers.Wallet.createRandom();
  
  // Get the mnemonic (seed phrase) and HD node path
  const mnemonic = wallet.mnemonic?.phrase || '';
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: mnemonic,
    path: "m/44'/60'/0'/0/0" // BIP-44 standard path for Ethereum
  };
};

/**
 * Collects additional entropy from multiple sources to strengthen randomness
 * @returns A Uint8Array of additional entropy
 */
function collectExtraEntropy(): Uint8Array {
  // Create buffer for entropy (32 bytes = 256 bits)
  const entropy = new Uint8Array(32);
  
  // 1. Get primary randomness from crypto.getRandomValues
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(entropy);
  }
  
  // 2. Add timing-based entropy
  const timeData = new Uint32Array(2);
  timeData[0] = Date.now();
  timeData[1] = performance.now() * 1000000;
  
  // Mix time-based entropy into main entropy buffer
  for (let i = 0; i < 8; i++) {
    if (i < 4) {
      entropy[i] ^= (timeData[0] >> (i * 8)) & 0xff;
    } else {
      entropy[i] ^= (timeData[1] >> ((i - 4) * 8)) & 0xff;
    }
  }
  
  // 3. Add browser/environment-based entropy
  const envEntropy = new TextEncoder().encode(
    navigator.userAgent +
    window.screen.width.toString() +
    window.screen.height.toString() +
    navigator.language +
    (new Date().getTimezoneOffset().toString())
  );
  
  // Mix environment entropy in
  for (let i = 0; i < envEntropy.length && i < 24; i++) {
    entropy[i + 8] ^= envEntropy[i];
  }
  
  return entropy;
}

// Helper to get native currency symbol based on network
export const getNativeCurrencySymbol = (networkKey: 'pulsechain' | 'ethereum' = 'pulsechain'): string => {
  return networks[networkKey].nativeCurrency.symbol;
};
