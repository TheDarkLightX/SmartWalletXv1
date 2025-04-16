import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, EyeOff, RefreshCw, Hourglass, Clock, Lock, Info } from "lucide-react";
import { useNetwork } from '@/hooks/useNetwork';
import { SubscriptionTier, calculatePrivacyFeatureFee, monetizationConfig } from '@/lib/monetization';
import { formatAddress } from '@/lib/ethers';

interface PrivacyTransactionProps {
  walletAddress?: string;
  walletBalance?: string;
  userTier: SubscriptionTier;
  privacyTransactionsRemaining: number;
  onExecutePrivacyTransaction?: (settings: PrivacyTransactionSettings) => void;
}

export interface PrivacyTransactionSettings {
  amount: string;
  token: string;
  timeDelay: number;
  mixingLevel: 'standard' | 'high' | 'maximum';
}

export const PrivacyTransaction = ({ 
  walletAddress, 
  walletBalance = "0",
  userTier = 'free',
  privacyTransactionsRemaining = 0,
  onExecutePrivacyTransaction 
}: PrivacyTransactionProps) => {
  const { currentNetwork, nativeCurrencySymbol } = useNetwork();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState(nativeCurrencySymbol);
  const [timeDelay, setTimeDelay] = useState("0");
  const [mixingLevel, setMixingLevel] = useState<'standard' | 'high' | 'maximum'>('standard');
  
  // Calculate the fee for the privacy transaction
  const [privacyFee, setPrivacyFee] = useState("0");
  const hasFreeTransactions = privacyTransactionsRemaining > 0;
  
  // Update fee when amount changes
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const fee = calculatePrivacyFeatureFee(amount, userTier);
      setPrivacyFee(fee);
    } else {
      setPrivacyFee("0");
    }
  }, [amount, userTier]);
  
  // Form validation
  const isFormValid = () => {
    return (
      amount.trim() !== "" &&
      !isNaN(parseFloat(amount)) &&
      parseFloat(amount) > 0 &&
      parseFloat(amount) <= parseFloat(walletBalance) &&
      token &&
      timeDelay !== null
    );
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    
    // Collect the settings
    const settings: PrivacyTransactionSettings = {
      amount,
      token,
      timeDelay: parseInt(timeDelay),
      mixingLevel,
    };
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      if (onExecutePrivacyTransaction) {
        onExecutePrivacyTransaction(settings);
      }
    }, 3000);
  };
  
  const getMixingLevelDescription = (level: 'standard' | 'high' | 'maximum') => {
    switch (level) {
      case 'standard':
        return 'Basic privacy protection (2 rounds of mixing)';
      case 'high':
        return 'Enhanced privacy protection (5 rounds of mixing)';
      case 'maximum':
        return 'Maximum privacy protection (10 rounds of mixing)';
    }
  };
  
  const getTimeDelayLabel = (delay: string) => {
    const delayNum = parseInt(delay);
    if (delayNum === 0) return 'No delay (execute immediately)';
    if (delayNum < 60) return `${delayNum} minutes`;
    if (delayNum < 1440) return `${Math.floor(delayNum / 60)} hours`;
    return `${Math.floor(delayNum / 1440)} days`;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Private Transaction
        </CardTitle>
        <CardDescription>
          Send tokens with enhanced privacy using multi-layer mixing technology
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Privacy status */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <EyeOff className="h-4 w-4" />
                <span className="text-sm font-medium">Privacy Transactions</span>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant="outline" className="mb-1">
                  {privacyTransactionsRemaining} remaining this month
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {monetizationConfig.subscriptionTiers[userTier].name} Plan
                </span>
              </div>
            </div>
            
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex space-x-2">
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                />
                <Select value={token} onValueChange={setToken}>
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder={nativeCurrencySymbol} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={nativeCurrencySymbol}>{nativeCurrencySymbol}</SelectItem>
                    <SelectItem value="PLSX">PLSX</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {walletBalance && (
                <div className="text-xs text-right text-muted-foreground">
                  Balance: {parseFloat(walletBalance).toFixed(6)} {token}
                </div>
              )}
            </div>
            
            {/* Mixing Level */}
            <div className="space-y-2">
              <Label htmlFor="mixing-level">Privacy Level</Label>
              <Select value={mixingLevel} onValueChange={(value) => setMixingLevel(value as any)}>
                <SelectTrigger id="mixing-level">
                  <SelectValue placeholder="Select privacy level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="maximum">Maximum</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {getMixingLevelDescription(mixingLevel)}
              </p>
            </div>
            
            {/* Time Delay */}
            <div className="space-y-2">
              <Label htmlFor="time-delay">Time Delay</Label>
              <Select value={timeDelay} onValueChange={setTimeDelay}>
                <SelectTrigger id="time-delay">
                  <SelectValue placeholder="Select time delay" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No delay</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="360">6 hours</SelectItem>
                  <SelectItem value="1440">24 hours</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{getTimeDelayLabel(timeDelay)}</span>
              </div>
            </div>
          </div>
          
          {/* Privacy details */}
          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">
                  Your transaction will be mixed with others in private pools, breaking the 
                  on-chain link between sender and receiver. {mixingLevel === 'maximum' && 
                  'Maximum privacy includes cross-chain mixing for ultimate anonymity.'}
                </p>
              </div>
            </div>
            
            {amount && parseFloat(amount) > 0 && (
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Privacy Fee:</span>
                  {hasFreeTransactions ? (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                      Free Transaction Available
                    </Badge>
                  ) : (
                    <span className="font-medium">{parseFloat(privacyFee).toFixed(6)} {nativeCurrencySymbol}</span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={!isFormValid() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Execute Private Transaction <EyeOff className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter className="flex flex-col text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5" />
          <p>
            Privacy transactions use advanced mixing technology to ensure your financial activity 
            remains confidential. Higher privacy levels provide stronger protection but may take longer to complete.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};