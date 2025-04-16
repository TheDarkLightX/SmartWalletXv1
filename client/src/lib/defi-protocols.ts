import { ethers } from "ethers";
import { getProvider, getWallet } from "./ethers";
import { pulseChainContractAddresses } from "./contracts";

// Protocol Types
export enum DeFiProtocolType {
  DEX = "DEX",                   // Decentralized Exchanges
  LENDING = "LENDING",           // Lending/Borrowing Platforms
  YIELD_AGGREGATOR = "YIELD_AGGREGATOR", // Yield Aggregators
  LIQUID_STAKING = "LIQUID_STAKING", // Liquid Staking
  DERIVATIVES = "DERIVATIVES",    // Derivatives Platforms
  OPTIONS = "OPTIONS",           // Options Protocols
  INSURANCE = "INSURANCE",       // Insurance Protocols
  LAUNCHPAD = "LAUNCHPAD"        // Token Launchpads
}

// Protocol Interface
export interface DeFiProtocol {
  id: string;
  name: string;
  type: DeFiProtocolType;
  description: string;
  chain: 'pulsechain' | 'ethereum';
  website: string;
  logoUrl: string;
  contractAddresses: {
    [key: string]: string;
  };
  tvl?: number; // Total Value Locked in USD
  apy?: number; // Average APY (if applicable)
  isActive: boolean;
}

// Strategy Action Types
export enum StrategyActionType {
  SWAP = "SWAP",                 // Token Swaps
  ADD_LIQUIDITY = "ADD_LIQUIDITY", // Add Liquidity
  REMOVE_LIQUIDITY = "REMOVE_LIQUIDITY", // Remove Liquidity
  STAKE = "STAKE",               // Staking
  UNSTAKE = "UNSTAKE",           // Unstaking
  BORROW = "BORROW",             // Borrowing
  REPAY = "REPAY",               // Repay Loan
  LEVERAGE = "LEVERAGE",         // Leverage Position
  YIELD_FARM = "YIELD_FARM",     // Yield Farming
  CLAIM_REWARDS = "CLAIM_REWARDS", // Claim Rewards
  FLASH_LOAN = "FLASH_LOAN"      // Flash Loan
}

// ================= PULSECHAIN DEFI PROTOCOLS =================

// PulseX DEX Protocol
export const pulseXProtocol: DeFiProtocol = {
  id: "pulsex",
  name: "PulseX",
  type: DeFiProtocolType.DEX,
  description: "PulseX is the native decentralized exchange on PulseChain, offering token swaps and liquidity provision.",
  chain: "pulsechain",
  website: "https://pulsex.com",
  logoUrl: "https://example.com/pulsex.png",
  contractAddresses: {
    router: "0x165C3410fC91EF562C50559f7d2289fEbed552d9",
    factory: "0x161152d5d1a1eB8c45E3c2C847c6d2Ea8ad16FeE",
    WPLS: "0x8a810ea8B121d08342E9e7696f3A0Cc0d1f845cA"
  },
  tvl: 120000000, // Example TVL
  isActive: true
};

// HedronHex Protocol - Staking
export const hedronProtocol: DeFiProtocol = {
  id: "hedron",
  name: "Hedron",
  type: DeFiProtocolType.LIQUID_STAKING,
  description: "Hedron is a yield-bearing token built on PulseChain that incorporates staking functionality.",
  chain: "pulsechain",
  website: "https://hedron.pro",
  logoUrl: "https://example.com/hedron.png",
  contractAddresses: {
    token: "0x3819f64f282bf135d62168C1e513280dAF905e06",
    staking: "0x9cd2FFB3246De4aC33ee48C757AB503DA8F373C1"
  },
  apy: 8.5, // Example APY
  isActive: true
};

// Phiat Protocol - Lending and Borrowing
export const phiatProtocol: DeFiProtocol = {
  id: "phiat",
  name: "Phiat",
  type: DeFiProtocolType.LENDING,
  description: "Phiat is a lending and borrowing protocol built on PulseChain, offering stablecoin loans against PLS and other assets.",
  chain: "pulsechain",
  website: "https://phiat.io",
  logoUrl: "https://example.com/phiat.png",
  contractAddresses: {
    lendingPool: "0x1234567890123456789012345678901234567890", // Example address
    oracle: "0x0987654321098765432109876543210987654321"       // Example address
  },
  tvl: 45000000, // Example TVL
  apy: 6.2, // Example lending APY
  isActive: true
};

