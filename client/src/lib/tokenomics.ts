/**
 * Tokenomics Implementation for SecureWallet
 * 
 * This module implements the tokenomics system with the "No Expectations Fund" (25%)
 * and Buy & Burn (75%) mechanisms
 */

// Export a tokenomics configuration object for easy access throughout the app
export const tokenomicsConfig = {
  feePercentage: 0.002,
  devFundPercentage: 0.25,
  buyBurnPercentage: 0.75,
  devFundAddress: '0x3bE00923dF0D7fb06f79fc0628525b855797d8F8'
};

import { ethers } from 'ethers';

// Developer fund address - No Expectations Fund (25% of fees)
export const DEVELOPER_FUND_ADDRESS = '0x3bE00923dF0D7fb06f79fc0628525b855797d8F8';

// Constants for tokenomics settings
export const FEE_PERCENTAGE = 0.002; // 0.2% transaction fee
export const DEVELOPER_FUND_PERCENTAGE = 0.25; // 25% of fees go to dev fund
export const BUY_BURN_PERCENTAGE = 0.75; // 75% of fees go to buy & burn

// Token discounts (hold tokens to get fee discounts)
export const TOKEN_DISCOUNT_TIERS = [
  { minTokens: 1000, discountPercentage: 0.05 }, // 5% discount with 1,000 tokens
  { minTokens: 5000, discountPercentage: 0.10 }, // 10% discount with 5,000 tokens
  { minTokens: 10000, discountPercentage: 0.15 }, // 15% discount with 10,000 tokens
  { minTokens: 25000, discountPercentage: 0.20 }, // 20% discount with 25,000 tokens
  { minTokens: 50000, discountPercentage: 0.25 }, // 25% discount with 50,000 tokens
  { minTokens: 100000, discountPercentage: 0.30 }, // 30% discount with 100,000 tokens
];

/**
 * Calculate fee for a given transaction amount
 * @param amount - Transaction amount in base units (wei, gwei, etc.)
 * @param tokenBalance - User's token balance for discount calculation
 * @returns Object containing fee amounts and distribution
 */
export function calculateFee(amount: string, tokenBalance: number = 0): {
  totalFee: string;
  developerFund: string;
  buyAndBurn: string;
  discountApplied: number;
  effectiveFeePercentage: number;
} {
  // Convert amount to BigNumber for safe calculations
  const amountBN = ethers.parseUnits(amount, 'ether');
  
  // Calculate discount based on token balance
  let discountPercentage = 0;
  for (const tier of TOKEN_DISCOUNT_TIERS) {
    if (tokenBalance >= tier.minTokens) {
      discountPercentage = tier.discountPercentage;
    } else {
      break;
    }
  }
  
  // Calculate effective fee percentage after discount
  const effectiveFeePercentage = FEE_PERCENTAGE * (1 - discountPercentage);
  
  // Calculate total fee
  const feeMultiplier = BigInt(Math.floor(effectiveFeePercentage * 10000));
  const totalFeeBN = (amountBN * feeMultiplier) / BigInt(10000);
  
  // Calculate distribution
  const devFundMultiplier = BigInt(Math.floor(DEVELOPER_FUND_PERCENTAGE * 10000));
  const developerFundBN = (totalFeeBN * devFundMultiplier) / BigInt(10000);
  
  const buyBurnMultiplier = BigInt(Math.floor(BUY_BURN_PERCENTAGE * 10000));
  const buyAndBurnBN = (totalFeeBN * buyBurnMultiplier) / BigInt(10000);
  
  // Return values converted to strings
  return {
    totalFee: ethers.formatEther(totalFeeBN),
    developerFund: ethers.formatEther(developerFundBN),
    buyAndBurn: ethers.formatEther(buyAndBurnBN),
    discountApplied: discountPercentage,
    effectiveFeePercentage
  };
}

/**
 * Distribute transaction fee according to tokenomics rules
 * @param provider - Ethereum provider
 * @param signer - Transaction signer
 * @param amount - Fee amount in base units
 * @returns Promise resolving to transaction hash
 */
