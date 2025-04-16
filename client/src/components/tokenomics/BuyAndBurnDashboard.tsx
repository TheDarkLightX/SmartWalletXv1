import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, BarChart3, Flame, Trophy, TrendingUp, ArrowRight } from "lucide-react";
import { useNetwork } from '@/hooks/useNetwork';
import { tokenomicsConfig } from '@/lib/tokenomics';
import { pulseChainContractAddresses } from '@/lib/contracts';

// Types for burn statistics
interface BurnStatistic {
  timestamp: number;
  plsBurned: number;
  plsxBurned: number;
  plsValue: number;
  plsxValue: number;
  totalValue: number;
}

interface BuyAndBurnDashboardProps {
  walletAddress?: string;
}

export const BuyAndBurnDashboard = ({ walletAddress }: BuyAndBurnDashboardProps) => {
  const { currentNetwork, nativeCurrencySymbol } = useNetwork();
  const [activeTab, setActiveTab] = useState('statistics');
  
  // Mock burn statistics (in a real implementation, this would come from the blockchain)
  const [burnStats, setBurnStats] = useState<{
    daily: BurnStatistic[];
    weekly: BurnStatistic[];
    monthly: BurnStatistic[];
    allTime: {
      plsBurned: number;
      plsxBurned: number;
      totalValue: number;
    };
  }>({
    daily: [],
    weekly: [],
    monthly: [],
    allTime: {
      plsBurned: 14560,
      plsxBurned: 980000,
      totalValue: 243500
    }
  });
  
  // Format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(2) + 'K';
    } else {
      return num.toString();
    }
  };
  
  // In a real implementation, this would fetch actual burn statistics
  useEffect(() => {
    // Simulate API call to get burn statistics
    const generateMockData = () => {
      const daily = Array.from({ length: 24 }, (_, i) => ({
        timestamp: Date.now() - (23 - i) * 60 * 60 * 1000,
        plsBurned: Math.random() * 15 + 5,
        plsxBurned: Math.random() * 1200 + 300,
        plsValue: Math.random() * 100 + 30,
        plsxValue: Math.random() * 120 + 40,
        get totalValue() { return this.plsValue + this.plsxValue; }
      }));
      
      const weekly = Array.from({ length: 7 }, (_, i) => ({
        timestamp: Date.now() - (6 - i) * 24 * 60 * 60 * 1000,
        plsBurned: Math.random() * 120 + 50,
        plsxBurned: Math.random() * 9000 + 3000,
        plsValue: Math.random() * 700 + 250,
        plsxValue: Math.random() * 800 + 300,
        get totalValue() { return this.plsValue + this.plsxValue; }
      }));
      
      const monthly = Array.from({ length: 30 }, (_, i) => ({
        timestamp: Date.now() - (29 - i) * 24 * 60 * 60 * 1000,
        plsBurned: Math.random() * 500 + 200,
        plsxBurned: Math.random() * 35000 + 10000,
        plsValue: Math.random() * 3000 + 1000,
        plsxValue: Math.random() * 3200 + 1200,
        get totalValue() { return this.plsValue + this.plsxValue; }
      }));
      
      setBurnStats({
        daily,
        weekly,
        monthly,
        allTime: {
          plsBurned: 14560,
          plsxBurned: 980000,
          totalValue: 243500
        }
      });
    };
    
    generateMockData();
  }, []);
  
  // Calculate total burned for the most recent period
  const calculateRecentBurned = (period: 'daily' | 'weekly' | 'monthly') => {
    if (!burnStats[period].length) return { pls: 0, plsx: 0, value: 0 };
    
    const recentStats = burnStats[period];
    const totalPlsBurned = recentStats.reduce((sum, stat) => sum + stat.plsBurned, 0);
    const totalPlsxBurned = recentStats.reduce((sum, stat) => sum + stat.plsxBurned, 0);
    const totalValue = recentStats.reduce((sum, stat) => sum + stat.totalValue, 0);
    
    return {
      pls: totalPlsBurned,
      plsx: totalPlsxBurned,
      value: totalValue
    };
  };
  
  const todayBurned = calculateRecentBurned('daily');
  const weekBurned = calculateRecentBurned('weekly');
  const monthBurned = calculateRecentBurned('monthly');
  
  // Format buyback percentage for display
  const buybackPercentage = (tokenomicsConfig.buyAndBurnPercentage * 100).toFixed(0);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          PLS/PLSX Buy & Burn Dashboard
        </CardTitle>
        <CardDescription>
          {buybackPercentage}% of all transaction fees are used to buy and burn PLS and PLSX tokens,
          reducing supply and creating continuous buying pressure
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
            <TabsTrigger value="mechanism">How It Works</TabsTrigger>
          </TabsList>
          
          <TabsContent value="statistics" className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    All-Time Burned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">PLS:</span>
                      <span className="font-semibold">{formatNumber(burnStats.allTime.plsBurned)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">PLSX:</span>
                      <span className="font-semibold">{formatNumber(burnStats.allTime.plsxBurned)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t mt-1">
                      <span className="text-sm text-muted-foreground">Value:</span>
                      <span className="font-semibold">${formatNumber(burnStats.allTime.totalValue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    This Month
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">PLS:</span>
                      <span className="font-semibold">{formatNumber(monthBurned.pls)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">PLSX:</span>
                      <span className="font-semibold">{formatNumber(monthBurned.plsx)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t mt-1">
                      <span className="text-sm text-muted-foreground">Value:</span>
                      <span className="font-semibold">${formatNumber(monthBurned.value)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    Past 24 Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">PLS:</span>
                      <span className="font-semibold">{formatNumber(todayBurned.pls)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">PLSX:</span>
                      <span className="font-semibold">{formatNumber(todayBurned.plsx)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t mt-1">
                      <span className="text-sm text-muted-foreground">Value:</span>
                      <span className="font-semibold">${formatNumber(todayBurned.value)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Burn chart would go here - simplified for demo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Burn Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Burn chart visualization appears here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end">
              <Button variant="outline" size="sm">
                View All Burn Transactions <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="mechanism" className="space-y-6">
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="text-sm font-medium mb-2">How Buy & Burn Works</h3>
                <ol className="text-sm space-y-3 pl-6 list-decimal">
                  <li>
                    <strong>{buybackPercentage}% of all transaction fees</strong> collected by the wallet
                    are allocated to the Buy & Burn mechanism.
                  </li>
                  <li>
                    When enough fees accumulate, the smart contract automatically connects to 
                    <strong> PulseX</strong> to purchase PLS and PLSX tokens.
                  </li>
                  <li>
                    Purchased tokens are then sent to a <strong>burn address</strong> (0x000...dead) 
                    removing them permanently from circulation.
                  </li>
                  <li>
                    This creates <strong>deflationary pressure</strong> on both PLS and PLSX,
                    potentially benefiting all holders over time.
                  </li>
                </ol>
              </div>
              
              <div className="rounded-lg bg-muted p-4">
                <h3 className="text-sm font-medium mb-2">Buy & Burn Distribution</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PLS Burned:</span>
                    <span className="text-sm font-medium">50%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">PLSX Burned:</span>
                    <span className="text-sm font-medium">50%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    The distribution is balanced to support both the PulseChain's native token (PLS)
                    and the leading DEX token (PLSX), creating a positive feedback loop for the entire ecosystem.
                  </p>
                </div>
              </div>
              
              <div className="rounded-lg bg-muted p-4">
                <h3 className="text-sm font-medium mb-2">Benefits</h3>
                <ul className="text-sm space-y-2 pl-6 list-disc">
                  <li>Creates constant buying pressure for PLS and PLSX</li>
                  <li>Reduces token supply over time, potentially increasing scarcity</li>
                  <li>Directly ties wallet usage volume to ecosystem support</li>
                  <li>Transparent and algorithmic process with no human intervention</li>
                  <li>Aligns incentives between wallet users and PulseChain ecosystem participants</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        <p>
          Every transaction with our wallet directly contributes to strengthening the PulseChain ecosystem
          through the automatic Buy & Burn mechanism.
        </p>
      </CardFooter>
    </Card>
  );
};