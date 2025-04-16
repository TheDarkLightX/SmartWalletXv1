import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Coins, 
  ArrowRight, 
  Wallet, 
  Flame, 
  ServerCrash, 
  User, 
  Users, 
  Shield, 
  Bot, 
  Lock, 
  Play, 
  Pause, 
  Repeat
} from "lucide-react";
import { useNetwork } from '@/hooks/useNetwork';
import { tokenomicsConfig } from '@/lib/tokenomics';
import { monetizationConfig } from '@/lib/monetization';

// Define the token flow paths and animation settings
const tokenFlowPaths = {
  transaction: {
    startPoints: {x: 50, y: 100},
    endPoints: [
      {id: 'buyBurn', x: 350, y: 50, percent: 75},
      {id: 'noExpectations', x: 350, y: 150, percent: 25}
    ]
  },
  aiStrategy: {
    startPoints: {x: 50, y: 200},
    endPoints: [
      {id: 'buyBurn', x: 350, y: 50, percent: 75},
      {id: 'noExpectations', x: 350, y: 150, percent: 25}
    ]
  },
  privacy: {
    startPoints: {x: 50, y: 300},
    endPoints: [
      {id: 'buyBurn', x: 350, y: 50, percent: 75},
      {id: 'noExpectations', x: 350, y: 150, percent: 25}
    ]
  },
  subscription: {
    startPoints: {x: 50, y: 400},
    endPoints: [
      {id: 'buyBurn', x: 350, y: 50, percent: 75},
      {id: 'noExpectations', x: 350, y: 150, percent: 25}
    ]
  },
  // The Buy & Burn mechanism connecting to token burning
  buyBurn: {
    startPoints: {x: 350, y: 50},
    endPoints: [
      {id: 'tokenBurn', x: 650, y: 100, percent: 100}
    ]
  },
  // The No Expectations Fund
  noExpectations: {
    startPoints: {x: 350, y: 150},
    endPoints: [
      {id: 'developers', x: 650, y: 300, percent: 100}
    ]
  }
};

// Token animation settings
const tokenAnimationSettings = {
  duration: 3, // seconds for one token to travel
  interval: 0.8, // seconds between token emissions
  tokenCount: 5, // number of tokens visible per path at once
};

// Animation variants for tokens
const tokenVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0 }
};

// Animation variants for paths
const pathVariants = {
  hidden: { pathLength: 0 },
  visible: { 
    pathLength: 1,
    transition: { duration: 1.5, ease: "easeInOut" }
  }
};

// Token component that travels along the path
const AnimatedToken = ({ 
  path, 
  delay, 
  color = "#3b82f6", 
  size = 8,
  speed = tokenAnimationSettings.duration,
  onComplete
}: { 
  path: { startX: number; startY: number; endX: number; endY: number; }; 
  delay: number;
  color?: string;
  size?: number;
  speed?: number;
  onComplete?: () => void;
}) => {
  return (
    <motion.circle
      cx={path.startX}
      cy={path.startY}
      r={size}
      fill={color}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
      animate={{
        x: [0, path.endX - path.startX],
        y: [0, path.endY - path.startY],
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1, 0],
      }}
      transition={{
        duration: speed,
        delay: delay,
        ease: "linear",
        times: [0, 0.1, 0.9, 1],
        onComplete
      }}
    />
  );
};

