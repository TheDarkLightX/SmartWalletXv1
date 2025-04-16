import { useState } from "react";
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
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PrivateTransactionFormProps {
  onComplete: () => void;
}

// Transaction form schema
const transactionSchema = z.object({
  type: z.enum(['send', 'swap']),
  fromAsset: z.string(),
  toAsset: z.string().optional(),
  toAddress: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  gasLevel: z.enum(['low', 'medium', 'high']),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const PrivateTransactionForm = ({ onComplete }: PrivateTransactionFormProps) => {
  const { toast } = useToast();
  const [transactionType, setTransactionType] = useState<'send' | 'swap'>('send');
  const [privacyLevel, setPrivacyLevel] = useState<string>("standard");

  // Initialize form with default values
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'send',
      fromAsset: 'ETH',
      toAsset: '',
      toAddress: '',
      amount: '',
      gasLevel: 'medium',
    }
  });

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
        toAddress: data.type === 'send' ? data.toAddress : '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', // For swap, receiver is same as sender
        hash: '', // Would be generated after transaction is submitted
        status: 'pending',
        isPrivate: true, // This is a private transaction
        privacyLevel, // Additional data not in the schema but useful for backend
        gasLevel: data.gasLevel,
      };

      return await apiRequest("POST", "/api/transactions", transactionData);
    },
    onSuccess: () => {
      // Invalidate and refetch transactions
      queryClient.invalidateQueries({ queryKey: ["/api/wallets/1/transactions"] });
      
      toast({
        title: "Transaction submitted",
        description: "Your private transaction has been submitted successfully",
      });
      
      onComplete();
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
    submitTransaction.mutate(data);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>New Private Transaction</DialogTitle>
        <DialogDescription>
          Send a transaction with enhanced privacy protections.
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
                        <SelectItem value="ETH">ETH</SelectItem>
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
                          <SelectItem value="ETH">ETH</SelectItem>
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
                          <SelectItem value="ETH">ETH</SelectItem>
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
            
            {/* Privacy Settings */}
            <div className="space-y-4 border rounded-md p-4">
              <h3 className="text-sm font-medium">Privacy Settings</h3>
              
              <div className="space-y-2">
                <FormLabel>Privacy Level</FormLabel>
                <div className="flex space-x-2">
                  <Button 
                    type="button"
                    variant={privacyLevel === "basic" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPrivacyLevel("basic")}
                    className="flex-1"
                  >
                    Basic
                  </Button>
                  <Button 
                    type="button"
                    variant={privacyLevel === "standard" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPrivacyLevel("standard")}
                    className="flex-1"
                  >
                    Standard
                  </Button>
                  <Button 
                    type="button"
                    variant={privacyLevel === "maximum" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPrivacyLevel("maximum")}
                    className="flex-1"
                  >
                    Maximum
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {privacyLevel === "basic" && "Basic privacy with minimal gas costs"}
                  {privacyLevel === "standard" && "Recommended balance of privacy and cost"}
                  {privacyLevel === "maximum" && "Maximum privacy with higher gas costs"}
                </p>
              </div>
              
              <FormField
                control={form.control}
                name="gasLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Speed</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gas level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low (Cheaper, Slower)</SelectItem>
                        <SelectItem value="medium">Medium (Recommended)</SelectItem>
                        <SelectItem value="high">High (Faster, More Expensive)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Higher speeds incur higher gas fees but process faster
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

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
                disabled={submitTransaction.isPending}
              >
                {submitTransaction.isPending ? "Submitting..." : "Submit Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </Tabs>
    </>
  );
};

export default PrivateTransactionForm;
