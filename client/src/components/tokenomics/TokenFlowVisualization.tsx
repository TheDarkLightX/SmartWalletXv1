import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { tokenomicsConfig } from '@/lib/tokenomics';

export const TokenFlowVisualization = () => {
  // This component visualizes the token flow from transactions to the distribution mechanisms
  
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Token Flow Mechanism</CardTitle>
        <CardDescription>
          How transaction fees are distributed between the "No Expectations Fund" and the "Buy & Burn" mechanism
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="w-full h-[300px] relative flex items-center justify-center">
          {/* Transaction Fees Source */}
          <motion.div 
            className="absolute top-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-4 w-64 text-white shadow-lg"
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-bold text-lg">Transaction Fees</h3>
            <p className="text-sm opacity-90">0.2% of transaction volume</p>
          </motion.div>
          
          {/* Distribution Arrows */}
          <div className="w-full flex justify-center">
            {/* Left arrow - No Expectations Fund */}
            <div className="relative w-1/2 flex justify-end items-center mr-4">
              <motion.div 
                className="w-1 h-20 bg-indigo-400"
                initial={{ height: 0 }}
                animate={{ height: 80 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              />
              <motion.div 
                className="absolute top-[80px] left-[35px] w-20 h-1 bg-indigo-400"
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              />
              <motion.div 
                className="absolute top-[70px] left-[110px] border-l-8 border-l-transparent border-t-8 border-t-indigo-400 border-r-8 border-r-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.7 }}
              />
            </div>
            
            {/* Right arrow - Buy & Burn */}
            <div className="relative w-1/2 flex justify-start items-center ml-4">
              <motion.div 
                className="w-1 h-20 bg-purple-400"
                initial={{ height: 0 }}
                animate={{ height: 80 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              />
              <motion.div 
                className="absolute top-[80px] right-[35px] w-20 h-1 bg-purple-400"
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              />
              <motion.div 
                className="absolute top-[70px] right-[110px] border-l-8 border-l-transparent border-t-8 border-t-purple-400 border-r-8 border-r-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 1.7 }}
              />
            </div>
          </div>
          
          {/* Distribution Destinations */}
          <div className="absolute bottom-0 w-full flex justify-between">
            {/* No Expectations Fund */}
            <motion.div 
              className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-4 w-64 text-white shadow-lg ml-6"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <h3 className="font-bold text-lg">No Expectations Fund</h3>
              <p className="text-2xl font-bold">{tokenomicsConfig.noExpectationsFundPercentage}%</p>
              <p className="text-xs opacity-90 mt-1">For developers without expectations</p>
            </motion.div>
            
            {/* Buy & Burn */}
            <motion.div 
              className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4 w-64 text-white shadow-lg mr-6"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <h3 className="font-bold text-lg">Buy & Burn</h3>
              <p className="text-2xl font-bold">{tokenomicsConfig.buyAndBurnPercentage}%</p>
              <p className="text-xs opacity-90 mt-1">Automatic PLS/PulseX purchases and burns</p>
            </motion.div>
          </div>
          
          {/* Percentage Labels */}
          <motion.div 
            className="absolute text-indigo-700 font-bold left-[35%] top-[45%]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            {tokenomicsConfig.noExpectationsFundPercentage}%
          </motion.div>
          
          <motion.div 
            className="absolute text-purple-700 font-bold right-[35%] top-[45%]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            {tokenomicsConfig.buyAndBurnPercentage}%
          </motion.div>
          
          {/* Animated Tokens */}
          <TokenAnimation />
        </div>
      </CardContent>
    </Card>
  );
};

// Animation for tokens flowing through the system
const TokenAnimation = () => {
  // This is a separate component to manage the continuous animation of tokens

  // Animation settings for the tokens
  const tokenAnimationVariants = {
    initial: { 
      y: 0, 
      x: 0,
      opacity: 0,
      scale: 0 
    },
    center: { 
      y: 0, 
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 } 
    },
    left: { 
      y: 130, 
      x: -120,
      opacity: 0,
      scale: 0,
      transition: { duration: 0.7 } 
    },
    right: { 
      y: 130, 
      x: 120,
      opacity: 0,
      scale: 0,
      transition: { duration: 0.7 } 
    }
  };

  return (
    <>
      {/* Left distribution (25%) - One token */}
      <motion.div
        className="absolute w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs"
        initial="initial"
        animate={["center", "left"]}
        variants={tokenAnimationVariants}
        transition={{ duration: 1, delay: 2, repeat: Infinity, repeatDelay: 5 }}
      >
        $
      </motion.div>

      {/* Right distribution (75%) - Three tokens representing the larger share */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`token-right-${i}`}
          className="absolute w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs"
          initial="initial"
          animate={["center", "right"]}
          variants={tokenAnimationVariants}
          transition={{ 
            duration: 1, 
            delay: 2 + (i * 0.2), 
            repeat: Infinity, 
            repeatDelay: 5 - (i * 0.2)
          }}
        >
          $
        </motion.div>
      ))}
    </>
  );
};