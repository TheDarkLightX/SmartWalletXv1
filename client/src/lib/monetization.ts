import { ethers } from "ethers";
import { tokenomicsConfig } from "./tokenomics";

// Monetization strategy configuration
export const monetizationConfig = {
  // AI strategy generation fees
  aiStrategyGeneration: {
    basicFee: 0.0005, // 0.05% of transaction amount or 0.0005 PLS for basic strategy
    advancedFee: 0.001, // 0.1% of transaction amount or 0.001 PLS for advanced strategy
    premiumFee: 0.002, // 0.2% of transaction amount or 0.002 PLS for premium strategy
    freeCreditsPerMonth: 3, // Number of free strategy generations per month
  },
  
  // Social recovery setup and activation
  socialRecovery: {
    setupFee: 0.001, // 0.001 PLS to set up social recovery
    activationFee: 0.005, // 0.005 PLS to activate social recovery (when needed)
    freeForPremium: true, // Free for premium tier users
  },
  
  // Privacy features (Tornado Cash-like)
  privacyFeatures: {
    smallTransactionFee: 0.001, // 0.1% for transactions < 100 PLS
    mediumTransactionFee: 0.0008, // 0.08% for transactions 100-1000 PLS 
    largeTransactionFee: 0.0005, // 0.05% for transactions > 1000 PLS
    minimumFee: 0.0005, // Minimum fee in PLS
  },
  
  // Subscription tiers
  subscriptionTiers: {
    free: {
      name: "Free",
      monthlyAICredits: 3,
      privacyTransactionsPerMonth: 2,
      socialRecoveryIncluded: false,
      transactionFeeDiscount: 0,
      monthlyPrice: 0,
    },
    basic: {
      name: "Basic",
      monthlyAICredits: 10,
      privacyTransactionsPerMonth: 5,
      socialRecoveryIncluded: false,
      transactionFeeDiscount: 0.2, // 20% discount on transaction fees
      monthlyPrice: 5, // 5 PLS per month
    },
    premium: {
      name: "Premium",
      monthlyAICredits: 50,
      privacyTransactionsPerMonth: 20,
      socialRecoveryIncluded: true,
      transactionFeeDiscount: 0.5, // 50% discount on transaction fees
      monthlyPrice: 15, // 15 PLS per month
    },
    unlimited: {
      name: "Unlimited",
      monthlyAICredits: Infinity,
      privacyTransactionsPerMonth: Infinity,
      socialRecoveryIncluded: true,
      transactionFeeDiscount: 0.75, // 75% discount on transaction fees
      monthlyPrice: 50, // 50 PLS per month
    }
  },
  
  // Revenue split for premium features
  revenueSplit: {
    noExpectationsFund: 0.90, // 90% to the No Expectations Fund
    buyAndBurn: 0.10, // 10% to Buy & Burn
  },
};

// Types for subscription tiers
export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'unlimited';

// Interface for user subscription state
export interface SubscriptionState {
  tier: SubscriptionTier;
  aiCreditsRemaining: number;
  privacyTransactionsRemaining: number;
  subscriptionEndDate?: Date;
  autoRenewal: boolean;
}

// Calculate AI strategy fee based on amount and strategy complexity
export const calculateAIStrategyFee = (
  strategyComplexity: 'basic' | 'advanced' | 'premium',
  transactionAmount?: string,
  userTier: SubscriptionTier = 'free'
): string => {
  // Check if user has free credits
  if (hasRemainingAICredits(userTier)) {
    return "0";
  }
  
  // Base fee based on complexity
  let baseFee: number;
  switch (strategyComplexity) {
    case 'basic':
      baseFee = monetizationConfig.aiStrategyGeneration.basicFee;
      break;
    case 'advanced':
      baseFee = monetizationConfig.aiStrategyGeneration.advancedFee;
      break;
    case 'premium':
      baseFee = monetizationConfig.aiStrategyGeneration.premiumFee;
      break;
  }
  
  // Apply percentage fee if transaction amount is provided
  if (transactionAmount) {
    const amount = parseFloat(transactionAmount);
    const percentageFee = amount * baseFee;
    return percentageFee.toString();
  }
  
  // Otherwise return flat fee
  return baseFee.toString();
};

// Calculate social recovery fee
export const calculateSocialRecoveryFee = (
  action: 'setup' | 'activation',
  userTier: SubscriptionTier = 'free'
): string => {
  // Free for premium and unlimited tiers
  if (userTier === 'premium' || userTier === 'unlimited') {
    return "0";
  }
  
  // Otherwise charge based on action
  const fee = action === 'setup' 
    ? monetizationConfig.socialRecovery.setupFee 
    : monetizationConfig.socialRecovery.activationFee;
  
  return fee.toString();
};

// Calculate privacy feature fee
export const calculatePrivacyFeatureFee = (
  amount: string,
  userTier: SubscriptionTier = 'free'
): string => {
  // Check if user has remaining privacy transactions
  if (hasRemainingPrivacyTransactions(userTier)) {
    return "0";
  }
  
  const transactionAmount = parseFloat(amount);
  let feeRate: number;
  
  // Determine fee rate based on transaction size
  if (transactionAmount < 100) {
    feeRate = monetizationConfig.privacyFeatures.smallTransactionFee;
  } else if (transactionAmount < 1000) {
    feeRate = monetizationConfig.privacyFeatures.mediumTransactionFee;
  } else {
    feeRate = monetizationConfig.privacyFeatures.largeTransactionFee;
  }
  
  // Calculate fee
  const fee = transactionAmount * feeRate;
  
  // Ensure fee meets minimum
  return Math.max(fee, monetizationConfig.privacyFeatures.minimumFee).toString();
};

// Check if user has remaining AI credits
const hasRemainingAICredits = (userTier: SubscriptionTier): boolean => {
  // This would check the user's state in a real implementation
  // For now, we'll just return false to show the fee calculation
  return false;
};

// Check if user has remaining privacy transactions
const hasRemainingPrivacyTransactions = (userTier: SubscriptionTier): boolean => {
  // This would check the user's state in a real implementation
  // For now, we'll just return false to show the fee calculation
  return false;
};

// Calculate monthly subscription cost
export const getSubscriptionCost = (tier: SubscriptionTier): string => {
  return monetizationConfig.subscriptionTiers[tier].monthlyPrice.toString();
};

// Get available AI credits for a tier
export const getAICreditsForTier = (tier: SubscriptionTier): number => {
  return monetizationConfig.subscriptionTiers[tier].monthlyAICredits;
};

// Get privacy transactions for a tier
export const getPrivacyTransactionsForTier = (tier: SubscriptionTier): number => {
  return monetizationConfig.subscriptionTiers[tier].monthlyAICredits;
};

// Get subscription tier discount
export const getTierDiscount = (tier: SubscriptionTier): number => {
  return monetizationConfig.subscriptionTiers[tier].transactionFeeDiscount;
};

// Calculate transaction fee with subscription tier discount
export const calculateTransactionFeeWithTierDiscount = (
  amount: string,
  userTier: SubscriptionTier = 'free'
): string => {
  const amountBN = ethers.parseEther(amount);
  
  // Get base fee rate
  const feeRate = tokenomicsConfig.transactionFee;
  
  // Apply tier discount
  const tierDiscount = getTierDiscount(userTier);
  const discountedFeeRate = feeRate * (1 - tierDiscount);
  
  // Calculate fee
  const feeBN = amountBN * BigInt(Math.floor(discountedFeeRate * 10000)) / BigInt(10000);
  return ethers.formatEther(feeBN);
};