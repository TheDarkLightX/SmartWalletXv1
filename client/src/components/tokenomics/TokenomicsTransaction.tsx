import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Coins, ArrowRight, RefreshCw, Info } from "lucide-react";
import { useNetwork } from '@/hooks/useNetwork';
import { calculateTransactionFee, calculateNetAmount } from "@/lib/tokenomics";
import { formatAddress } from "@/lib/ethers";

interface TokenomicsTransactionProps {
  walletAddress: string;
  walletBalance?: string;
  hasWalletToken?: boolean;
}

export const TokenomicsTransaction = ({ 
  walletAddress, 
  walletBalance = "0",
  hasWalletToken = false 
}: TokenomicsTransactionProps) => {
  const { currentNetwork, nativeCurrencySymbol } = useNetwork();
  
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [useWalletToken, setUseWalletToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Additional state for fee display
  const [fee, setFee] = useState("0");
  const [netAmount, setNetAmount] = useState("0");
  
  // Calculate fees when amount changes
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      // Update fee
      const calculatedFee = calculateTransactionFee(amount, useWalletToken);
      setFee(calculatedFee);
      
      // Update net amount
      const calculatedNetAmount = calculateNetAmount(amount, useWalletToken);
      setNetAmount(calculatedNetAmount);
    } else {
      setFee("0");
      setNetAmount("0");
    }
  }, [amount, useWalletToken]);
  
  // Form validation
  const isFormValid = () => {
    return (
      recipient.length === 42 &&
      recipient.startsWith("0x") &&
      amount.trim() !== "" &&
      !isNaN(parseFloat(amount)) &&
      parseFloat(amount) > 0 &&
      parseFloat(amount) <= parseFloat(walletBalance)
    );
  };
  
  // Handle transaction submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real implementation, this would call your sendTransaction function
      // with the appropriate fee calculation
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate transaction time
      
      // Handle success, maybe display a success toast or redirect
      console.log("Transaction submitted successfully");
      
      // Reset form
      setAmount("");
      setRecipient("");
    } catch (error) {
      console.error("Error submitting transaction:", error);
      // Handle error, display error toast
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          Send {nativeCurrencySymbol} with Tokenomics
        </CardTitle>
        <CardDescription>
          Send transactions with our tokenomics fee structure that powers the ecosystem
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="font-mono text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({nativeCurrencySymbol})</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              min="0"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {walletBalance && (
              <div className="text-xs text-right text-muted-foreground">
                Balance: {parseFloat(walletBalance).toFixed(6)} {nativeCurrencySymbol}
              </div>
            )}
          </div>
          
          {hasWalletToken && (
            <div className="flex items-center justify-between space-x-2 pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="use-token" className="text-sm">Use WALLET tokens for fees</Label>
                <p className="text-xs text-muted-foreground">Pay reduced fees by using WALLET tokens</p>
              </div>
              <Switch
                id="use-token"
                checked={useWalletToken}
                onCheckedChange={setUseWalletToken}
                disabled={!hasWalletToken}
              />
            </div>
          )}
          
          {amount && parseFloat(amount) > 0 && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Fee ({useWalletToken ? 'Discounted' : 'Standard'}):</span>
                <span className="font-medium">{parseFloat(fee).toFixed(6)} {nativeCurrencySymbol}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Recipient receives:</span>
                <span className="font-medium">{parseFloat(netAmount).toFixed(6)} {nativeCurrencySymbol}</span>
              </div>
              <div className="flex items-start gap-2 mt-3 text-xs text-muted-foreground bg-muted p-2 rounded">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>
                  {useWalletToken ? 'Discounted fee' : 'Standard fee'} supports developer funding and powers the 
                  automatic buy & burn mechanism for {nativeCurrencySymbol} and PLSX.
                </p>
              </div>
            </div>
          )}
          
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
                Send Transaction
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <span>From: {formatAddress(walletAddress)}</span>
        <span>Network: {currentNetwork === 'pulsechain' ? 'PulseChain' : 'Ethereum'}</span>
      </CardFooter>
    </Card>
  );
};