export async function distributeFee(
  provider: ethers.JsonRpcProvider,
  signer: ethers.Signer,
  amount: string
): Promise<string> {
  // Parse amount as BigNumber
  const amountBN = ethers.parseEther(amount);
  
  // Calculate distribution amounts
  const devFundMultiplier = BigInt(Math.floor(DEVELOPER_FUND_PERCENTAGE * 10000));
  const developerFundAmount = (amountBN * devFundMultiplier) / BigInt(10000);
  
  const buyBurnMultiplier = BigInt(Math.floor(BUY_BURN_PERCENTAGE * 10000));
  const buyAndBurnAmount = (amountBN * buyBurnMultiplier) / BigInt(10000);
  
  // Send fee to developer fund
  const devFundTx = await signer.sendTransaction({
    to: DEVELOPER_FUND_ADDRESS,
    value: developerFundAmount
  });
  
  await devFundTx.wait();
  
  // Execute buy and burn mechanism (implementation will depend on DEX integration)
  // For production, this would integrate with PulseX or another DEX on PulseChain
  // For now, we'll just send to a designated burn address
  const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
  
  const burnTx = await signer.sendTransaction({
    to: BURN_ADDRESS,
    value: buyAndBurnAmount
  });
  
  await burnTx.wait();
  
  // Return transaction hash of the developer fund transaction
  return devFundTx.hash;
}

/**
 * Get tokenomics statistics and metrics
 */
export async function getTokenomicsStats(provider: ethers.JsonRpcProvider): Promise<{
  totalFeeCollected: string;
  totalBurned: string;
  developerFundBalance: string;
}> {
  // Get developer fund balance
  const devFundBalance = await provider.getBalance(DEVELOPER_FUND_ADDRESS);
  
  // In production, these would be fetched from contract events or a database
  // For now, we'll return placeholder values based on current developer fund balance
  // This assumes the 25/75 split has been maintained historically
  const estimatedTotalFees = (devFundBalance * BigInt(100)) / BigInt(25);
  const estimatedBurned = (estimatedTotalFees * BigInt(75)) / BigInt(100);
  
  return {
    totalFeeCollected: ethers.formatEther(estimatedTotalFees),
    totalBurned: ethers.formatEther(estimatedBurned),
    developerFundBalance: ethers.formatEther(devFundBalance)
  };
}

/**
 * Interface for premium features
 */
export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  cost: number; // Cost in USD
  available: boolean;
}

/**
 * List of available premium features
 */
export const PREMIUM_FEATURES: PremiumFeature[] = [
  {
    id: 'advanced_ai',
    name: 'Advanced AI Trading Strategies',
    description: 'Access to advanced AI-generated trading strategies with higher profit potential',
    cost: 9.99,
    available: true
  },
  {
    id: 'enhanced_privacy',
    name: 'Enhanced Privacy Transactions',
    description: 'Additional privacy features with advanced zero-knowledge proofs',
    cost: 4.99,
    available: true
  },
  {
    id: 'priority_execution',
    name: 'Priority Transaction Execution',
    description: 'Get priority execution for your transactions during high network congestion',
    cost: 2.99,
    available: true
  },
  {
    id: 'custom_alerts',
    name: 'Custom Alerts & Notifications',
    description: 'Set up custom alerts for price movements, smart contract events, and more',
    cost: 1.99,
    available: true
  },
  {
    id: 'multichain_tx',
    name: 'Multi-Chain Transaction Bundling',
    description: 'Execute transactions across multiple chains in a single operation',
    cost: 7.99,
    available: false // Feature in development
  }
];

/**
 * Get the list of premium features available to the user
 * @param userSubscriptionLevel - User's subscription level (0=none, 1=basic, 2=premium, 3=enterprise)
 * @returns Array of available premium features
 */
export function getUserPremiumFeatures(userSubscriptionLevel: number): PremiumFeature[] {
  // Filter features based on subscription level
  // Higher subscription levels get more features included
  switch (userSubscriptionLevel) {
    case 3: // Enterprise
      return PREMIUM_FEATURES.filter(feature => feature.available);
    case 2: // Premium
      return PREMIUM_FEATURES.filter(feature => 
        feature.available && (feature.id !== 'multichain_tx'));
    case 1: // Basic
      return PREMIUM_FEATURES.filter(feature => 
        feature.available && ['advanced_ai', 'custom_alerts'].includes(feature.id));
    case 0: // Free
    default:
      return [];
  }
}

/**
 * Check if a user has access to a specific premium feature
 * @param featureId - ID of the feature to check
 * @param userSubscriptionLevel - User's subscription level
 * @param userPurchasedFeatures - Array of individually purchased feature IDs
 * @returns Boolean indicating if the user has access
 */
export function hasFeatureAccess(
  featureId: string, 
  userSubscriptionLevel: number,
  userPurchasedFeatures: string[] = []
): boolean {
  // User has access if they purchased the feature individually
  if (userPurchasedFeatures.includes(featureId)) {
    return true;
  }
  
  // Check if the feature is included in their subscription
  const features = getUserPremiumFeatures(userSubscriptionLevel);
  return features.some(feature => feature.id === featureId);
}