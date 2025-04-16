import React from 'react';
import { motion } from 'framer-motion';
import { BuyAndBurnDashboard } from "@/components/tokenomics/BuyAndBurnDashboard";
import { TokenFlowVisualization } from "@/components/tokenomics/TokenFlowVisualization";
import { DiscountTokenOverview } from "@/components/tokenomics/DiscountTokenOverview";
import { Coins, LineChart, TrendingUp, PieChart, ArrowDownRight } from "lucide-react";

export default function TokenomicsVisualizer() {
  // Mock data for token holdings - in a real app, this would come from the user's wallet
  const mockTokenHoldings = {
    amount: "125000",
    percentOfSupply: 0.125 // 0.125% of supply
  };
  
  return (
    <div className="container py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Tokenomics Visualizer</h1>
          <p className="text-muted-foreground">
            Interactive visualization of wallet tokenomics and the Buy & Burn mechanism
          </p>
        </header>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-6"
      >
        {/* Token Flow Visualization */}
        <TokenFlowVisualization />
        
        {/* Token Economy Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="flex items-center gap-2 text-primary">
              <LineChart className="h-5 w-5" />
              <h3 className="font-semibold">Total Transactions</h3>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-bold">124,682</div>
              <div className="flex items-center text-green-500 text-sm">
                <ArrowDownRight className="h-4 w-4 -rotate-45" />
                <span>+2.4% from last week</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Number of transactions processed through the wallet
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="flex items-center gap-2 text-primary">
              <Coins className="h-5 w-5" />
              <h3 className="font-semibold">Total Value Locked</h3>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-bold">$2.45M</div>
              <div className="flex items-center text-green-500 text-sm">
                <ArrowDownRight className="h-4 w-4 -rotate-45" />
                <span>+5.7% from last week</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Total value of assets in all wallet contracts
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
          >
            <div className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-5 w-5" />
              <h3 className="font-semibold">Token Price Impact</h3>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-bold">+18.7%</div>
              <div className="flex items-center text-green-500 text-sm">
                <ArrowDownRight className="h-4 w-4 -rotate-45" />
                <span>+3.2% from last month</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Estimated price impact from Buy & Burn mechanism
            </p>
          </motion.div>
        </div>
        
        {/* Token Benefits and Burn Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <DiscountTokenOverview tokenHoldings={mockTokenHoldings} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <BuyAndBurnDashboard />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}