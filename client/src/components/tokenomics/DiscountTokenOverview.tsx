import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Flame, TrendingUp, ArrowDownRight, Timer, Percent, Scales, Share2, CandlestickChart } from "lucide-react";
import { tokenomicsConfig } from '@/lib/tokenomics';
import { monetizationConfig } from '@/lib/monetization';

interface DiscountTokenOverviewProps {
  walletAddress?: string;
  tokenHoldings?: {
    amount: string;
    percentOfSupply: number;
  };
}

export const DiscountTokenOverview = ({ 
  walletAddress,
  tokenHoldings = { amount: "0", percentOfSupply: 0 }
}: DiscountTokenOverviewProps) => {
  // Calculate the token discount percentage based on token holdings
  const getDiscountPercentage = (percentOfSupply: number) => {
    // Example formula: max 30% discount if you own 0.5% of supply
    const maxDiscount = 30;
    const threshold = 0.5;
    
    const discount = Math.min(maxDiscount, (percentOfSupply / threshold) * maxDiscount);
    return Math.round(discount * 100) / 100;
  };
  
  const userDiscount = getDiscountPercentage(tokenHoldings.percentOfSupply);
  
  // Calculate the buyback percentage for each feature
  const transactionFeeBuyback = tokenomicsConfig.buyAndBurnPercentage * 100;
  const premiumFeatureBuyback = monetizationConfig.revenueSplit.buyAndBurn * 100;
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-primary" />
          Discount Token Economy
        </CardTitle>
        <CardDescription>
          Hold our wallet token to receive discounts on all fees and contribute to ecosystem growth
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="benefits" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="benefits">Holder Benefits</TabsTrigger>
            <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
            <TabsTrigger value="buyback">Buy & Burn</TabsTrigger>
          </TabsList>
          
          <TabsContent value="benefits" className="space-y-4">
            {/* User's token status */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <h3 className="text-sm font-medium">Your Token Holdings</h3>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Amount:</span>
                <span className="font-semibold">{tokenHoldings.amount} WALLET</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Supply Percentage:</span>
                <span className="font-semibold">{tokenHoldings.percentOfSupply.toFixed(4)}%</span>
              </div>
              
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm">Your Fee Discount:</span>
                  <Badge variant="outline" className="font-semibold">
                    {userDiscount}%
                  </Badge>
                </div>
                <Progress value={userDiscount} max={30} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Hold more tokens to increase your discount (max 30%)
                </p>
              </div>
            </div>
            
            {/* Token benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-green-500" />
                    Fee Discounts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Transaction Fees:</span>
                    <span className="font-medium">Up to 30% off</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>AI Strategy Fees:</span>
                    <span className="font-medium">Up to 30% off</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Privacy Features:</span>
                    <span className="font-medium">Up to 30% off</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Social Recovery:</span>
                    <span className="font-medium">Up to 30% off</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Discounts stack with subscription tier benefits
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Value Growth
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Buy & Burn:</span>
                    <span className="font-medium">Continuous</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Supply:</span>
                    <span className="font-medium">Deflationary</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Value Source:</span>
                    <span className="font-medium">Wallet Activity</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Governance:</span>
                    <span className="font-medium">None (No DAO)</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Value increases as wallet usage grows
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="tokenomics" className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <h3 className="text-sm font-medium">Token Distribution</h3>
              
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Public Sale:</span>
                    <span className="font-medium">70%</span>
                  </div>
                  <Progress value={70} max={100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">Development Team:</span>
                    <span className="font-medium">20%</span>
                  </div>
                  <Progress value={20} max={100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm">No Expectations Fund:</span>
                    <span className="font-medium">10%</span>
                  </div>
                  <Progress value={10} max={100} className="h-2" />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Flame className="h-4 w-4 text-red-500" />
                    Deflationary Mechanics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Initial Supply:</span>
                    <span className="font-medium">100,000,000 WALLET</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Burn Rate:</span>
                    <span className="font-medium">Continuous from fees</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Burn Frequency:</span>
                    <span className="font-medium">Daily automation</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Burn Address:</span>
                    <span className="font-medium text-xs">0x000...dead</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CandlestickChart className="h-4 w-4 text-amber-500" />
                    Fee Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Buy & Burn:</span>
                      <span className="font-medium">{transactionFeeBuyback}%</span>
                    </div>
                    <Progress value={transactionFeeBuyback} max={100} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>No Expectations Fund:</span>
                      <span className="font-medium">{100 - transactionFeeBuyback}%</span>
                    </div>
                    <Progress value={100 - transactionFeeBuyback} max={100} className="h-2" />
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-2">
                    All features have the same fee allocation structure
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="buyback" className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="text-sm font-medium mb-3">How Fees Strengthen Token Value</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Scales className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Fee Collection</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Wallet collects fees from all activity: transactions ({tokenomicsConfig.transactionFee * 100}% fee),
                      AI strategy generation, privacy features, and subscription payments.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Share2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Fee Distribution</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>{transactionFeeBuyback}%</strong> of all fees go to automatically buying WALLET tokens from
                      the market, creating constant buying pressure as usage increases.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Token Burning</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Purchased tokens are sent to a burn address (0x000...dead), permanently removing them
                      from circulation and decreasing total supply over time.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Timer className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Compounding Effect</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      As token supply decreases and wallet usage increases, each burn has a more
                      significant impact on token scarcity, potentially increasing value over time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Feature contribution overview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Feature Contributions</CardTitle>
                <CardDescription>
                  How each feature contributes to the Buy & Burn mechanism
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span>Transactions:</span>
                    <span className="font-medium">{transactionFeeBuyback}% of {tokenomicsConfig.transactionFee * 100}% fee</span>
                  </div>
                  <Progress value={transactionFeeBuyback} max={100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span>AI Strategy Generation:</span>
                    <span className="font-medium">{premiumFeatureBuyback}% of fees</span>
                  </div>
                  <Progress value={premiumFeatureBuyback} max={100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span>Privacy Features:</span>
                    <span className="font-medium">{premiumFeatureBuyback}% of fees</span>
                  </div>
                  <Progress value={premiumFeatureBuyback} max={100} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span>Subscription Payments:</span>
                    <span className="font-medium">{premiumFeatureBuyback}% of revenue</span>
                  </div>
                  <Progress value={premiumFeatureBuyback} max={100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        <p>
          The more the wallet and its features are used, the more tokens are burned, potentially
          creating a virtuous cycle for token holders. Hold more tokens to maximize your discounts.
        </p>
      </CardFooter>
    </Card>
  );
};