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
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { tokenomicsConfig } from '@/lib/tokenomics';

export const BuyAndBurnDashboard = () => {
  const [activeTab, setActiveTab] = useState("distribution");
  
  // Mock data for distribution pie chart
  const distributionData = [
    { name: 'No Expectations Fund', value: tokenomicsConfig.noExpectationsFundPercentage },
    { name: 'Buy & Burn', value: tokenomicsConfig.buyAndBurnPercentage },
  ];
  
  // Mock data for burn allocation
  const burnAllocationData = [
    { name: 'PLS', value: 60 },
    { name: 'PulseX', value: 40 },
  ];
  
  // Mock data for burn history
  const burnHistoryData = [
    { month: 'Jan', amount: 12500 },
    { month: 'Feb', amount: 14200 },
    { month: 'Mar', amount: 18900 },
    { month: 'Apr', amount: 23400 },
    { month: 'May', amount: 28100 },
    { month: 'Jun', amount: 34200 },
  ];
  
  // Colors for pie charts
  const DISTRIBUTION_COLORS = ['#6366f1', '#a855f7']; // indigo, purple
  const BURN_ALLOCATION_COLORS = ['#ec4899', '#f97316']; // pink, orange
  
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
            <div className="pt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-[240px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                <div className="text-indigo-700 dark:text-indigo-400 font-medium mb-1 text-sm">No Expectations Fund</div>
                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{tokenomicsConfig.noExpectationsFundPercentage}%</div>
                <div className="text-xs text-indigo-600/70 dark:text-indigo-400/70 mt-1">
                  Funds developers without requiring continued development
                </div>
              </div>
              
              <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                <div className="text-purple-700 dark:text-purple-400 font-medium mb-1 text-sm">Buy & Burn</div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{tokenomicsConfig.buyAndBurnPercentage}%</div>
                <div className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                  Automatic purchase and burning of tokens
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="allocation" className="space-y-4">
            <div className="pt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-[240px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={burnAllocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {burnAllocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={BURN_ALLOCATION_COLORS[index % BURN_ALLOCATION_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
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
            <div className="pt-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={burnHistoryData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                    <Bar dataKey="amount" name="Tokens Burned (USD Value)" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
              
              <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
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