// PulseDAO Protocol - Yield Aggregator
export const pulseDaoProtocol: DeFiProtocol = {
  id: "pulsedao",
  name: "PulseDAO",
  type: DeFiProtocolType.YIELD_AGGREGATOR,
  description: "PulseDAO is a yield aggregator that optimizes returns across various PulseChain DeFi protocols.",
  chain: "pulsechain",
  website: "https://pulsedao.finance",
  logoUrl: "https://example.com/pulsedao.png",
  contractAddresses: {
    vault: "0x2345678901234567890123456789012345678901", // Example address
    strategy: "0x3456789012345678901234567890123456789012" // Example address
  },
  tvl: 30000000, // Example TVL
  apy: 12.5, // Example APY
  isActive: true
};

// MaximusDAO Protocol - Launch Pad
export const maximusDaoProtocol: DeFiProtocol = {
  id: "maximusdao",
  name: "MaximusDAO",
  type: DeFiProtocolType.LAUNCHPAD,
  description: "MaximusDAO is a launchpad for new projects on PulseChain, providing initial liquidity and fair launches.",
  chain: "pulsechain",
  website: "https://maximusdao.com",
  logoUrl: "https://example.com/maximusdao.png",
  contractAddresses: {
    launchpad: "0x4567890123456789012345678901234567890123", // Example address
    staking: "0x5678901234567890123456789012345678901234"    // Example address
  },
  isActive: true
};

// ================= ETHEREUM DEFI PROTOCOLS =================

// Uniswap Protocol
export const uniswapProtocol: DeFiProtocol = {
  id: "uniswap",
  name: "Uniswap V3",
  type: DeFiProtocolType.DEX,
  description: "Uniswap is the leading decentralized exchange on Ethereum with concentrated liquidity positions.",
  chain: "ethereum",
  website: "https://uniswap.org",
  logoUrl: "https://example.com/uniswap.png",
  contractAddresses: {
    router: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  },
  tvl: 3500000000, // Example TVL
  isActive: true
};

// Aave Protocol
export const aaveProtocol: DeFiProtocol = {
  id: "aave",
  name: "Aave V3",
  type: DeFiProtocolType.LENDING,
  description: "Aave is a decentralized non-custodial liquidity protocol where users can participate as depositors or borrowers.",
  chain: "ethereum",
  website: "https://aave.com",
  logoUrl: "https://example.com/aave.png",
  contractAddresses: {
    lendingPool: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    dataProvider: "0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3"
  },
  tvl: 5700000000, // Example TVL
  apy: 3.2, // Example APY
  isActive: true
};

// Lido Protocol
export const lidoProtocol: DeFiProtocol = {
  id: "lido",
  name: "Lido",
  type: DeFiProtocolType.LIQUID_STAKING,
  description: "Lido is a liquid staking solution for Ethereum, allowing users to stake ETH while maintaining liquidity.",
  chain: "ethereum",
  website: "https://lido.fi",
  logoUrl: "https://example.com/lido.png",
  contractAddresses: {
    stETH: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"
  },
  tvl: 14000000000, // Example TVL
  apy: 3.8, // Example APY
  isActive: true
};

// Yearn Finance Protocol
export const yearnProtocol: DeFiProtocol = {
  id: "yearn",
  name: "Yearn Finance",
  type: DeFiProtocolType.YIELD_AGGREGATOR,
  description: "Yearn Finance is a suite of products in DeFi that provides yield generation, lending aggregation, and more.",
  chain: "ethereum",
  website: "https://yearn.finance",
  logoUrl: "https://example.com/yearn.png",
  contractAddresses: {
    registry: "0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804"
  },
  tvl: 800000000, // Example TVL
  apy: 8.1, // Example APY
  isActive: true
};

// All supported protocols
export const supportedProtocols: DeFiProtocol[] = [
  // PulseChain
  pulseXProtocol,
  hedronProtocol,
  phiatProtocol,
  pulseDaoProtocol,
  maximusDaoProtocol,
  
  // Ethereum
  uniswapProtocol,
  aaveProtocol,
  lidoProtocol,
  yearnProtocol
];

