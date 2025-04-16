import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { AlertCircle, EyeOff, Shield, RefreshCw, Lock } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getNativeCurrencySymbol } from "@/lib/ethers";
import { useNetwork } from "@/hooks/useNetwork";
import { 
  PrivacyLevel, 
  privacyLevelConfig, 
  calculatePrivacyFee, 
  generateStealthAddress 
} from "@/lib/zk-proofs";

interface EnhancedPrivateTransactionFormProps {
  onComplete: () => void;
}

// Enhanced transaction form schema
const transactionSchema = z.object({
  type: z.enum(['send', 'swap']),
  fromAsset: z.string(),
  toAsset: z.string().optional(),
  toAddress: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  mixingDelay: z.enum(['none', 'short', 'medium', 'long']),
  useStealthAddress: z.boolean().default(false),
  useTorRouting: z.boolean().default(false),
  customGasPrice: z.string().optional(),
  customNonce: z.string().optional(),
  waitForBlockConfirmations: z.number().default(1)
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

// Generate a safe delay-based function to avoid UI freezing
const safeDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const EnhancedPrivateTransactionForm = ({ onComplete }: EnhancedPrivateTransactionFormProps) => {
  const { toast } = useToast();
  const { currentNetwork } = useNetwork();
  const [transactionType, setTransactionType] = useState<'send' | 'swap'>('send');
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>(PrivacyLevel.STANDARD);
  const [privacyScore, setPrivacyScore] = useState(75);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [hasFreeTransactions, setHasFreeTransactions] = useState(true);
  const [processingStep, setProcessingStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessState, setShowSuccessState] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Get native currency symbol based on selected network
  const nativeCurrencySymbol = getNativeCurrencySymbol(currentNetwork);
  
  // Initialize form with default values
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'send',
      fromAsset: nativeCurrencySymbol,
      toAsset: '',
      toAddress: '',
      amount: '',
      mixingDelay: 'none',
      useStealthAddress: true,
      useTorRouting: false,
      waitForBlockConfirmations: 1
    }
  });
  
  // Get the current values from the form
  const watchAmount = form.watch("amount");
  const watchToAddress = form.watch("toAddress");
  const watchUseStealthAddress = form.watch("useStealthAddress");
  const watchMixingDelay = form.watch("mixingDelay");
  
  // Calculate privacy score based on form values and privacy level
  useEffect(() => {
    let score = 0;
    
    // Base score from privacy level
    if (privacyLevel === PrivacyLevel.BASIC) score += 30;
    if (privacyLevel === PrivacyLevel.STANDARD) score += 60;
    if (privacyLevel === PrivacyLevel.MAXIMUM) score += 80;
    
    // Additional score from options
    if (watchUseStealthAddress) score += 10;
    if (form.getValues("useTorRouting")) score += 10;
    
    // Mixing delay
    if (watchMixingDelay === 'short') score += 5;
    if (watchMixingDelay === 'medium') score += 10;
    if (watchMixingDelay === 'long') score += 15;
    
    // Cap score at 100
    score = Math.min(score, 100);
    
    setPrivacyScore(score);
  }, [privacyLevel, watchUseStealthAddress, form.getValues("useTorRouting"), watchMixingDelay]);
  
  // Calculate privacy fee
  const privacyFee = watchAmount ? calculatePrivacyFee(watchAmount, privacyLevel, currentNetwork) : "0";
  
  // Update form when transaction type changes
  const handleTypeChange = (value: 'send' | 'swap') => {
    setTransactionType(value);
    form.setValue('type', value);
    
    if (value === 'swap') {
      form.setValue('toAsset', 'USDC');
      form.setValue('toAddress', '');
    } else {
      form.setValue('toAsset', '');
    }
  };
  
  // Get stealth address
  const getStealthAddress = (address: string | undefined): string => {
    if (!address) return '';
    
    // In a real app, this would use a secure private key
    const mockPrivateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    
    return generateStealthAddress(address, mockPrivateKey);
  };
  
  // Handle preview step
  const handlePreview = () => {
    setShowPreview(true);
  };
  
  // Process the transaction
  const processTransaction = async () => {
    setIsProcessing(true);
    setProcessingStep(0);
    
    try {
      // Step 1: Generate zero-knowledge proof
      setProcessingStep(1);
      await safeDelay(1500);
      
      // Step 2: Create stealth addresses
      setProcessingStep(2);
      await safeDelay(1000);
      
      // Step 3: Route through mixing service
      setProcessingStep(3);
      await safeDelay(2000);
      
      // Step 4: Submit to network
      setProcessingStep(4);
      await safeDelay(1500);
      
      // Complete processing
      setProcessingStep(5);
      await safeDelay(1000);
      
      // Show success state
      setShowSuccessState(true);
      
      // Notify user
      toast({
        title: "Private transaction complete",
        description: "Your transaction has been processed with full privacy protection",
      });
      
      // In a real implementation, we would submit the transaction here
      // But for now, we're just simulating the process
      
      // Wait for a moment to show success state
      await safeDelay(1500);
      
      // Complete the form
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process private transaction",
        variant: "destructive",
      });
      
      setIsProcessing(false);
    }
  };
  
  // Submit transaction
  const submitTransaction = useMutation({
    mutationFn: async (data: TransactionFormValues) => {
      // For a real implementation, this would call your API to create a private transaction
      const transactionData = {
        userId: 1, // Hardcoded for example
        walletId: 1, // Hardcoded for example
        type: data.type,
        amount: data.amount,
        fromAsset: data.fromAsset,
        toAsset: data.type === 'swap' ? data.toAsset : data.fromAsset,
        fromAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', // Wallet address
        toAddress: data.useStealthAddress && data.toAddress 
          ? getStealthAddress(data.toAddress)
          : (data.type === 'send' ? data.toAddress : '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'), // For swap, receiver is same as sender
        hash: '', // Would be generated after transaction is submitted
        status: 'pending',
        isPrivate: true, // This is a private transaction
        privacyLevel, // Additional data not in the schema but useful for backend
        mixingDelay: data.mixingDelay,
        useTorRouting: data.useTorRouting,
        useStealthAddress: data.useStealthAddress,
        customGasPrice: data.customGasPrice,
        customNonce: data.customNonce,
        waitForBlockConfirmations: data.waitForBlockConfirmations
      };

      return await apiRequest("POST", "/api/transactions", transactionData);
    },
    onSuccess: () => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries({ queryKey: ["/api/wallets/1/transactions"] });
      
      // Process the transaction
      processTransaction();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to submit transaction: ${error}`,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: TransactionFormValues) => {
    if (showPreview) {
      submitTransaction.mutate(data);
    } else {
      handlePreview();
    }
  };
  
  // Get the delay time in words
  const getDelayTime = (delay: string): string => {
    switch (delay) {
      case 'none': return 'No delay';
      case 'short': return '5 minutes';
      case 'medium': return '30 minutes';
      case 'long': return '2 hours';
      default: return 'Unknown';
    }
  };
  
  // Get address type for display
  const getAddressType = (): string => {
    if (watchUseStealthAddress) {
      return 'Stealth Address (one-time use)';
    }
    return 'Standard Address';
  };
  
  // Get the full transaction preview
  const getTransactionPreview = (): React.ReactNode => {
    if (!watchAmount || (transactionType === 'send' && !watchToAddress)) {
      return (
        <div className="text-center py-6 text-muted-foreground">
          <p>Please fill in all required fields to preview transaction</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">From Asset</div>
            <div className="font-medium">{form.getValues("fromAsset")}</div>
          </div>
          
          {transactionType === 'swap' ? (
            <div>
              <div className="text-sm text-muted-foreground">To Asset</div>
              <div className="font-medium">{form.getValues("toAsset")}</div>
            </div>
          ) : (
            <div>
              <div className="text-sm text-muted-foreground">Recipient Type</div>
              <div className="font-medium">{getAddressType()}</div>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Amount</div>
            <div className="font-medium">{watchAmount} {form.getValues("fromAsset")}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Privacy Level</div>
            <div className="font-medium capitalize">{privacyLevel}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Mixing Delay</div>
            <div className="font-medium">{getDelayTime(watchMixingDelay)}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Privacy Score</div>
            <div className="font-medium">{privacyScore}%</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Privacy Fee</div>
            <div className="font-medium">
              {hasFreeTransactions 
                ? <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                    Free Transaction Available
                  </Badge>
                : `${privacyFee} ${nativeCurrencySymbol}`
              }
            </div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Confirmation Blocks</div>
            <div className="font-medium">{form.getValues("waitForBlockConfirmations")}</div>
          </div>
        </div>
        
        {transactionType === 'send' && (
          <div>
            <div className="text-sm text-muted-foreground">Recipient Address</div>
            <div className="font-medium truncate">
              {watchUseStealthAddress 
                ? getStealthAddress(watchToAddress)
                : watchToAddress
              }
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Show processing screen
  if (isProcessing) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{showSuccessState ? "Transaction Complete" : "Processing Private Transaction"}</DialogTitle>
          <DialogDescription>
            {showSuccessState 
              ? "Your private transaction has been processed successfully"
              : "Please wait while we process your privacy-enhanced transaction"
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {showSuccessState ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-500">
                  <Shield className="h-8 w-8" />
                </div>
              </div>
              <h3 className="text-lg font-medium">Transaction Complete</h3>
              <p className="text-sm text-muted-foreground">
                Your transaction has been processed with {privacyScore}% privacy protection
              </p>
              <Button onClick={onComplete} className="mt-4">
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <Progress value={(processingStep / 5) * 100} />
              
              <div className="space-y-4">
                <div className={`flex items-center space-x-3 ${processingStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {processingStep === 1 ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : processingStep > 1 ? (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">✓</div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-muted-foreground flex items-center justify-center text-xs">1</div>
                  )}
                  <span>Generating zero-knowledge proof</span>
                </div>
                
                <div className={`flex items-center space-x-3 ${processingStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {processingStep === 2 ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : processingStep > 2 ? (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">✓</div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-muted-foreground flex items-center justify-center text-xs">2</div>
                  )}
                  <span>Creating stealth addresses</span>
                </div>
                
                <div className={`flex items-center space-x-3 ${processingStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {processingStep === 3 ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : processingStep > 3 ? (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">✓</div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-muted-foreground flex items-center justify-center text-xs">3</div>
                  )}
                  <span>Routing through mixing service</span>
                </div>
                
                <div className={`flex items-center space-x-3 ${processingStep >= 4 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {processingStep === 4 ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : processingStep > 4 ? (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">✓</div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-muted-foreground flex items-center justify-center text-xs">4</div>
                  )}
                  <span>Submitting to network</span>
                </div>
                
                <div className={`flex items-center space-x-3 ${processingStep >= 5 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {processingStep === 5 ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : processingStep > 5 ? (
                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-white text-xs">✓</div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border border-muted-foreground flex items-center justify-center text-xs">5</div>
                  )}
                  <span>Verifying transaction</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }
  
  // Show preview screen
  if (showPreview) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Transaction Preview</DialogTitle>
          <DialogDescription>
            Review your privacy-enhanced transaction before submitting
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <Card>
            <CardContent className="pt-6">
              {getTransactionPreview()}
            </CardContent>
          </Card>
          
          <div className="mt-6 space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This transaction will be processed with {privacyLevel} privacy protection and a privacy score of {privacyScore}%.
              </AlertDescription>
            </Alert>
            
            <div className="flex justify-between space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => form.handleSubmit(onSubmit)()}
                className="flex-1"
                disabled={submitTransaction.isPending}
              >
                {submitTransaction.isPending ? "Submitting..." : "Confirm & Submit"}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Enhanced Private Transaction</DialogTitle>
        <DialogDescription>
          Send a transaction with zero-knowledge proof privacy protection
        </DialogDescription>
      </DialogHeader>

      <Tabs 
        defaultValue="send" 
        value={transactionType} 
        onValueChange={(value) => handleTypeChange(value as 'send' | 'swap')}
        className="mt-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="send">Send</TabsTrigger>
          <TabsTrigger value="swap">Swap</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Main Form Content */}
            <div className="space-y-6">
              <TabsContent value="send" className="space-y-4">
                <FormField
                  control={form.control}
                  name="fromAsset"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset to Send</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select asset" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={nativeCurrencySymbol}>{nativeCurrencySymbol}</SelectItem>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="WBTC">WBTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="toAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recipient Address</FormLabel>
                      <FormControl>
                        <Input placeholder="0x..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="0.1" {...field} type="number" step="0.0001" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="swap" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fromAsset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Asset</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select asset" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={nativeCurrencySymbol}>{nativeCurrencySymbol}</SelectItem>
                            <SelectItem value="USDC">USDC</SelectItem>
                            <SelectItem value="WBTC">WBTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="toAsset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Asset</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value || 'USDC'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select asset" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={nativeCurrencySymbol}>{nativeCurrencySymbol}</SelectItem>
                            <SelectItem value="USDC">USDC</SelectItem>
                            <SelectItem value="WBTC">WBTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount to Swap</FormLabel>
                      <FormControl>
                        <Input placeholder="0.1" {...field} type="number" step="0.0001" min="0" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </div>
            
            {/* Privacy Settings Card */}
            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-primary" /> 
                    Privacy Protection
                  </h3>
                  <Badge className={
                    privacyScore >= 90 ? "bg-green-500" :
                    privacyScore >= 70 ? "bg-blue-500" :
                    privacyScore >= 50 ? "bg-yellow-500" : 
                    "bg-orange-500"
                  }>
                    {privacyScore}% protected
                  </Badge>
                </div>
                
                <div className="space-y-6">
                  {/* Privacy Level Selection */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <FormLabel>Privacy Level</FormLabel>
                      <span className="text-xs text-muted-foreground capitalize">{privacyLevel}</span>
                    </div>
                    <RadioGroup 
                      value={privacyLevel} 
                      onValueChange={(value) => setPrivacyLevel(value as PrivacyLevel)}
                      className="grid grid-cols-3 gap-2"
                    >
                      <FormItem className="flex items-center space-x-0 space-y-0">
                        <FormControl>
                          <RadioGroupItem 
                            value={PrivacyLevel.BASIC} 
                            id="privacy-basic"
                            className="sr-only"
                          />
                        </FormControl>
                        <FormLabel 
                          htmlFor="privacy-basic"
                          className={`
                            flex flex-1 items-center justify-center py-2 text-center border rounded-md cursor-pointer
                            ${privacyLevel === PrivacyLevel.BASIC 
                              ? 'border-primary bg-primary text-white' 
                              : 'border-input'
                            }
                          `}
                        >
                          Basic
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-0 space-y-0">
                        <FormControl>
                          <RadioGroupItem 
                            value={PrivacyLevel.STANDARD} 
                            id="privacy-standard"
                            className="sr-only"
                          />
                        </FormControl>
                        <FormLabel 
                          htmlFor="privacy-standard"
                          className={`
                            flex flex-1 items-center justify-center py-2 text-center border rounded-md cursor-pointer
                            ${privacyLevel === PrivacyLevel.STANDARD 
                              ? 'border-primary bg-primary text-white' 
                              : 'border-input'
                            }
                          `}
                        >
                          Standard
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-0 space-y-0">
                        <FormControl>
                          <RadioGroupItem 
                            value={PrivacyLevel.MAXIMUM} 
                            id="privacy-maximum"
                            className="sr-only"
                          />
                        </FormControl>
                        <FormLabel 
                          htmlFor="privacy-maximum"
                          className={`
                            flex flex-1 items-center justify-center py-2 text-center border rounded-md cursor-pointer
                            ${privacyLevel === PrivacyLevel.MAXIMUM 
                              ? 'border-primary bg-primary text-white' 
                              : 'border-input'
                            }
                          `}
                        >
                          Maximum
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground mt-1">
                      {privacyLevel === PrivacyLevel.BASIC && "Basic privacy with minimal gas costs"}
                      {privacyLevel === PrivacyLevel.STANDARD && "Recommended balance of privacy and cost"}
                      {privacyLevel === PrivacyLevel.MAXIMUM && "Maximum privacy with higher gas costs"}
                    </p>
                  </div>
                  
                  {/* Enhanced Privacy Features */}
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="useStealthAddress"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <div className="space-y-0.5">
                            <FormLabel className="flex items-center">
                              <Lock className="w-4 h-4 mr-1 text-primary" />
                              Use Stealth Address
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Create a one-time address for the receiver
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="useTorRouting"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0">
                          <div className="space-y-0.5">
                            <FormLabel>Use Tor Routing</FormLabel>
                            <FormDescription className="text-xs">
                              Route transaction through Tor network
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Mixing Delay */}
                  <FormField
                    control={form.control}
                    name="mixingDelay"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center">
                          <FormLabel>Transaction Delay</FormLabel>
                          <span className="text-xs text-muted-foreground">
                            {field.value === 'none' && 'No delay'}
                            {field.value === 'short' && '5 min'}
                            {field.value === 'medium' && '30 min'}
                            {field.value === 'long' && '2 hours'}
                          </span>
                        </div>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select delay" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No delay (less private)</SelectItem>
                            <SelectItem value="short">Short (5 minutes)</SelectItem>
                            <SelectItem value="medium">Medium (30 minutes)</SelectItem>
                            <SelectItem value="long">Long (2 hours)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs">
                          Longer delays increase privacy by adding temporal distance
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  {/* Privacy Fee Section */}
                  {watchAmount && parseFloat(watchAmount) > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Privacy Fee:</span>
                        {hasFreeTransactions ? (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                            Free Transaction Available
                          </Badge>
                        ) : (
                          <span className="font-medium">{privacyFee} {nativeCurrencySymbol}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Advanced Settings Toggle */}
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setAdvancedMode(!advancedMode)}
            >
              <span className="text-sm font-medium">Advanced Settings</span>
              <div className="h-5 w-5 rounded-full border flex items-center justify-center">
                {advancedMode ? "−" : "+"}
              </div>
            </div>
            
            {/* Advanced Settings Expanded */}
            {advancedMode && (
              <div className="space-y-4 border rounded-md p-4">
                <h3 className="text-sm font-medium mb-2">Advanced Transaction Settings</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="customGasPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Gas Price (Gwei)</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customNonce"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Nonce</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="waitForBlockConfirmations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Block Confirmations</FormLabel>
                      <FormControl>
                        <Slider
                          defaultValue={[field.value]}
                          min={1}
                          max={12}
                          step={1}
                          onValueChange={(values) => field.onChange(values[0])}
                        />
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Fast ({field.value === 1 ? "Selected" : "1 block"})</span>
                        <span>Secure ({field.value >= 6 && field.value < 12 ? "Selected" : "6 blocks"})</span>
                        <span>Ultra-Secure ({field.value === 12 ? "Selected" : "12 blocks"})</span>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onComplete}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={!watchAmount || (transactionType === 'send' && !watchToAddress)}
              >
                {showPreview ? "Confirm & Submit" : "Preview Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </Tabs>
    </>
  );
};

export default EnhancedPrivateTransactionForm;