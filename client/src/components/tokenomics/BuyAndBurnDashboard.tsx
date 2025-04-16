import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { tokenomicsConfig } from '@/lib/tokenomics';

export const BuyAndBurnDashboard = () => {
  const [activeTab, setActiveTab] = useState("distribution");
  
  // Format a number as currency
  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Buy & Burn Dashboard</CardTitle>
        <CardDescription>
          Monitoring the automatic purchase and burning of tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="allocation">Burn Allocation</TabsTrigger>
            <TabsTrigger value="history">Burn History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="distribution" className="space-y-4">
            <div className="pt-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-8"
              >
                {/* Simple visual representation of distribution */}
                <div className="w-full max-w-md h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500" 
                    style={{ width: `${tokenomicsConfig.noExpectationsFundPercentage * 100}%` }}
                  ></div>
                </div>
                <div className="w-full flex justify-between text-sm text-gray-500">
                  <span>No Expectations Fund: {tokenomicsConfig.noExpectationsFundPercentage * 100}%</span>
                  <span>Buy & Burn: {tokenomicsConfig.buyAndBurnPercentage * 100}%</span>
                </div>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 mt-6">
              <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                <div className="text-indigo-700 dark:text-indigo-400 font-medium mb-1 text-sm">No Expectations Fund</div>
                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{tokenomicsConfig.noExpectationsFundPercentage * 100}%</div>
                <div className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">
                  Funds developers without requiring continued development
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                <div className="text-purple-700 dark:text-purple-400 font-medium mb-1 text-sm">Buy & Burn</div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{tokenomicsConfig.buyAndBurnPercentage * 100}%</div>
                <div className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                  Automatic purchase and burning of tokens
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="allocation" className="space-y-4">
            <div className="pt-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center justify-center space-y-8"
              >
                {/* Simple visual representation of burn allocation */}
                <div className="w-full max-w-md h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex">
                  <div className="h-full bg-pink-500" style={{ width: '60%' }}></div>
                  <div className="h-full bg-orange-500" style={{ width: '40%' }}></div>
                </div>
                <div className="w-full flex justify-between text-sm text-gray-500">
                  <span>PLS: 60%</span>
                  <span>PulseX: 40%</span>
                </div>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2 mt-6">
              <div className="p-4 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800">
                <div className="text-pink-700 dark:text-pink-400 font-medium mb-1 text-sm">PLS Token</div>
                <div className="text-2xl font-bold text-pink-700 dark:text-pink-400">60%</div>
                <div className="text-xs text-pink-600/70 dark:text-pink-400/70 mt-1">
                  Allocation of funds for buying and burning PLS
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800">
                <div className="text-orange-700 dark:text-orange-400 font-medium mb-1 text-sm">PulseX Token</div>
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">40%</div>
                <div className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
                  Allocation of funds for buying and burning PulseX
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="pt-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-6 gap-2">
                  {[12500, 14200, 18900, 23400, 28100, 34200].map((amount, index) => {
                    const maxAmount = 35000;
                    const height = Math.floor((amount / maxAmount) * 200);
                    const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][index];
                    
                    return (
                      <div key={month} className="flex flex-col items-center">
                        <div className="flex flex-col items-center justify-end h-[200px]">
                          <div 
                            className="w-12 bg-purple-500 rounded-t-md" 
                            style={{ height: `${height}px` }}
                          ></div>
                        </div>
                        <span className="text-xs mt-1">{month}</span>
                        <span className="text-xs text-gray-500">${(amount/1000).toFixed(1)}k</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
              
              <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-blue-700 dark:text-blue-400 font-medium text-sm">Total Burned (2024)</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">$131,300</div>
                  </div>
                  <div className="text-right">
                    <div className="text-blue-700 dark:text-blue-400 font-medium text-sm">Monthly Average</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">$21,883</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};