// Filter protocols by type
export const getProtocolsByType = (type: DeFiProtocolType, chain?: 'pulsechain' | 'ethereum'): DeFiProtocol[] => {
  return supportedProtocols.filter(protocol => 
    protocol.type === type && (chain ? protocol.chain === chain : true) && protocol.isActive
  );
};

// Filter protocols by chain
export const getProtocolsByChain = (chain: 'pulsechain' | 'ethereum'): DeFiProtocol[] => {
  return supportedProtocols.filter(protocol => protocol.chain === chain && protocol.isActive);
};

// Get all active protocols
export const getActiveProtocols = (): DeFiProtocol[] => {
  return supportedProtocols.filter(protocol => protocol.isActive);
};

// Get protocol by ID
export const getProtocolById = (id: string): DeFiProtocol | undefined => {
  return supportedProtocols.find(protocol => protocol.id === id);
};

// ================= PROTOCOL INTERACTION FUNCTIONS =================

// Swap Tokens on DEX (Generic implementation)
export const swapTokensOnDex = async (
  protocolId: string,
  fromTokenAddress: string,
  toTokenAddress: string,
  amountIn: string,
  slippageTolerance: number = 0.5, // 0.5% default slippage
  walletAddress: string,
  privateKey: string
): Promise<string> => {
  try {
    const protocol = getProtocolById(protocolId);
    if (!protocol || protocol.type !== DeFiProtocolType.DEX) {
      throw new Error(`Protocol ${protocolId} is not a valid DEX protocol`);
    }
    
    const networkKey = protocol.chain;
    const provider = getProvider(networkKey);
    const signer = getWallet(privateKey, networkKey);
    
    const routerAddress = protocol.contractAddresses.router;
    const routerAbi = [
      "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
      "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
      "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)",
      "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
    ];
    
    const router = new ethers.Contract(routerAddress, routerAbi, signer);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    
    let tx;
    const nativeTokenAddress = "native";
    const wrappedNativeAddress = networkKey === 'pulsechain' 
      ? protocol.contractAddresses.WPLS || pulseChainContractAddresses.PLS.address 
      : protocol.contractAddresses.WETH;
    
    // Native token (PLS/ETH) to Token swap
    if (fromTokenAddress === nativeTokenAddress) {
      const path = [wrappedNativeAddress, toTokenAddress];
      const amountInWei = ethers.parseEther(amountIn);
      
      // Get expected output
      const amounts = await router.getAmountsOut(amountInWei, path);
      const amountOutMin = amounts[1].mul(1000 - slippageTolerance * 10).div(1000); // Apply slippage tolerance
      
      tx = await router.swapExactETHForTokens(
        amountOutMin,
        path,
        walletAddress,
        deadline,
        { value: amountInWei }
      );
    }
    // Token to native token (PLS/ETH) swap
    else if (toTokenAddress === nativeTokenAddress) {
      const path = [fromTokenAddress, wrappedNativeAddress];
      
      // Approve router to spend tokens
      const tokenAbi = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];
      
      const tokenContract = new ethers.Contract(fromTokenAddress, tokenAbi, signer);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(amountIn, decimals);
      
      // Approve first
      const approveTx = await tokenContract.approve(routerAddress, amountInWei);
      await approveTx.wait();
      
      // Get expected output
      const amounts = await router.getAmountsOut(amountInWei, path);
      const amountOutMin = amounts[1].mul(1000 - slippageTolerance * 10).div(1000); // Apply slippage tolerance
      
      tx = await router.swapExactTokensForETH(
        amountInWei,
        amountOutMin,
        path,
        walletAddress,
        deadline
      );
    }
    // Token to Token swap
    else {
      const path = [fromTokenAddress, wrappedNativeAddress, toTokenAddress];
      
      // Approve router to spend tokens
      const tokenAbi = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function balanceOf(address owner) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ];
      
      const tokenContract = new ethers.Contract(fromTokenAddress, tokenAbi, signer);
      const decimals = await tokenContract.decimals();
      const amountInWei = ethers.parseUnits(amountIn, decimals);
      
      // Approve first
      const approveTx = await tokenContract.approve(routerAddress, amountInWei);
      await approveTx.wait();
      
      // Get expected output
      const amounts = await router.getAmountsOut(amountInWei, path);
      const amountOutMin = amounts[2].mul(1000 - slippageTolerance * 10).div(1000); // Apply slippage tolerance
      
      tx = await router.swapExactTokensForTokens(
        amountInWei,
        amountOutMin,
        path,
        walletAddress,
        deadline
      );
    }
    
    const receipt = await tx.wait();
    return receipt.transactionHash;
  } catch (error) {
    console.error(`Error swapping tokens on ${protocolId}:`, error);
    throw error;
  }
};

