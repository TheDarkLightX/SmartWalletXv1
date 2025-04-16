import { ethers } from 'ethers';
import { NetworkKey } from '@/hooks/useNetwork';

export enum DeFiProtocolType {
  DEX = 'DEX',
  LENDING = 'LENDING',
  YIELD_AGGREGATOR = 'YIELD_AGGREGATOR',
  LIQUID_STAKING = 'LIQUID_STAKING',
}

export enum StrategyActionType {
  SWAP = 'SWAP',
  ADD_LIQUIDITY = 'ADD_LIQUIDITY',
  REMOVE_LIQUIDITY = 'REMOVE_LIQUIDITY',
  BORROW = 'BORROW',
  REPAY = 'REPAY',
  YIELD_FARM = 'YIELD_FARM',
  CLAIM_REWARDS = 'CLAIM_REWARDS',
  STAKE = 'STAKE',
  UNSTAKE = 'UNSTAKE',
}

export interface Asset {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  chain: NetworkKey;
  logoUrl?: string;
}

export interface DeFiProtocol {
  id: string;
  name: string;
  description: string;
  type: DeFiProtocolType;
  chain: NetworkKey;
  website: string;
  logoUrl?: string;
  tags: string[];
  tvl: number;
  apy?: number;
  contractAddress: string;
  router?: string;
  factory?: string;
}

// Sample assets for Pulsechain
const pulseChainAssets: Asset[] = [
  {
    symbol: 'PLS',
    name: 'Pulsechain',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    chain: 'pulsechain',
    logoUrl: 'https://cryptologos.cc/logos/pulsechain-pls-logo.png'
  },
  {
    symbol: 'PLSX',
    name: 'PulseX',
    address: '0x95B303987A60C71504D99Aa1b13B4DA07b0790ab',
    decimals: 18,
    chain: 'pulsechain',
    logoUrl: 'https://cryptologos.cc/logos/pulsex-plsx-logo.png'
  },
  {
    symbol: 'INC',
    name: 'Incentive Token',
    address: '0x2fa878Ab3F87CC1C9737Fc071108C1A89D117T74',
    decimals: 18,
    chain: 'pulsechain',
    logoUrl: 'https://cryptologos.cc/logos/pulsechain-inc-logo.png'
  },
  {
    symbol: 'HEX',
    name: 'HEX',
    address: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39',
    decimals: 8,
    chain: 'pulsechain',
    logoUrl: 'https://cryptologos.cc/logos/hex-hex-logo.png'
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0x0cb6f5a34ad42ec934882a05265a7d5f59b51a2f',
    decimals: 6,
    chain: 'pulsechain',
    logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0xefeefef7d0674f0d709ee6c8dd1c4f35ebd3ef8b',
    decimals: 18,
    chain: 'pulsechain',
    logoUrl: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png'
  },
];

// Sample assets for Ethereum
const ethereumAssets: Asset[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    chain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    chain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png'
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    chain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/tether-usdt-logo.png'
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    decimals: 18,
    chain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png'
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    decimals: 8,
    chain: 'ethereum',
    logoUrl: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png'
  },
];

