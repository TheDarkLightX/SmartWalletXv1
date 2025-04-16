import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ShieldCheck, Eye, EyeOff, Lock, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import EnhancedPrivateTransactionForm from "@/components/wallet/EnhancedPrivateTransactionForm";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { PrivacyLevel } from "@/lib/zk-proofs";

export default function PrivacyTools() {
  const { toast } = useToast();
  const [privacyLevel, setPrivacyLevel] = useState(2); // 1-3, where 3 is max privacy
  const [autoPrivacy, setAutoPrivacy] = useState(true);
  const [privateThreshold, setPrivateThreshold] = useState(1.0); // ETH amount
  const [isPrivacyEnabled, setIsPrivacyEnabled] = useState(true);
  const [showNewTxDialog, setShowNewTxDialog] = useState(false);
  
  // For a real implementation, we would fetch the user ID from an auth context
  const userId = 1;

  // Fetch wallet
  const { data: wallets } = useQuery({
    queryKey: [`/api/users/${userId}/wallets`],
  });

  // Fetch transactions with privacy features
  const { data: transactions, isLoading } = useQuery({
    queryKey: [`/api/wallets/${wallets?.[0]?.id}/transactions`],
    enabled: !!wallets && wallets.length > 0,
  });

  // Filter private transactions
  const privateTransactions = transactions?.filter(tx => tx.isPrivate) || [];

  // Handle privacy settings update
  const updatePrivacySettings = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would update the user's privacy settings
      return await apiRequest("PUT", `/api/users/${userId}`, {
        privacySettings: {
          privacyLevel,
          autoPrivacy,
          privateThreshold,
          isPrivacyEnabled
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Privacy settings updated",
        description: "Your privacy settings have been saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update privacy settings: " + error,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Privacy Tools</h1>
          
          <Dialog open={showNewTxDialog} onOpenChange={setShowNewTxDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-700">
                <EyeOff className="mr-2 h-4 w-4" />
                New Private Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <PrivateTransactionForm onComplete={() => setShowNewTxDialog(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Privacy Settings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>
                  Configure how your transactions are protected on the blockchain
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <Alert className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Private transactions use zero-knowledge proofs to hide transaction details while maintaining verifiability.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-6">
                  {/* Enable Privacy */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-medium">Enable Privacy Features</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Turn on privacy protection for your transactions
                      </p>
                    </div>
                    <Switch
                      checked={isPrivacyEnabled}
                      onCheckedChange={setIsPrivacyEnabled}
                    />
                  </div>
                  
                  {/* Privacy Level */}
                  <div className={isPrivacyEnabled ? "" : "opacity-50 pointer-events-none"}>
                    <div className="mb-2">
                      <h3 className="text-md font-medium">Privacy Level</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Higher levels provide stronger privacy but may increase gas costs
                      </p>
                    </div>
                    <div className="pt-2">
                      <Slider
                        value={[privacyLevel]}
                        min={1}
                        max={3}
                        step={1}
                        onValueChange={(value) => setPrivacyLevel(value[0])}
                      />
                      <div className="flex justify-between mt-2 text-sm text-gray-500">
                        <span>Basic</span>
                        <span>Standard</span>
                        <span>Maximum</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Automatic Privacy */}
                  <div className={isPrivacyEnabled ? "" : "opacity-50 pointer-events-none"}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="text-md font-medium">Automatic Privacy</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Automatically apply privacy for transactions above threshold
                        </p>
                      </div>
                      <Switch
                        checked={autoPrivacy}
                        onCheckedChange={setAutoPrivacy}
                      />
                    </div>
                    
                    {autoPrivacy && (
                      <div className="flex items-center space-x-4 mt-4">
                        <Label htmlFor="threshold">
                          Private when above:
                        </Label>
                        <div className="flex items-center">
                          <Input
                            id="threshold"
                            type="number"
                            value={privateThreshold}
                            onChange={(e) => setPrivateThreshold(parseFloat(e.target.value))}
                            className="w-24"
                            step={0.1}
                            min={0}
                          />
                          <span className="ml-2">ETH</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => updatePrivacySettings.mutate()}
                    className="w-full mt-4"
                    disabled={updatePrivacySettings.isPending}
                  >
                    {updatePrivacySettings.isPending ? "Saving..." : "Save Privacy Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Private Transactions */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Private Transactions</CardTitle>
                <CardDescription>
                  Transactions with enhanced privacy
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {isLoading ? (
                  <p className="text-center text-gray-500 py-4">Loading transactions...</p>
                ) : privateTransactions.length === 0 ? (
                  <div className="text-center py-6">
                    <EyeOff className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-500">No private transactions yet</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setShowNewTxDialog(true)}
                    >
                      Create your first private transaction
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {privateTransactions.map((tx) => (
                      <div key={tx.id} className="border border-gray-200 dark:border-dark-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500">
                              <EyeOff className="h-4 w-4" />
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {tx.type === 'send' ? 'Sent' : tx.type === 'receive' ? 'Received' : 'Swapped'} {tx.fromAsset}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(tx.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {tx.amount} {tx.fromAsset}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Privacy Information */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>How Your Privacy Is Protected</CardTitle>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary bg-opacity-10 flex items-center justify-center text-primary mb-4">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Zero-Knowledge Proofs</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Verify transactions without revealing sensitive details using cryptographic proof systems.
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-500 mb-4">
                    <i className="ri-shuffle-line text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Transaction Mixing</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your transactions are combined with others to obscure the source and destination addresses.
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-500 mb-4">
                    <i className="ri-key-2-line text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-2">Stealth Addresses</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    One-time addresses are generated for each transaction to prevent address reuse.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