// Add Liquidity to DEX (Generic implementation)
export const addLiquidityToDex = async (
  protocolId: string,
  tokenAAddress: string,
  tokenBAddress: string,
  amountA: string,
  amountB: string,
  slippageTolerance: number = 0.5, // 0.5% default slippage
  walletAddress: string,
  privateKey: string
): Promise<string> => {
  try {
    const protocol = getProtocolById(protocolId);
    if (!protocol || protocol.type !== DeFiProtocolType.DEX) {
      throw new Error(`Protocol ${protocolId} is not a valid DEX protocol`);
    }
    
    const networkKey = protocol.chain;
    const provider = getProvider(networkKey);
    const signer = getWallet(privateKey, networkKey);
    
    const routerAddress = protocol.contractAddresses.router;
    const routerAbi = [
      "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) external returns (uint amountA, uint amountB, uint liquidity)",
      "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
    ];
    
    const router = new ethers.Contract(routerAddress, routerAbi, signer);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes
    
    let tx;
    const nativeTokenAddress = "native";
    
    // If one of the tokens is native (PLS/ETH)
    if (tokenAAddress === nativeTokenAddress || tokenBAddress === nativeTokenAddress) {
      const tokenAddress = tokenAAddress === nativeTokenAddress ? tokenBAddress : tokenAAddress;
      const tokenAmount = tokenAAddress === nativeTokenAddress ? amountB : amountA;
      const ethAmount = tokenAAddress === nativeTokenAddress ? amountA : amountB;
      
      // Approve router to spend tokens
      const tokenAbi = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function decimals() view returns (uint8)"
      ];
      
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
      const decimals = await tokenContract.decimals();
      const tokenAmountWei = ethers.parseUnits(tokenAmount, decimals);
      const ethAmountWei = ethers.parseEther(ethAmount);
      
      // Calculate min amounts with slippage
      const tokenAmountMin = tokenAmountWei.mul(1000 - slippageTolerance * 10).div(1000);
      const ethAmountMin = ethAmountWei.mul(1000 - slippageTolerance * 10).div(1000);
      
      // Approve first
      const approveTx = await tokenContract.approve(routerAddress, tokenAmountWei);
      await approveTx.wait();
      
      tx = await router.addLiquidityETH(
        tokenAddress,
        tokenAmountWei,
        tokenAmountMin,
        ethAmountMin,
        walletAddress,
        deadline,
        { value: ethAmountWei }
      );
    } 
    // Both tokens are ERC20
    else {
      // Approve router to spend both tokens
      const tokenAbi = [
        "function approve(address spender, uint256 amount) returns (bool)",
        "function decimals() view returns (uint8)"
      ];
      
      const tokenAContract = new ethers.Contract(tokenAAddress, tokenAbi, signer);
      const tokenBContract = new ethers.Contract(tokenBAddress, tokenAbi, signer);
      
      const decimalsA = await tokenAContract.decimals();
      const decimalsB = await tokenBContract.decimals();
      
      const amountAWei = ethers.parseUnits(amountA, decimalsA);
      const amountBWei = ethers.parseUnits(amountB, decimalsB);
      
      // Calculate min amounts with slippage
      const amountAMin = amountAWei.mul(1000 - slippageTolerance * 10).div(1000);
      const amountBMin = amountBWei.mul(1000 - slippageTolerance * 10).div(1000);
      
      // Approve first
      const approveATx = await tokenAContract.approve(routerAddress, amountAWei);
      await approveATx.wait();
      
      const approveBTx = await tokenBContract.approve(routerAddress, amountBWei);
      await approveBTx.wait();
      
      tx = await router.addLiquidity(
        tokenAAddress,
        tokenBAddress,
        amountAWei,
        amountBWei,
        amountAMin,
        amountBMin,
        walletAddress,
        deadline
      );
    }
    
    const receipt = await tx.wait();
    return receipt.transactionHash;
  } catch (error) {
    console.error(`Error adding liquidity to ${protocolId}:`, error);
    throw error;
  }
};