// PulseChain DeFi Protocols
const pulseChainProtocols: DeFiProtocol[] = [
  {
    id: 'pulsex',
    name: 'PulseX',
    description: 'The native decentralized exchange for PulseChain, offering low fees and high liquidity for swaps.',
    type: DeFiProtocolType.DEX,
    chain: 'pulsechain',
    website: 'https://pulsex.com',
    logoUrl: 'https://cryptologos.cc/logos/pulsex-plsx-logo.png',
    tags: ['PulseChain', 'DEX', 'AMM'],
    tvl: 150000000,
    apy: 5.2,
    contractAddress: '0x1b8eEF4a14F7C428bD53dF371e7D0dFaC1854608',
    router: '0x5eF0069eDA795CEF0aBc16af6094FdE84B9F8C6E',
    factory: '0xE1d4A40703a438845E5242D1526c0A1241728e8E'
  },
  {
    id: 'pulselend',
    name: 'PulseLend',
    description: 'Lending and borrowing protocol on PulseChain, enabling users to earn interest on deposits or take out loans.',
    type: DeFiProtocolType.LENDING,
    chain: 'pulsechain',
    website: 'https://pulselend.io',
    logoUrl: 'https://cryptologos.cc/logos/pulsechain-pls-logo.png',
    tags: ['PulseChain', 'Lending', 'Borrowing'],
    tvl: 85000000,
    apy: 3.8,
    contractAddress: '0x23fc76Ce89E829D9734101C7A4A057EbF4861621'
  },
  {
    id: 'pulseyield',
    name: 'PulseYield',
    description: 'Yield aggregator that automatically moves funds between lending protocols to maximize returns.',
    type: DeFiProtocolType.YIELD_AGGREGATOR,
    chain: 'pulsechain',
    website: 'https://pulseyield.finance',
    logoUrl: 'https://cryptologos.cc/logos/pulsechain-pls-logo.png',
    tags: ['PulseChain', 'Yield', 'Aggregator'],
    tvl: 54000000,
    apy: 7.5,
    contractAddress: '0xd8F6B6264DB97d41382C0eEdCc92C7aEE9849842'
  },
  {
    id: 'pulsestake',
    name: 'PulseStake',
    description: 'Liquid staking protocol for PulseChain, allowing users to stake PLS while maintaining liquidity.',
    type: DeFiProtocolType.LIQUID_STAKING,
    chain: 'pulsechain',
    website: 'https://pulsestake.io',
    logoUrl: 'https://cryptologos.cc/logos/pulsechain-pls-logo.png',
    tags: ['PulseChain', 'Staking', 'Liquid Staking'],
    tvl: 120000000,
    apy: 4.3,
    contractAddress: '0x47F3e365bA379f7A6DeD72D43C0a9c98b4F12df9'
  }
];

// Ethereum DeFi Protocols
const ethereumProtocols: DeFiProtocol[] = [
  {
    id: 'uniswap',
    name: 'Uniswap',
    description: 'Leading decentralized exchange that uses an automated market maker (AMM) model.',
    type: DeFiProtocolType.DEX,
    chain: 'ethereum',
    website: 'https://uniswap.org',
    logoUrl: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
    tags: ['Ethereum', 'DEX', 'AMM'],
    tvl: 3500000000,
    apy: 3.8,
    contractAddress: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
  },
  {
    id: 'aave',
    name: 'Aave',
    description: 'Open source and non-custodial liquidity protocol for earning interest on deposits and borrowing assets.',
    type: DeFiProtocolType.LENDING,
    chain: 'ethereum',
    website: 'https://aave.com',
    logoUrl: 'https://cryptologos.cc/logos/aave-aave-logo.png',
    tags: ['Ethereum', 'Lending', 'Borrowing'],
    tvl: 5700000000,
    apy: 2.5,
    contractAddress: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'
  },
  {
    id: 'yearn',
    name: 'Yearn Finance',
    description: 'Suite of products in DeFi that provides yield generation, lending aggregation, and more.',
    type: DeFiProtocolType.YIELD_AGGREGATOR,
    chain: 'ethereum',
    website: 'https://yearn.finance',
    logoUrl: 'https://cryptologos.cc/logos/yearn-finance-yfi-logo.png',
    tags: ['Ethereum', 'Yield', 'Aggregator'],
    tvl: 1200000000,
    apy: 8.2,
    contractAddress: '0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e'
  },
  {
    id: 'lido',
    name: 'Lido',
    description: 'Liquid staking solution for Ethereum, allowing users to stake ETH while maintaining liquidity.',
    type: DeFiProtocolType.LIQUID_STAKING,
    chain: 'ethereum',
    website: 'https://lido.fi',
    logoUrl: 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png',
    tags: ['Ethereum', 'Staking', 'Liquid Staking'],
    tvl: 15600000000,
    apy: 3.7,
    contractAddress: '0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32'
  }
];

// Combine all protocols
export const supportedProtocols: DeFiProtocol[] = [
  ...pulseChainProtocols,
  ...ethereumProtocols
];

