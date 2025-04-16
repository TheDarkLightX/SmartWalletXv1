import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, Zap, Scale, Info, RefreshCw, ArrowRight, Clock, Trophy } from "lucide-react";
import { useNetwork } from '@/hooks/useNetwork';
import { monetizationConfig, calculateAIStrategyFee, SubscriptionTier } from '@/lib/monetization';

interface AIStrategyGeneratorProps {
  walletAddress?: string;
  userTier: SubscriptionTier;
  aiCreditsRemaining: number;
  onGenerateStrategy?: (settings: AIStrategySettings) => void;
}

export interface AIStrategySettings {
  investmentAmount: string;
  riskTolerance: number;
  timeHorizon: number;
  strategyType: 'basic' | 'advanced' | 'premium';
  reinvestProfits: boolean;
  preferredAssets: string[];
}

export const AIStrategyGenerator = ({ 
  walletAddress, 
  userTier = 'free',
  aiCreditsRemaining = 0,
  onGenerateStrategy 
}: AIStrategyGeneratorProps) => {
  const { nativeCurrencySymbol } = useNetwork();
  const [selectedStrategyType, setSelectedStrategyType] = useState<'basic' | 'advanced' | 'premium'>('basic');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form state
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [riskTolerance, setRiskTolerance] = useState(50);
  const [timeHorizon, setTimeHorizon] = useState(30); // days
  const [reinvestProfits, setReinvestProfits] = useState(false);
  const [preferredAssets, setPreferredAssets] = useState<string[]>([]);
  
  // Calculate the fee for the selected strategy
  const strategyFee = calculateAIStrategyFee(selectedStrategyType, investmentAmount, userTier);
  const hasFreeCredits = aiCreditsRemaining > 0;
  
  const handleGenerateStrategy = () => {
    setIsGenerating(true);
    
    // In a real implementation, we would check the user's subscription and credits
    // Before processing the payment and generating the strategy
    
    // Collect the settings
    const settings: AIStrategySettings = {
      investmentAmount,
      riskTolerance,
      timeHorizon,
      strategyType: selectedStrategyType,
      reinvestProfits,
      preferredAssets,
    };
    
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      if (onGenerateStrategy) {
        onGenerateStrategy(settings);
      }
    }, 3000);
  };
  
  const getTimeHorizonLabel = (days: number) => {
    if (days < 7) return 'Short-term';
    if (days < 30) return 'Medium-term';
    if (days < 90) return 'Long-term';
    return 'Very long-term';
  };
  
  const getRiskToleranceLabel = (risk: number) => {
    if (risk < 25) return 'Conservative';
    if (risk < 50) return 'Moderate';
    if (risk < 75) return 'Aggressive';
    return 'Highly aggressive';
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Strategy Generator
        </CardTitle>
        <CardDescription>
          Generate personalized trading and investment strategies for PulseChain assets using AI
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-0">
        <Tabs defaultValue="generator" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="generator">Strategy Settings</TabsTrigger>
            <TabsTrigger value="pricing">AI Credits & Pricing</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generator" className="space-y-4">
            <div className="space-y-5">
              {/* Strategy Type Selection */}
              <div className="space-y-2">
                <Label>Strategy Type</Label>
                <div className="grid grid-cols-3 gap-3">
                  <Card 
                    className={`cursor-pointer border hover:border-primary/50 transition-colors ${selectedStrategyType === 'basic' ? 'border-primary/50 bg-muted/50' : ''}`}
                    onClick={() => setSelectedStrategyType('basic')}
                  >
                    <CardContent className="p-3">
                      <div className="text-center">
                        <Bot className="h-6 w-6 mx-auto mb-1" />
                        <h3 className="font-medium text-sm">Basic</h3>
                        <p className="text-xs text-muted-foreground">Simple strategies</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer border hover:border-primary/50 transition-colors ${selectedStrategyType === 'advanced' ? 'border-primary/50 bg-muted/50' : ''}`}
                    onClick={() => setSelectedStrategyType('advanced')}
                  >
                    <CardContent className="p-3">
                      <div className="text-center">
                        <Zap className="h-6 w-6 mx-auto mb-1" />
                        <h3 className="font-medium text-sm">Advanced</h3>
                        <p className="text-xs text-muted-foreground">Detailed strategies</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`cursor-pointer border hover:border-primary/50 transition-colors ${selectedStrategyType === 'premium' ? 'border-primary/50 bg-muted/50' : ''}`}
                    onClick={() => setSelectedStrategyType('premium')}
                  >
                    <CardContent className="p-3">
                      <div className="text-center">
                        <Sparkles className="h-6 w-6 mx-auto mb-1" />
                        <h3 className="font-medium text-sm">Premium</h3>
                        <p className="text-xs text-muted-foreground">Complex strategies</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Investment Amount */}
              <div className="space-y-2">
                <Label htmlFor="investment">Investment Amount ({nativeCurrencySymbol})</Label>
                <Input
                  id="investment"
                  type="number"
                  placeholder="Enter amount"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                />
              </div>
              
              {/* Risk Tolerance */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="risk">Risk Tolerance</Label>
                  <span className="text-xs font-medium">{getRiskToleranceLabel(riskTolerance)}</span>
                </div>
                <Slider
                  id="risk"
                  min={0}
                  max={100}
                  step={1}
                  value={[riskTolerance]}
                  onValueChange={(values) => setRiskTolerance(values[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Conservative</span>
                  <span>Aggressive</span>
                </div>
              </div>
              
              {/* Time Horizon */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="timeHorizon">Time Horizon</Label>
                  <span className="text-xs font-medium">{getTimeHorizonLabel(timeHorizon)} ({timeHorizon} days)</span>
                </div>
                <Slider
                  id="timeHorizon"
                  min={1}
                  max={180}
                  step={1}
                  value={[timeHorizon]}
                  onValueChange={(values) => setTimeHorizon(values[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Short-term</span>
                  <span>Long-term</span>
                </div>
              </div>
              
              {/* Reinvest Profits */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="reinvest"
                  checked={reinvestProfits}
                  onCheckedChange={setReinvestProfits}
                />
                <Label htmlFor="reinvest">Automatically reinvest profits</Label>
              </div>
            </div>
            
            {/* Generate Button */}
            <div className="pt-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Generation Fee:</span>
                  {hasFreeCredits ? (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                      Free Credit Available
                    </Badge>
                  ) : (
                    <span>{parseFloat(strategyFee) > 0 ? `${strategyFee} ${nativeCurrencySymbol}` : 'Free'}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {selectedStrategyType === 'basic' ? '~30 seconds' : 
                     selectedStrategyType === 'advanced' ? '~1 minute' : '~3 minutes'}
                  </span>
                </div>
              </div>
              
              <Button
                className="w-full"
                disabled={!investmentAmount || isGenerating}
                onClick={handleGenerateStrategy}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating Strategy...
                  </>
                ) : (
                  <>
                    Generate AI Strategy <Sparkles className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="pricing" className="space-y-4">
            <div className="rounded-lg p-4 bg-muted/50">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Your AI Credits
                </h3>
                <Badge variant="outline" className="text-xs">
                  {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Plan
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Credits Remaining:</span>
                  <span className="font-medium">{aiCreditsRemaining} / {monetizationConfig.subscriptionTiers[userTier].monthlyAICredits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Resets On:</span>
                  <span className="font-medium">May 16, 2025</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-border">
                <h4 className="text-sm font-medium mb-2">Strategy Generation Pricing</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Strategy:</span>
                    <span className="font-medium">{monetizationConfig.aiStrategyGeneration.basicFee * 100}% of amount</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advanced Strategy:</span>
                    <span className="font-medium">{monetizationConfig.aiStrategyGeneration.advancedFee * 100}% of amount</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Premium Strategy:</span>
                    <span className="font-medium">{monetizationConfig.aiStrategyGeneration.premiumFee * 100}% of amount</span>
                  </div>
                </div>
                
                <div className="flex items-start gap-2 mt-4 pt-3 border-t border-border">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    The complexity of your AI strategy determines the sophistication of the analysis 
                    and recommendations. Premium strategies include more advanced techniques, deeper 
                    market analysis, and optimization for your specific goals.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg p-4 bg-muted/50">
              <h3 className="text-sm font-medium mb-3">Want More AI Credits?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Upgrade your plan to get more monthly AI credits and lower per-use fees.
              </p>
              
              <Button variant="outline" className="w-full">
                View Subscription Plans <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="text-xs text-muted-foreground pt-4">
        AI Strategy generation uses your preferences to create personalized investment
        recommendations. All fees contribute to the "No Expectations" fund.
      </CardFooter>
    </Card>
  );
};