// Stake tokens in a staking protocol (Generic implementation)
export const stakeTokens = async (
  protocolId: string,
  tokenAddress: string,
  amount: string,
  walletAddress: string,
  privateKey: string
): Promise<string> => {
  try {
    const protocol = getProtocolById(protocolId);
    if (!protocol) {
      throw new Error(`Protocol ${protocolId} not found`);
    }
    
    const networkKey = protocol.chain;
    const provider = getProvider(networkKey);
    const signer = getWallet(privateKey, networkKey);
    
    // Different protocols may have different staking contracts and methods
    const stakingAddress = protocol.contractAddresses.staking;
    const stakingAbi = [
      "function stake(uint256 amount) external",
      "function deposit(uint256 amount) external" // Alternative method name
    ];
    
    const stakingContract = new ethers.Contract(stakingAddress, stakingAbi, signer);
    
    // Approve staking contract to spend tokens
    const tokenAbi = [
      "function approve(address spender, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)"
    ];
    
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
    const decimals = await tokenContract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    // Approve first
    const approveTx = await tokenContract.approve(stakingAddress, amountWei);
    await approveTx.wait();
    
    // Try with stake method first, fallback to deposit if needed
    let tx;
    try {
      tx = await stakingContract.stake(amountWei);
    } catch (error) {
      // Fallback to deposit method
      tx = await stakingContract.deposit(amountWei);
    }
    
    const receipt = await tx.wait();
    return receipt.transactionHash;
  } catch (error) {
    console.error(`Error staking tokens in ${protocolId}:`, error);
    throw error;
  }
};

// Lending tokens to a lending protocol (Generic implementation)
export const supplyAsset = async (
  protocolId: string,
  tokenAddress: string,
  amount: string,
  walletAddress: string,
  privateKey: string
): Promise<string> => {
  try {
    const protocol = getProtocolById(protocolId);
    if (!protocol || protocol.type !== DeFiProtocolType.LENDING) {
      throw new Error(`Protocol ${protocolId} is not a valid lending protocol`);
    }
    
    const networkKey = protocol.chain;
    const provider = getProvider(networkKey);
    const signer = getWallet(privateKey, networkKey);
    
    const lendingPoolAddress = protocol.contractAddresses.lendingPool;
    
    // Simplified ABI for lending pool
    const lendingPoolAbi = [
      "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external",
      "function deposit(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external" // Alternative method name
    ];
    
    const lendingPool = new ethers.Contract(lendingPoolAddress, lendingPoolAbi, signer);
    
    // Approve lending pool to spend tokens
    const tokenAbi = [
      "function approve(address spender, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)"
    ];
    
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
    const decimals = await tokenContract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    // Approve first
    const approveTx = await tokenContract.approve(lendingPoolAddress, amountWei);
    await approveTx.wait();
    
    // Try with supply method first, fallback to deposit if needed
    let tx;
    try {
      tx = await lendingPool.supply(tokenAddress, amountWei, walletAddress, 0);
    } catch (error) {
      // Fallback to deposit method
      tx = await lendingPool.deposit(tokenAddress, amountWei, walletAddress, 0);
    }
    
    const receipt = await tx.wait();
    return receipt.transactionHash;
  } catch (error) {
    console.error(`Error supplying assets to ${protocolId}:`, error);
    throw error;
  }
};

