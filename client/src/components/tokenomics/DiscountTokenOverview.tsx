import React from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { calculateTokenDiscount } from '@/lib/tokenomics';

interface TokenHoldings {
  amount: string;
  percentOfSupply: number;
}

interface DiscountTokenOverviewProps {
  tokenHoldings: TokenHoldings;
}

export const DiscountTokenOverview: React.FC<DiscountTokenOverviewProps> = ({ tokenHoldings }) => {
  // Calculate the discount based on token holdings
  const discount = calculateTokenDiscount(tokenHoldings.amount);
  const formattedAmount = parseInt(tokenHoldings.amount).toLocaleString();
  const maxDiscount = 30; // Maximum possible discount percentage
  const discountProgress = (discount / maxDiscount) * 100;
  
  // Calculate the next tier amounts
  const nextDiscountTier = discount < maxDiscount ? discount + 5 : discount;
  const tokensForNextTier = discount < maxDiscount 
    ? Math.ceil((nextDiscountTier / 100 * 1000000)).toLocaleString()
    : null;
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Token Discount Benefits</CardTitle>
        <CardDescription>
          Hold tokens to reduce transaction fees
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Current Holdings</span>
            <span className="text-sm font-medium">{formattedAmount} Tokens</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">% of Total Supply</span>
            <span className="text-sm font-medium">{(tokenHoldings.percentOfSupply * 100).toFixed(3)}%</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Current Fee Discount</span>
            <motion.span 
              className="text-sm font-bold text-green-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {discount}%
            </motion.span>
          </div>
          <Progress value={discountProgress} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>{maxDiscount}%</span>
          </div>
        </div>
        
        {tokensForNextTier && (
          <motion.div 
            className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center">
              <div className="mr-2 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                <i className="ri-arrow-up-line text-blue-600 dark:text-blue-300"></i>
              </div>
              <div>
                <p className="text-sm font-medium">Next Discount Tier: {nextDiscountTier}%</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Hold {tokensForNextTier} tokens to reach this tier
                </p>
              </div>
            </div>
          </motion.div>
        )}
        
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[5, 15, 30].map((tierDiscount, index) => (
            <motion.div 
              key={`tier-${tierDiscount}`}
              className={`p-3 rounded-lg border ${
                discount >= tierDiscount 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              }`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <div className="text-center">
                <span className={`text-xl font-bold ${
                  discount >= tierDiscount 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}>
                  {tierDiscount}%
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {discount >= tierDiscount ? 'Unlocked' : 'Locked'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="text-xs text-gray-500 justify-center text-center">
        <p>Transaction fee discounts apply automatically based on token holdings</p>
      </CardFooter>
    </Card>
  );
};