// Path component that shows the token flow
const FlowPath = ({ 
  startX, 
  startY, 
  endX, 
  endY, 
  color = "#3b82f6",
  strokeWidth = 2,
  dashed = false,
  animate = true
}: { 
  startX: number; 
  startY: number; 
  endX: number; 
  endY: number; 
  color?: string;
  strokeWidth?: number;
  dashed?: boolean;
  animate?: boolean;
}) => {
  // Create a curved path
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2 - 30; // Curve upward
  
  const path = `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  
  return (
    <motion.path
      d={path}
      stroke={color}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeDasharray={dashed ? "5,5" : "0"}
      variants={animate ? pathVariants : undefined}
      initial={animate ? "hidden" : undefined}
      animate={animate ? "visible" : undefined}
    />
  );
};

// Function to generate tokens for animation
const generateTokens = (
  startX: number, 
  startY: number, 
  endX: number, 
  endY: number, 
  count: number,
  interval: number,
  speed: number,
  color: string,
  onComplete?: () => void
) => {
  return Array.from({ length: count }).map((_, index) => (
    <AnimatedToken
      key={`token-${startX}-${startY}-${index}`}
      path={{ startX, startY, endX, endY }}
      delay={index * interval}
      color={color}
      speed={speed}
      onComplete={index === count - 1 ? onComplete : undefined}
    />
  ));
};

// The main token flow visualization component
export const TokenFlowVisualization = () => {
  const { nativeCurrencySymbol } = useNetwork();
  const [isAnimating, setIsAnimating] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('flow');
  const [animationSpeed, setAnimationSpeed] = useState<number>(1);
  const [showTransactions, setShowTransactions] = useState<boolean>(true);
  const [showAIFeatures, setShowAIFeatures] = useState<boolean>(true);
  const [showPrivacyFeatures, setShowPrivacyFeatures] = useState<boolean>(true);
  const [showSubscriptions, setShowSubscriptions] = useState<boolean>(true);
  
  // Animation cycle
  const [cycleCount, setCycleCount] = useState<number>(0);
  
  // Token colors
  const tokenColors = {
    transaction: "#3b82f6", // blue
    ai: "#10b981", // green
    privacy: "#8b5cf6", // purple
    subscription: "#f59e0b", // amber
    buyBurn: "#ef4444", // red
    noExpectations: "#6366f1", // indigo
  };
  
  // Calculate the transaction fee and distribution percentages
  const transactionFeePercent = tokenomicsConfig.transactionFee * 100;
  const buyBurnPercent = tokenomicsConfig.buyAndBurnPercentage * 100;
  const noExpectationsPercent = tokenomicsConfig.noExpectationsFundPercentage * 100;
  
  // Handle play/pause
  const toggleAnimation = () => {
    setIsAnimating(!isAnimating);
  };
  
  // Handle animation speed change
  const changeSpeed = () => {
    setAnimationSpeed((prev) => (prev === 0.5 ? 1 : prev === 1 ? 2 : 0.5));
  };
  
  // Reset animation
  const resetAnimation = () => {
    setCycleCount(c => c + 1);
  };
  
  // Toggle feature visibility
  const toggleFeature = (feature: string) => {
    switch (feature) {
      case 'transactions':
        setShowTransactions(!showTransactions);
        break;
      case 'ai':
        setShowAIFeatures(!showAIFeatures);
        break;
      case 'privacy':
        setShowPrivacyFeatures(!showPrivacyFeatures);
        break;
      case 'subscriptions':
        setShowSubscriptions(!showSubscriptions);
        break;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Tokenomics Flow Visualization
        </CardTitle>
        <CardDescription>
          Interactive visualization of token flow in the wallet ecosystem
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="flow">Token Flow</TabsTrigger>
            <TabsTrigger value="stats">Impact Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="flow" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={toggleAnimation}
                >
                  {isAnimating ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                  {isAnimating ? 'Pause' : 'Play'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={changeSpeed}
                >
                  {animationSpeed}x Speed
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={resetAnimation}
                >
                  <Repeat className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant={showTransactions ? "default" : "outline"} 
                  size="sm"
                  onClick={() => toggleFeature('transactions')}
                  className="px-2"
                >
                  <Wallet className="h-4 w-4 mr-1" />
                  Transactions
                </Button>
                <Button 
                  variant={showAIFeatures ? "default" : "outline"} 
                  size="sm"
                  onClick={() => toggleFeature('ai')}
                  className="px-2"
                >
                  <Bot className="h-4 w-4 mr-1" />
                  AI
                </Button>
                <Button 
                  variant={showPrivacyFeatures ? "default" : "outline"} 
                  size="sm"
                  onClick={() => toggleFeature('privacy')}
                  className="px-2"
                >
                  <Lock className="h-4 w-4 mr-1" />
                  Privacy
                </Button>
                <Button 
                  variant={showSubscriptions ? "default" : "outline"} 
                  size="sm"
                  onClick={() => toggleFeature('subscriptions')}
                  className="px-2"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Subscriptions
                </Button>
              </div>
            </div>
            
            {/* SVG Token Flow Visualization */}
            <div className="relative w-full h-[500px] border rounded-lg bg-muted/30 overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">
                {/* Nodes/Components */}
                {/* User Wallet */}
                <g>
                  <motion.circle 
                    cx="50" 
                    cy="250" 
                    r="30" 
                    fill="#f8fafc" 
                    stroke="#3b82f6" 
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Wallet x="38" y="238" className="h-6 w-6 text-primary" />
                    <text x="50" y="280" textAnchor="middle" className="text-xs font-medium">Wallet</text>
                  </motion.g>
                </g>
                
                {/* Revenue Streams */}
                {/* Transactions */}
                <g>
                  <motion.circle 
                    cx="150" 
                    cy="150" 
                    r="25" 
                    fill={showTransactions ? "#3b82f680" : "#94a3b880"}
                    stroke={showTransactions ? tokenColors.transaction : "#94a3b8"}
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                  />
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <ArrowRight x="138" y="138" className={`h-5 w-5 ${showTransactions ? "text-blue-500" : "text-gray-400"}`} />
                    <text x="150" y="180" textAnchor="middle" className="text-[10px] font-medium">Transactions</text>
                    <text x="150" y="192" textAnchor="middle" className="text-[9px] text-muted-foreground">{transactionFeePercent.toFixed(1)}% fee</text>
                  </motion.g>
                </g>
                
                {/* AI Features */}
                <g>
                  <motion.circle 
                    cx="150" 
                    cy="220" 
                    r="25" 
                    fill={showAIFeatures ? "#10b98180" : "#94a3b880"}
                    stroke={showAIFeatures ? tokenColors.ai : "#94a3b8"}
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Bot x="138" y="208" className={`h-5 w-5 ${showAIFeatures ? "text-green-500" : "text-gray-400"}`} />
                    <text x="150" y="250" textAnchor="middle" className="text-[10px] font-medium">AI Strategies</text>
                    <text x="150" y="262" textAnchor="middle" className="text-[9px] text-muted-foreground">Premium Feature</text>
                  </motion.g>
                </g>
                
                {/* Privacy Features */}
                <g>
                  <motion.circle 
                    cx="150" 
                    cy="290" 
                    r="25" 
                    fill={showPrivacyFeatures ? "#8b5cf680" : "#94a3b880"}
                    stroke={showPrivacyFeatures ? tokenColors.privacy : "#94a3b8"}
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  />
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Lock x="138" y="278" className={`h-5 w-5 ${showPrivacyFeatures ? "text-purple-500" : "text-gray-400"}`} />
                    <text x="150" y="320" textAnchor="middle" className="text-[10px] font-medium">Privacy Tools</text>
                    <text x="150" y="332" textAnchor="middle" className="text-[9px] text-muted-foreground">Premium Feature</text>
                  </motion.g>
                </g>
                
                {/* Subscription */}
                <g>
                  <motion.circle 
                    cx="150" 
                    cy="360" 
                    r="25" 
                    fill={showSubscriptions ? "#f59e0b80" : "#94a3b880"}
                    stroke={showSubscriptions ? tokenColors.subscription : "#94a3b8"}
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  />
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <Shield x="138" y="348" className={`h-5 w-5 ${showSubscriptions ? "text-amber-500" : "text-gray-400"}`} />
                    <text x="150" y="390" textAnchor="middle" className="text-[10px] font-medium">Subscriptions</text>
                    <text x="150" y="402" textAnchor="middle" className="text-[9px] text-muted-foreground">Tiered Plans</text>
                  </motion.g>
                </g>
                
                {/* Fund Distribution - Buy & Burn */}
                <g>
                  <motion.circle 
                    cx="450" 
                    cy="150" 
                    r="35" 
                    fill="#ef444480"
                    stroke={tokenColors.buyBurn}
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  />
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Flame x="436" y="138" className="h-7 w-7 text-red-500" />
                    <text x="450" y="190" textAnchor="middle" className="text-[11px] font-medium">Buy & Burn</text>
                    <text x="450" y="205" textAnchor="middle" className="text-[10px] text-muted-foreground">{buyBurnPercent.toFixed(0)}% of all fees</text>
                  </motion.g>
                </g>
                
                {/* Fund Distribution - No Expectations Fund */}
                <g>
                  <motion.circle 
                    cx="450" 
                    cy="350" 
                    r="35" 
                    fill="#6366f180"
                    stroke={tokenColors.noExpectations}
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                  />
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    <Users x="436" y="338" className="h-7 w-7 text-indigo-500" />
                    <text x="450" y="390" textAnchor="middle" className="text-[11px] font-medium">"No Expectations"</text>
                    <text x="450" y="405" textAnchor="middle" className="text-[10px] text-muted-foreground">{noExpectationsPercent.toFixed(0)}% of all fees</text>
                  </motion.g>
                </g>
                
                {/* End Nodes - Token Burn */}
                <g>
                  <motion.circle 
                    cx="650" 
                    cy="150" 
                    r="30" 
                    fill="#b9121280"
                    stroke="#b91212"
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.7 }}
                  />
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 }}
                  >
                    <ServerCrash x="636" y="138" className="h-6 w-6 text-red-700" />
                    <text x="650" y="180" textAnchor="middle" className="text-[10px] font-medium">Token Burn</text>
                    <text x="650" y="195" textAnchor="middle" className="text-[9px] text-muted-foreground">Reduce Supply</text>
                  </motion.g>
                </g>
                
                {/* End Nodes - Developers */}
                <g>
                  <motion.circle 
                    cx="650" 
                    cy="350" 
                    r="30" 
                    fill="#4f46e580"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.8 }}
                  />
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                  >
                    <User x="636" y="338" className="h-6 w-6 text-indigo-700" />
                    <text x="650" y="380" textAnchor="middle" className="text-[10px] font-medium">Developers</text>
                    <text x="650" y="395" textAnchor="middle" className="text-[9px] text-muted-foreground">No Expectations</text>
                  </motion.g>
                </g>
                
                {/* Connection Lines */}
                {/* Wallet to Features */}
                <FlowPath startX={70} startY={230} endX={130} endY={150} 
                  color={showTransactions ? tokenColors.transaction : "#94a3b8"} 
                  strokeWidth={showTransactions ? 2 : 1}
                  dashed={!showTransactions}
                />
                
                <FlowPath startX={70} startY={240} endX={130} endY={220} 
                  color={showAIFeatures ? tokenColors.ai : "#94a3b8"} 
                  strokeWidth={showAIFeatures ? 2 : 1}
                  dashed={!showAIFeatures}
                />
                
                <FlowPath startX={70} startY={250} endX={130} endY={290} 
                  color={showPrivacyFeatures ? tokenColors.privacy : "#94a3b8"} 
                  strokeWidth={showPrivacyFeatures ? 2 : 1}
                  dashed={!showPrivacyFeatures}
                />
                
                <FlowPath startX={70} startY={260} endX={130} endY={360} 
                  color={showSubscriptions ? tokenColors.subscription : "#94a3b8"} 
                  strokeWidth={showSubscriptions ? 2 : 1}
                  dashed={!showSubscriptions}
                />
                
                {/* Features to Fund Distribution */}
                {/* Transactions */}
                <FlowPath startX={170} startY={140} endX={420} endY={150} 
                  color={showTransactions ? tokenColors.transaction : "#94a3b8"} 
                  strokeWidth={showTransactions ? 2 : 1}
                  dashed={!showTransactions}
                />
                <FlowPath startX={170} startY={160} endX={420} endY={350} 
                  color={showTransactions ? tokenColors.transaction : "#94a3b8"} 
                  strokeWidth={showTransactions ? 2 : 1}
                  dashed={!showTransactions}
                />
                
                {/* AI Features */}
                <FlowPath startX={170} startY={210} endX={420} endY={150} 
                  color={showAIFeatures ? tokenColors.ai : "#94a3b8"} 
                  strokeWidth={showAIFeatures ? 2 : 1}
                  dashed={!showAIFeatures}
                />
                <FlowPath startX={170} startY={230} endX={420} endY={350} 
                  color={showAIFeatures ? tokenColors.ai : "#94a3b8"} 
                  strokeWidth={showAIFeatures ? 2 : 1}
                  dashed={!showAIFeatures}
                />
                
                {/* Privacy Features */}
                <FlowPath startX={170} startY={280} endX={420} endY={150} 
                  color={showPrivacyFeatures ? tokenColors.privacy : "#94a3b8"} 
                  strokeWidth={showPrivacyFeatures ? 2 : 1}
                  dashed={!showPrivacyFeatures}
                />
                <FlowPath startX={170} startY={300} endX={420} endY={350}
                  color={showPrivacyFeatures ? tokenColors.privacy : "#94a3b8"} 
                  strokeWidth={showPrivacyFeatures ? 2 : 1}
                  dashed={!showPrivacyFeatures}
                />
                
                {/* Subscriptions */}
                <FlowPath startX={170} startY={350} endX={420} endY={150}
                  color={showSubscriptions ? tokenColors.subscription : "#94a3b8"} 
                  strokeWidth={showSubscriptions ? 2 : 1}
                  dashed={!showSubscriptions}
                />
                <FlowPath startX={170} startY={370} endX={420} endY={350}
                  color={showSubscriptions ? tokenColors.subscription : "#94a3b8"} 
                  strokeWidth={showSubscriptions ? 2 : 1}
                  dashed={!showSubscriptions}
                />
                
                {/* Fund Distribution to End Nodes */}
                <FlowPath startX={480} startY={140} endX={625} endY={150} color={tokenColors.buyBurn} />
                <FlowPath startX={480} startY={360} endX={625} endY={350} color={tokenColors.noExpectations} />
                
                {/* Animated Tokens - Transactions */}
                {isAnimating && showTransactions && (
                  <g key={`transaction-tokens-${cycleCount}`}>
                    <AnimatePresence>
                      {/* To Buy & Burn (75%) */}
                      {generateTokens(
                        170, 140, 420, 150, 
                        tokenAnimationSettings.tokenCount,
                        tokenAnimationSettings.interval / animationSpeed, 
                        tokenAnimationSettings.duration / animationSpeed,
                        tokenColors.transaction
                      )}
                      {/* To No Expectations (25%) */}
                      {generateTokens(
                        170, 160, 420, 350, 
                        Math.ceil(tokenAnimationSettings.tokenCount / 3),
                        tokenAnimationSettings.interval * 3 / animationSpeed, 
                        tokenAnimationSettings.duration / animationSpeed,
                        tokenColors.transaction
                      )}
                    </AnimatePresence>
                  </g>
                )}
                
                {/* Animated Tokens - AI Features */}
                {isAnimating && showAIFeatures && (
                  <g key={`ai-tokens-${cycleCount}`}>
                    <AnimatePresence>
                      {/* To Buy & Burn (75%) */}
                      {generateTokens(
                        170, 210, 420, 150, 
                        tokenAnimationSettings.tokenCount,
                        tokenAnimationSettings.interval / animationSpeed, 
                        tokenAnimationSettings.duration / animationSpeed,
                        tokenColors.ai
                      )}
                      {/* To No Expectations (25%) */}
                      {generateTokens(
                        170, 230, 420, 350, 
                        Math.ceil(tokenAnimationSettings.tokenCount / 3),
                        tokenAnimationSettings.interval * 3 / animationSpeed, 
                        tokenAnimationSettings.duration / animationSpeed,
                        tokenColors.ai
                      )}
                    </AnimatePresence>
                  </g>
                )}
                
                {/* Animated Tokens - Privacy Features */}
                {isAnimating && showPrivacyFeatures && (
                  <g key={`privacy-tokens-${cycleCount}`}>
                    <AnimatePresence>
                      {/* To Buy & Burn (75%) */}
                      {generateTokens(
                        170, 280, 420, 150, 
                        tokenAnimationSettings.tokenCount,
                        tokenAnimationSettings.interval / animationSpeed, 
                        tokenAnimationSettings.duration / animationSpeed,
                        tokenColors.privacy
                      )}
                      {/* To No Expectations (25%) */}
                      {generateTokens(
                        170, 300, 420, 350, 
                        Math.ceil(tokenAnimationSettings.tokenCount / 3),
                        tokenAnimationSettings.interval * 3 / animationSpeed, 
                        tokenAnimationSettings.duration / animationSpeed,
                        tokenColors.privacy
                      )}
                    </AnimatePresence>
                  </g>
                )}
                
                {/* Animated Tokens - Subscriptions */}
                {isAnimating && showSubscriptions && (
                  <g key={`subscription-tokens-${cycleCount}`}>
                    <AnimatePresence>
                      {/* To Buy & Burn (75%) */}
                      {generateTokens(
                        170, 350, 420, 150, 
                        tokenAnimationSettings.tokenCount,
                        tokenAnimationSettings.interval / animationSpeed, 
                        tokenAnimationSettings.duration / animationSpeed,
                        tokenColors.subscription
                      )}
                      {/* To No Expectations (25%) */}
                      {generateTokens(
                        170, 370, 420, 350, 
                        Math.ceil(tokenAnimationSettings.tokenCount / 3),
                        tokenAnimationSettings.interval * 3 / animationSpeed, 
                        tokenAnimationSettings.duration / animationSpeed,
                        tokenColors.subscription
                      )}
                    </AnimatePresence>
                  </g>
                )}
                
                {/* Animated Tokens - Buy & Burn to Token Burn */}
                {isAnimating && (showTransactions || showAIFeatures || showPrivacyFeatures || showSubscriptions) && (
                  <g key={`burn-tokens-${cycleCount}`}>
                    <AnimatePresence>
                      {generateTokens(
                        480, 140, 625, 150, 
                        tokenAnimationSettings.tokenCount,
                        tokenAnimationSettings.interval / animationSpeed, 
                        tokenAnimationSettings.duration / animationSpeed,
                        tokenColors.buyBurn
                      )}
                    </AnimatePresence>
                  </g>
                )}
                
                {/* Animated Tokens - No Expectations to Developers */}
                {isAnimating && (showTransactions || showAIFeatures || showPrivacyFeatures || showSubscriptions) && (
                  <g key={`developer-tokens-${cycleCount}`}>
                    <AnimatePresence>
                      {generateTokens(
                        480, 360, 625, 350, 
                        tokenAnimationSettings.tokenCount,
                        tokenAnimationSettings.interval / animationSpeed, 
                        tokenAnimationSettings.duration / animationSpeed,
                        tokenColors.noExpectations
                      )}
                    </AnimatePresence>
                  </g>
                )}
              </svg>
              
              {/* Legend */}
              <div className="absolute bottom-2 left-2 p-2 rounded-md bg-background/90 border border-border shadow-md text-xs">
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{backgroundColor: tokenColors.transaction}} />
                    <span>Transactions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{backgroundColor: tokenColors.ai}} />
                    <span>AI Strategies</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{backgroundColor: tokenColors.privacy}} />
                    <span>Privacy Tools</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{backgroundColor: tokenColors.subscription}} />
                    <span>Subscriptions</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{backgroundColor: tokenColors.buyBurn}} />
                    <span>Buy & Burn</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full" style={{backgroundColor: tokenColors.noExpectations}} />
                    <span>No Expectations</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Fee Distribution Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 mt-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Transaction Fee</span>
                        <span className="font-mono">{transactionFeePercent.toFixed(2)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Buy & Burn</span>
                        <span className="font-mono">{buyBurnPercent.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 rounded-full" 
                          style={{ width: `${buyBurnPercent}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>No Expectations Fund</span>
                        <span className="font-mono">{noExpectationsPercent.toFixed(0)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${noExpectationsPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Token Holder Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Maximum Fee Discount</span>
                      <span className="font-mono font-medium">30%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">AI Strategy Fee Discount</span>
                      <span className="font-mono font-medium">Up to 30%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Privacy Feature Discount</span>
                      <span className="font-mono font-medium">Up to 30%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Social Recovery Discount</span>
                      <span className="font-mono font-medium">Up to 30%</span>
                    </div>
                    
                    <div className="flex justify-between items-center border-t pt-2">
                      <span className="text-sm font-medium">Discount Power</span>
                      <span className="text-xs text-muted-foreground">0.5% supply = 30% discount</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Buy & Burn Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div className="rounded-lg border p-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Last 24 Hours</span>
                        <Flame className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">{nativeCurrencySymbol} Burned</span>
                        <span className="font-mono font-medium">125.45</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">PLSX Burned</span>
                        <span className="font-mono font-medium">10,250</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t mt-1">
                        <span className="text-sm">Wallet Transactions</span>
                        <span className="font-mono font-medium">427</span>
                      </div>
                    </div>
                    
                    <div className="rounded-lg border p-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Last 7 Days</span>
                        <Flame className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">{nativeCurrencySymbol} Burned</span>
                        <span className="font-mono font-medium">870.12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">PLSX Burned</span>
                        <span className="font-mono font-medium">68,500</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t mt-1">
                        <span className="text-sm">Wallet Transactions</span>
                        <span className="font-mono font-medium">2,984</span>
                      </div>
                    </div>
                    
                    <div className="rounded-lg border p-3 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">All Time</span>
                        <Flame className="h-4 w-4 text-red-500" />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">{nativeCurrencySymbol} Burned</span>
                        <span className="font-mono font-medium">12,450</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">PLSX Burned</span>
                        <span className="font-mono font-medium">945,000</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t mt-1">
                        <span className="text-sm">Wallet Transactions</span>
                        <span className="font-mono font-medium">124,682</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground">
        <p>
          The tokenomics visualization shows how fees from all wallet activities contribute to 
          the Buy & Burn mechanism and No Expectations fund, creating a sustainable ecosystem.
        </p>
      </CardFooter>
    </Card>
  );
};