// Borrow assets from a lending protocol (Generic implementation)
export const borrowAsset = async (
  protocolId: string,
  tokenAddress: string,
  amount: string,
  interestRateMode: number, // 1 for stable, 2 for variable
  walletAddress: string,
  privateKey: string
): Promise<string> => {
  try {
    const protocol = getProtocolById(protocolId);
    if (!protocol || protocol.type !== DeFiProtocolType.LENDING) {
      throw new Error(`Protocol ${protocolId} is not a valid lending protocol`);
    }
    
    const networkKey = protocol.chain;
    const provider = getProvider(networkKey);
    const signer = getWallet(privateKey, networkKey);
    
    const lendingPoolAddress = protocol.contractAddresses.lendingPool;
    
    // Simplified ABI for lending pool
    const lendingPoolAbi = [
      "function borrow(address asset, uint256 amount, uint256 interestRateMode, uint16 referralCode, address onBehalfOf) external"
    ];
    
    const lendingPool = new ethers.Contract(lendingPoolAddress, lendingPoolAbi, signer);
    
    // Get token decimals
    const tokenAbi = ["function decimals() view returns (uint8)"];
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
    const decimals = await tokenContract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    const tx = await lendingPool.borrow(
      tokenAddress,
      amountWei,
      interestRateMode,
      0, // referral code
      walletAddress
    );
    
    const receipt = await tx.wait();
    return receipt.transactionHash;
  } catch (error) {
    console.error(`Error borrowing assets from ${protocolId}:`, error);
    throw error;
  }
};

// Yield farming - Deposit in yield aggregator (Generic implementation)
export const depositToYieldFarm = async (
  protocolId: string,
  vaultAddress: string,
  tokenAddress: string,
  amount: string,
  walletAddress: string,
  privateKey: string
): Promise<string> => {
  try {
    const protocol = getProtocolById(protocolId);
    if (!protocol || protocol.type !== DeFiProtocolType.YIELD_AGGREGATOR) {
      throw new Error(`Protocol ${protocolId} is not a valid yield aggregator`);
    }
    
    const networkKey = protocol.chain;
    const provider = getProvider(networkKey);
    const signer = getWallet(privateKey, networkKey);
    
    // Simplified ABI for vault
    const vaultAbi = [
      "function deposit(uint256 amount) external",
      "function deposit(uint256 amount, address recipient) external" // Alternative signature
    ];
    
    const vault = new ethers.Contract(vaultAddress, vaultAbi, signer);
    
    // Approve vault to spend tokens
    const tokenAbi = [
      "function approve(address spender, uint256 amount) returns (bool)",
      "function decimals() view returns (uint8)"
    ];
    
    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, signer);
    const decimals = await tokenContract.decimals();
    const amountWei = ethers.parseUnits(amount, decimals);
    
    // Approve first
    const approveTx = await tokenContract.approve(vaultAddress, amountWei);
    await approveTx.wait();
    
    // Try different deposit method signatures
    let tx;
    try {
      tx = await vault.deposit(amountWei);
    } catch (error) {
      // Fallback to alternative signature
      tx = await vault.deposit(amountWei, walletAddress);
    }
    
    const receipt = await tx.wait();
    return receipt.transactionHash;
  } catch (error) {
    console.error(`Error depositing to yield farm on ${protocolId}:`, error);
    throw error;
  }
};

// ================= HELPER FUNCTIONS =================

// Get protocol APY (simplified implementation)
export const getProtocolApy = async (protocolId: string, assetAddress?: string): Promise<number> => {
  // In a real implementation, this would fetch the current APY from the protocol
  const protocol = getProtocolById(protocolId);
  if (!protocol) {
    throw new Error(`Protocol ${protocolId} not found`);
  }
  
  // Return static APY for now
  return protocol.apy || 0;
};

// Get list of supported assets for a protocol
export const getSupportedAssets = (protocolId: string): { symbol: string, address: string, name: string }[] => {
  const protocol = getProtocolById(protocolId);
  if (!protocol) {
    throw new Error(`Protocol ${protocolId} not found`);
  }
  
  // For simplicity, return a fixed list for now
  // In a real implementation, this would be fetched from the protocol
  if (protocol.chain === "pulsechain") {
    return [
      { symbol: "PLS", address: "native", name: "PulseChain" },
      { symbol: "PLSX", address: pulseChainContractAddresses.PLSX.address, name: "PulseX" },
      // Add more PulseChain tokens as needed
    ];
  } else {
    return [
      { symbol: "ETH", address: "native", name: "Ethereum" },
      { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", name: "USD Coin" },
      { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", name: "Tether USD" },
      // Add more Ethereum tokens as needed
    ];
  }
};