// Helper function to get protocols by chain
export const getProtocolsByChain = (chain: NetworkKey): DeFiProtocol[] => {
  return supportedProtocols.filter(protocol => protocol.chain === chain);
};

// Helper function to get a specific protocol by ID
export const getProtocolById = (id: string): DeFiProtocol | undefined => {
  return supportedProtocols.find(protocol => protocol.id === id);
};

// Helper function to get assets for a specific protocol
export const getSupportedAssets = (protocolId: string): Asset[] => {
  const protocol = getProtocolById(protocolId);
  if (!protocol) return [];
  
  return protocol.chain === 'pulsechain' ? pulseChainAssets : ethereumAssets;
};

// Calculator functions for different protocol actions

// Calculate swap output amount based on input amount and prices
export const calculateSwapOutput = (
  inputAmount: number,
  inputTokenAddress: string,
  outputTokenAddress: string,
  slippage: number = 0.5
): { outputAmount: number; minOutputAmount: number; priceImpact: number } => {
  // In a production app, this would fetch real-time data from on-chain
  const mockExchangeRate = 1.5; // Example rate
  const outputAmount = inputAmount * mockExchangeRate;
  const priceImpact = inputAmount > 10000 ? 0.8 : 0.2; // Mock price impact based on size
  const minOutputAmount = outputAmount * (1 - (slippage / 100));
  
  return {
    outputAmount,
    minOutputAmount,
    priceImpact
  };
};

// Calculate APY for lending/borrowing
export const calculateLendingAPY = (
  tokenAddress: string,
  protocolId: string,
  isSupply: boolean = true
): number => {
  // In production, this would fetch real-time APY data from the protocol
  const mockBaseAPY = {
    'aave': isSupply ? 2.5 : 4.8,
    'pulselend': isSupply ? 3.8 : 5.2,
  };
  
  return mockBaseAPY[protocolId as keyof typeof mockBaseAPY] || 0;
};

// Calculate expected rewards for yield farming
export const calculateYieldFarmingRewards = (
  amount: number,
  protocolId: string,
  days: number = 30
): { tokenRewards: number; usdValue: number } => {
  // Mock calculation
  const mockDailyRate = {
    'yearn': 0.00021, // 7.6% APY
    'pulseyield': 0.00025, // 9.1% APY
  };
  
  const rate = mockDailyRate[protocolId as keyof typeof mockDailyRate] || 0;
  const tokenRewards = amount * rate * days;
  const usdValue = tokenRewards * 1.2; // Mock USD conversion
  
  return {
    tokenRewards,
    usdValue
  };
};

// Helper function for executing a DeFi strategy
export const executeStrategy = async (
  walletAddress: string,
  protocolId: string,
  actionType: StrategyActionType,
  params: any
): Promise<boolean> => {
  // This would actually call contract methods via ethers.js
  console.log(`Executing ${actionType} on ${protocolId} for wallet ${walletAddress}`);
  console.log('Params:', params);
  
  // Mock successful execution
  return true;
};

// Advanced integration with DEX contracts (for a real implementation)
export const swapTokens = async (
  provider: ethers.providers.Provider,
  routerAddress: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  slippageTolerance: number = 0.5,
  deadline: number = Math.floor(Date.now() / 1000) + 20 * 60, // 20 minutes
  signer: ethers.Signer
): Promise<ethers.providers.TransactionResponse> => {
  // This example would use the actual router ABI and contract instance
  // but is simplified for demonstration
  
  const routerAbi = [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
  ];
  
  const router = new ethers.Contract(routerAddress, routerAbi, signer);
  
  // Calculate minimum output amount with slippage tolerance
  const path = [tokenInAddress, tokenOutAddress];
  // This would normally get quotes from the router
  const amountOutMin = BigInt(Math.floor(Number(amountIn) * 0.98 * (1 - slippageTolerance / 100)));
  
  // Execute the swap
  return router.swapExactTokensForTokens(
    amountIn,
    amountOutMin,
    path,
    await signer.getAddress(),
    deadline
  );
};