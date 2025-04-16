import { ethers } from "ethers";
import { getProvider } from "./ethers";

// Simple ERC20 ABI with just the functions we need
export const erc20Abi = [
  // Read-only functions
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  
  // Authenticated functions
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint amount)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Simple DEX Router ABI (similar to UniswapV2Router)
export const dexRouterAbi = [
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)"
];

// Wallet token interface
export const getWalletTokenContract = (
  tokenAddress: string, 
  networkKey: 'pulsechain' | 'ethereum' = 'pulsechain'
) => {
  const provider = getProvider(networkKey);
  return new ethers.Contract(tokenAddress, erc20Abi, provider);
};

// Contract addresses for PulseChain ecosystem
export const pulseChainContractAddresses = {
  // Native token
  PLS: {
    address: "native", // Special flag for native token
    name: "PulseChain",
    decimals: 18
  },
  
  // Common PulseChain tokens
  PLSX: {
    address: "0x95B303987A60C71504D99Aa1b13B4DA07b0790ab", // PulseX token 
    name: "PulseX",
    decimals: 18
  },
  
  // DEX router (PulseX)
  ROUTER: {
    address: "0x165C3410fC91EF562C50559f7d2289fEbed552d9", // PulseX router
    name: "PulseX Router",
  },
  
  // Wallet token (would be your own token)
  WALLET_TOKEN: {
    address: "0xWALLET_TOKEN_ADDRESS", // Replace with actual address when deployed
    name: "Wallet Token",
    symbol: "WALLET",
    decimals: 18
  }
};

// Function to get token balance
export const getTokenBalance = async (
  tokenAddress: string,
  walletAddress: string,
  networkKey: 'pulsechain' | 'ethereum' = 'pulsechain'
): Promise<string> => {
  // Handle native token (PLS/ETH) case
  if (tokenAddress === "native") {
    const provider = getProvider(networkKey);
    const balanceWei = await provider.getBalance(walletAddress);
    return ethers.formatEther(balanceWei);
  }
  
  // Handle ERC20 tokens
  const contract = getWalletTokenContract(tokenAddress, networkKey);
  const balance = await contract.balanceOf(walletAddress);
  const decimals = await contract.decimals();
  
  // Format the balance with the correct number of decimals
  return ethers.formatUnits(balance, decimals);
};

// Buy tokens from DEX (simplified implementation)
export const buyTokensFromDex = async (
  routerAddress: string,
  tokenAddress: string,
  amountIn: string, // Amount of native currency (PLS/ETH) to spend
  walletAddress: string,
  privateKey: string,
  networkKey: 'pulsechain' | 'ethereum' = 'pulsechain'
): Promise<string> => {
  const provider = getProvider(networkKey);
  const signer = new ethers.Wallet(privateKey, provider);
  
  // Router contract
  const router = new ethers.Contract(routerAddress, dexRouterAbi, signer);
  
  // WETH address is the first token in the path for swapping ETH/PLS
  const wethAddress = networkKey === 'pulsechain'
    ? "0x8a810ea8B121d08342E9e7696f3A0Cc0d1f845cA" // Wrapped PLS
    : "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // Wrapped ETH on mainnet
  
  try {
    // Swap ETH/PLS for the token
    const tx = await router.swapExactETHForTokens(
      0, // amountOutMin: accept any amount of tokens (in production, should calculate minimum)
      [wethAddress, tokenAddress], // path: swap from ETH/PLS -> token
      walletAddress, // recipient
      Math.floor(Date.now() / 1000) + 60 * 20, // deadline: 20 minutes from now
      { value: ethers.parseEther(amountIn) } // amount of ETH/PLS to swap
    );
    
    const receipt = await tx.wait();
    return receipt.transactionHash;
  } catch (error) {
    console.error("Error buying tokens:", error);
    throw error;
  }
};