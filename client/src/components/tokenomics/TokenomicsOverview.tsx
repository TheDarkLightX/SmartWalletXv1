import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Wallet, Coins, Flame, LineChart } from "lucide-react";
import { tokenomicsConfig } from "@/lib/tokenomics";
import { useNetwork } from '@/hooks/useNetwork';

export const TokenomicsOverview = () => {
  const { currentNetwork, nativeCurrencySymbol } = useNetwork();
  const [tab, setTab] = useState('overview');
  
  // Format fee percentage for display
  const feePercentage = (tokenomicsConfig.transactionFee * 100).toFixed(2);
  const discountedFeePercentage = (tokenomicsConfig.transactionFee * tokenomicsConfig.discountWithToken * 100).toFixed(2);
  
  // Format distribution percentages
  const noExpectationsPercent = (tokenomicsConfig.noExpectationsFundPercentage * 100).toFixed(0);
  const buyBurnPercent = (tokenomicsConfig.buyAndBurnPercentage * 100).toFixed(0);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Wallet Tokenomics
        </CardTitle>
        <CardDescription>
          Our unique tokenomics model powers the wallet ecosystem and benefits all participants
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="buyburn">Buy & Burn</TabsTrigger>
            <TabsTrigger value="staking">Staking</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Transaction Fees</h3>
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span>Standard Fee</span>
                  <span className="font-medium">{feePercentage}%</span>
                </div>
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span>With Wallet Token</span>
                  <span className="font-medium text-green-500">{discountedFeePercentage}%</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Fee Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span>"No Expectations" Fund</span>
                      <span>{noExpectationsPercent}%</span>
                    </div>
                    <Progress value={parseInt(noExpectationsPercent)} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span>Buy & Burn ({nativeCurrencySymbol}/PLSX)</span>
                      <span>{buyBurnPercent}%</span>
                    </div>
                    <Progress value={parseInt(buyBurnPercent)} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="buyburn" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Automatic Buy & Burn</h3>
              <p className="text-sm text-muted-foreground">
                {buyBurnPercent}% of all transaction fees are used to buy and burn {nativeCurrencySymbol} and PLSX,
                creating constant buying pressure and reducing circulating supply.
              </p>
              
              <div className="rounded-lg bg-muted p-4 mt-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-2">
                    <Flame className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Recent Burns</h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Last 24 hours:</span>
                        <span className="font-medium">125 {nativeCurrencySymbol} / 10,000 PLSX</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Last 7 days:</span>
                        <span className="font-medium">870 {nativeCurrencySymbol} / 68,500 PLSX</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>All time:</span>
                        <span className="font-medium">12,450 {nativeCurrencySymbol} / 945,000 PLSX</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Button className="w-full mt-4">
              View Burn Transactions <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </TabsContent>
          
          <TabsContent value="staking" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Stake Wallet Tokens</h3>
              <p className="text-sm text-muted-foreground">
                Stake your Wallet tokens to earn a share of transaction fees and participate in governance.
              </p>
              
              <div className="rounded-lg bg-muted p-4 mt-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-primary/20 p-2">
                    <LineChart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="w-full">
                    <h4 className="font-medium">Staking Rewards</h4>
                    <div className="mt-2 space-y-3 w-full">
                      <div className="flex items-center justify-between text-sm w-full">
                        <span>Current APY:</span>
                        <span className="font-medium text-green-500">8.5%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Total Staked:</span>
                        <span className="font-medium">2,450,000 WALLET</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Your Stake:</span>
                        <span className="font-medium">0 WALLET</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Button className="w-full mt-4">
              Stake Wallet Tokens <Wallet className="ml-2 h-4 w-4" />
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col text-xs text-muted-foreground">
        <p>
          The Wallet token powers the entire ecosystem, providing governance rights and fee discounts.
        </p>
      </CardFooter>
    </Card>
  );
};