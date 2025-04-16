import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Shield, Bot, ArrowRight, Sparkles, Crown, RefreshCw } from "lucide-react";
import { useNetwork } from '@/hooks/useNetwork';
import { monetizationConfig, SubscriptionTier } from '@/lib/monetization';

interface SubscriptionTiersProps {
  currentTier?: SubscriptionTier;
  onSelectTier?: (tier: SubscriptionTier) => void;
}

export const SubscriptionTiers = ({ 
  currentTier = 'free',
  onSelectTier 
}: SubscriptionTiersProps) => {
  const { nativeCurrencySymbol } = useNetwork();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleSelectTier = (tier: SubscriptionTier) => {
    if (tier === currentTier) return;
    
    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      if (onSelectTier) {
        onSelectTier(tier);
      }
    }, 2000);
  };
  
  // Features for comparison
  const features = {
    aiStrategies: {
      label: 'AI Strategy Generation',
      icon: <Bot className="h-4 w-4" />,
      description: {
        free: `${monetizationConfig.subscriptionTiers.free.monthlyAICredits} free strategies per month`,
        basic: `${monetizationConfig.subscriptionTiers.basic.monthlyAICredits} strategies per month`,
        premium: `${monetizationConfig.subscriptionTiers.premium.monthlyAICredits} strategies per month`,
        unlimited: 'Unlimited strategies',
      }
    },
    privacyTransactions: {
      label: 'Private Transactions',
      icon: <Shield className="h-4 w-4" />,
      description: {
        free: `${monetizationConfig.subscriptionTiers.free.privacyTransactionsPerMonth} free transactions per month`,
        basic: `${monetizationConfig.subscriptionTiers.basic.privacyTransactionsPerMonth} transactions per month`,
        premium: `${monetizationConfig.subscriptionTiers.premium.privacyTransactionsPerMonth} transactions per month`,
        unlimited: 'Unlimited private transactions',
      }
    },
    socialRecovery: {
      label: 'Social Recovery',
      icon: <Sparkles className="h-4 w-4" />,
      description: {
        free: 'Available for a fee',
        basic: 'Available for a fee',
        premium: 'Included',
        unlimited: 'Included',
      }
    },
    transactionFees: {
      label: 'Transaction Fee Discount',
      icon: <Zap className="h-4 w-4" />,
      description: {
        free: 'Standard fees',
        basic: `${monetizationConfig.subscriptionTiers.basic.transactionFeeDiscount * 100}% discount`,
        premium: `${monetizationConfig.subscriptionTiers.premium.transactionFeeDiscount * 100}% discount`,
        unlimited: `${monetizationConfig.subscriptionTiers.unlimited.transactionFeeDiscount * 100}% discount`,
      }
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          Wallet Subscription Plans
        </CardTitle>
        <CardDescription>
          Choose the plan that best fits your needs with advanced features and discounted fees
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Free Tier */}
          <Card className={`border ${currentTier === 'free' ? 'border-primary/50' : 'border-border'}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Free</CardTitle>
                {currentTier === 'free' && (
                  <Badge variant="outline" className="text-xs font-normal px-2 py-0">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription>
                Basic wallet features
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-3xl font-bold mb-4">
                0 <span className="text-base font-normal text-muted-foreground">{nativeCurrencySymbol}</span>
              </div>
              
              <ul className="space-y-2 text-sm">
                {Object.values(features).map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2">
                    {feature.icon}
                    <div>
                      <span className="font-medium">{feature.label}:</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.description.free}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={currentTier === 'free' ? 'outline' : 'default'} 
                className="w-full"
                disabled={currentTier === 'free' || isProcessing}
                onClick={() => handleSelectTier('free')}
              >
                {currentTier === 'free' ? 'Current Plan' : 'Downgrade'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Basic Tier */}
          <Card className={`border ${currentTier === 'basic' ? 'border-primary/50' : 'border-border'}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Basic</CardTitle>
                {currentTier === 'basic' && (
                  <Badge variant="outline" className="text-xs font-normal px-2 py-0">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription>
                More features, lower fees
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-3xl font-bold mb-4">
                {monetizationConfig.subscriptionTiers.basic.monthlyPrice} <span className="text-base font-normal text-muted-foreground">{nativeCurrencySymbol}</span>
                <span className="text-sm font-normal text-muted-foreground ml-1">/mo</span>
              </div>
              
              <ul className="space-y-2 text-sm">
                {Object.values(features).map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2">
                    {feature.icon}
                    <div>
                      <span className="font-medium">{feature.label}:</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.description.basic}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={currentTier === 'basic' ? 'outline' : 'default'} 
                className="w-full"
                disabled={currentTier === 'basic' || isProcessing}
                onClick={() => handleSelectTier('basic')}
              >
                {isProcessing && currentTier !== 'basic' ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentTier === 'basic' ? (
                  'Current Plan'
                ) : currentTier === 'free' ? (
                  'Upgrade'
                ) : (
                  'Downgrade'
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Premium Tier */}
          <Card className={`border ${currentTier === 'premium' ? 'border-primary/50' : 'border-border'}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">Premium</CardTitle>
                {currentTier === 'premium' && (
                  <Badge variant="outline" className="text-xs font-normal px-2 py-0">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription>
                Advanced features included
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-3xl font-bold mb-4">
                {monetizationConfig.subscriptionTiers.premium.monthlyPrice} <span className="text-base font-normal text-muted-foreground">{nativeCurrencySymbol}</span>
                <span className="text-sm font-normal text-muted-foreground ml-1">/mo</span>
              </div>
              
              <ul className="space-y-2 text-sm">
                {Object.values(features).map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2">
                    {feature.icon}
                    <div>
                      <span className="font-medium">{feature.label}:</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.description.premium}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={currentTier === 'premium' ? 'outline' : 'default'} 
                className="w-full"
                disabled={currentTier === 'premium' || isProcessing}
                onClick={() => handleSelectTier('premium')}
              >
                {isProcessing && currentTier !== 'premium' ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentTier === 'premium' ? (
                  'Current Plan'
                ) : (
                  <>
                    {currentTier === 'unlimited' ? 'Downgrade' : 'Upgrade'}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Unlimited Tier */}
          <Card className={`border ${currentTier === 'unlimited' ? 'border-primary/50' : 'border-border bg-gradient-to-b from-background to-muted/30'}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg flex items-center gap-1">
                  Unlimited
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                </CardTitle>
                {currentTier === 'unlimited' && (
                  <Badge variant="outline" className="text-xs font-normal px-2 py-0">
                    Current Plan
                  </Badge>
                )}
              </div>
              <CardDescription>
                Everything included, no limits
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-3xl font-bold mb-4">
                {monetizationConfig.subscriptionTiers.unlimited.monthlyPrice} <span className="text-base font-normal text-muted-foreground">{nativeCurrencySymbol}</span>
                <span className="text-sm font-normal text-muted-foreground ml-1">/mo</span>
              </div>
              
              <ul className="space-y-2 text-sm">
                {Object.values(features).map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2">
                    {feature.icon}
                    <div>
                      <span className="font-medium">{feature.label}:</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{feature.description.unlimited}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={currentTier === 'unlimited' ? 'outline' : 'default'} 
                className={`w-full ${currentTier !== 'unlimited' ? 'bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90' : ''}`}
                disabled={currentTier === 'unlimited' || isProcessing}
                onClick={() => handleSelectTier('unlimited')}
              >
                {isProcessing && currentTier !== 'unlimited' ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : currentTier === 'unlimited' ? (
                  'Current Plan'
                ) : (
                  <>
                    Upgrade <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground flex flex-col items-start gap-2">
        <p>
          All plans include access to the core wallet functionality. Subscription payments contribute to 
          the "No Expectations" fund and Buy & Burn mechanism.
        </p>
        <p>
          Plans can be changed or cancelled at any time. Fees are charged in {nativeCurrencySymbol}.
        </p>
      </CardFooter>
    </Card>
  );
};