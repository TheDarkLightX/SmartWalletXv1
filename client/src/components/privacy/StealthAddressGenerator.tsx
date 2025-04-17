import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  generateStealthKeyPair, 
  generateStealthAddress, 
  StealthAddress, 
  StealthKeyPair,
  getStealthPaymentLink,
  parseStealthPaymentLink,
  sendToStealthAddress
} from '@/lib/stealth-addresses';
import { 
  Copy, 
  Check, 
  Fingerprint, 
  Key, 
  Eye, 
  EyeOff,
  RefreshCw,
  Share2,
  QrCode,
  ArrowRight,
  Info,
  Landmark
} from 'lucide-react';

interface StealthAddressGeneratorProps {
  privateKey?: string;
  walletAddress?: string;
  network?: 'pulsechain' | 'ethereum';
}

const StealthAddressGenerator: React.FC<StealthAddressGeneratorProps> = ({
  privateKey = '',
  walletAddress = '',
  network = 'pulsechain'
}) => {
  // State for key generation
  const [stealthKeyPair, setStealthKeyPair] = useState<StealthKeyPair | null>(null);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [paymentLink, setPaymentLink] = useState('');
  
  // State for stealth address creation
  const [recipientPaymentLink, setRecipientPaymentLink] = useState('');
  const [recipientStealthKeys, setRecipientStealthKeys] = useState<{
    spendingPublicKey: string;
    viewingPublicKey: string;
  } | null>(null);
  const [memo, setMemo] = useState('');
  const [amount, setAmount] = useState('');
  const [stealthAddress, setStealthAddress] = useState<StealthAddress | null>(null);
  const [isCreatingAddress, setIsCreatingAddress] = useState(false);
  
  // State for copy buttons
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({});
  
  // State for advanced options
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const { toast } = useToast();
  
  // Reset copied states after timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCopiedStates({});
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [copiedStates]);
  
  // Parse recipient payment link whenever it changes
  useEffect(() => {
    if (recipientPaymentLink) {
      const parsed = parseStealthPaymentLink(recipientPaymentLink);
      setRecipientStealthKeys(parsed);
    } else {
      setRecipientStealthKeys(null);
    }
  }, [recipientPaymentLink]);
  
  // Generate stealth keys
  const handleGenerateKeys = async () => {
    if (!privateKey) {
      toast({
        title: "Private Key Required",
        description: "Your private key is needed to generate stealth keys.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsGeneratingKeys(true);
      const keyPair = await generateStealthKeyPair(privateKey);
      setStealthKeyPair(keyPair);
      
      // Generate payment link
      const link = getStealthPaymentLink({
        spendingPublicKey: keyPair.spendingPublicKey,
        viewingPublicKey: keyPair.viewingPublicKey
      });
      setPaymentLink(link);
      
      toast({
        title: "Stealth Keys Generated",
        description: "Your stealth keys have been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Key Generation Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsGeneratingKeys(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedStates({ ...copiedStates, [key]: true });
        toast({
          title: "Copied to Clipboard",
          description: "The text has been copied to your clipboard.",
        });
      },
      () => {
        toast({
          title: "Copy Failed",
          description: "Failed to copy to clipboard.",
          variant: "destructive"
        });
      }
    );
  };
  
  // Generate stealth address
  const handleCreateStealthAddress = async () => {
    if (!privateKey) {
      toast({
        title: "Private Key Required",
        description: "Your private key is needed to create stealth addresses.",
        variant: "destructive"
      });
      return;
    }
    
    if (!recipientStealthKeys) {
      toast({
        title: "Recipient Information Required",
        description: "Please enter a valid recipient payment link.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsCreatingAddress(true);
      
      const address = await generateStealthAddress(
        recipientStealthKeys,
        privateKey,
        memo || undefined
      );
      
      setStealthAddress(address);
      
      toast({
        title: "Stealth Address Created",
        description: "A stealth address has been created for the recipient.",
      });
    } catch (error) {
      toast({
        title: "Address Creation Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsCreatingAddress(false);
    }
  };
  
  // Send to stealth address
  const handleSendToStealthAddress = async () => {
    if (!privateKey) {
      toast({
        title: "Private Key Required",
        description: "Your private key is needed to send funds.",
        variant: "destructive"
      });
      return;
    }
    
    if (!stealthAddress) {
      toast({
        title: "Stealth Address Required",
        description: "Please create a stealth address first.",
        variant: "destructive"
      });
      return;
    }
    
    if (!amount) {
      toast({
        title: "Amount Required",
        description: "Please enter an amount to send.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const result = await sendToStealthAddress(
        stealthAddress,
        amount,
        privateKey,
        network
      );
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Transaction Sent",
        description: `Successfully sent ${amount} ${network === 'pulsechain' ? 'PLS' : 'ETH'} to the stealth address.`,
      });
      
      // Reset form
      setAmount('');
      setMemo('');
      setRecipientPaymentLink('');
      setStealthAddress(null);
    } catch (error) {
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Stealth Address Generator
        </CardTitle>
        <CardDescription>
          Create one-time addresses for enhanced privacy in transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="generate">Generate Keys</TabsTrigger>
            <TabsTrigger value="create">Create & Send</TabsTrigger>
          </TabsList>
          
          {/* Generate Keys Tab */}
          <TabsContent value="generate">
            <div className="grid gap-4">
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-500">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle>What are Stealth Addresses?</AlertTitle>
                <AlertDescription>
                  Stealth addresses are one-time addresses that prevent blockchain analysis from linking your
                  transactions to your identity. Each payment to you will have a different address.
                </AlertDescription>
              </Alert>
              
              {!stealthKeyPair ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Generate your stealth keys to start receiving private payments. This only needs to be done once.
                  </p>
                  
                  <Button 
                    onClick={handleGenerateKeys} 
                    disabled={isGeneratingKeys || !privateKey}
                    className="w-full"
                  >
                    {isGeneratingKeys ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating Keys...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Generate Stealth Keys
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md border">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Your Payment Link</h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(paymentLink, 'paymentLink')}
                        >
                          {copiedStates['paymentLink'] ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs font-mono break-all bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      {paymentLink}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Share this link with anyone who wants to pay you privately.
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="show-keys"
                      checked={showKeys}
                      onCheckedChange={setShowKeys}
                    />
                    <Label htmlFor="show-keys">Show Private Keys</Label>
                  </div>
                  
                  {showKeys && (
                    <div className="space-y-2">
                      <div className="grid gap-1.5">
                        <Label htmlFor="spending-key">Spending Public Key</Label>
                        <div className="relative">
                          <Input 
                            id="spending-key" 
                            value={stealthKeyPair.spendingPublicKey} 
                            readOnly 
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => copyToClipboard(stealthKeyPair.spendingPublicKey, 'spendingPublicKey')}
                          >
                            {copiedStates['spendingPublicKey'] ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid gap-1.5">
                        <Label htmlFor="viewing-key">Viewing Public Key</Label>
                        <div className="relative">
                          <Input 
                            id="viewing-key" 
                            value={stealthKeyPair.viewingPublicKey} 
                            readOnly 
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => copyToClipboard(stealthKeyPair.viewingPublicKey, 'viewingPublicKey')}
                          >
                            {copiedStates['viewingPublicKey'] ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid gap-1.5">
                        <Label htmlFor="spending-private-key" className="flex items-center gap-2">
                          <span>Spending Private Key</span>
                          <span className="text-xs text-red-500 font-normal">(Sensitive)</span>
                        </Label>
                        <div className="relative">
                          <Input 
                            id="spending-private-key" 
                            value={stealthKeyPair.spendingPrivateKey} 
                            readOnly 
                            type="password"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-10 top-0 h-full px-3"
                            onClick={() => {
                              const input = document.getElementById('spending-private-key') as HTMLInputElement;
                              input.type = input.type === 'password' ? 'text' : 'password';
                            }}
                          >
                            {document.getElementById('spending-private-key')?.getAttribute('type') === 'password' ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => copyToClipboard(stealthKeyPair.spendingPrivateKey, 'spendingPrivateKey')}
                          >
                            {copiedStates['spendingPrivateKey'] ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid gap-1.5">
                        <Label htmlFor="viewing-private-key" className="flex items-center gap-2">
                          <span>Viewing Private Key</span>
                          <span className="text-xs text-red-500 font-normal">(Sensitive)</span>
                        </Label>
                        <div className="relative">
                          <Input 
                            id="viewing-private-key" 
                            value={stealthKeyPair.viewingPrivateKey} 
                            readOnly 
                            type="password"
                          />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-10 top-0 h-full px-3"
                            onClick={() => {
                              const input = document.getElementById('viewing-private-key') as HTMLInputElement;
                              input.type = input.type === 'password' ? 'text' : 'password';
                            }}
                          >
                            {document.getElementById('viewing-private-key')?.getAttribute('type') === 'password' ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => copyToClipboard(stealthKeyPair.viewingPrivateKey, 'viewingPrivateKey')}
                          >
                            {copiedStates['viewingPrivateKey'] ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      <Alert variant="destructive" className="mt-2">
                        <AlertTitle>Keep Your Private Keys Safe</AlertTitle>
                        <AlertDescription>
                          Anyone with access to these private keys can spend funds sent to your stealth addresses. 
                          Store them securely and never share them.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleGenerateKeys}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Keys
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Create & Send Tab */}
          <TabsContent value="create">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="recipient-link">Recipient's Payment Link</Label>
                <Textarea
                  id="recipient-link"
                  placeholder="Enter the recipient's stealth payment link"
                  value={recipientPaymentLink}
                  onChange={(e) => setRecipientPaymentLink(e.target.value)}
                  className="min-h-[80px]"
                />
                
                {recipientStealthKeys ? (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ Valid payment link detected
                  </p>
                ) : recipientPaymentLink ? (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    ✕ Invalid payment link format
                  </p>
                ) : null}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-12"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500">
                      {network === 'pulsechain' ? 'PLS' : 'ETH'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="advanced-options"
                  checked={showAdvancedOptions}
                  onCheckedChange={setShowAdvancedOptions}
                />
                <Label htmlFor="advanced-options">Show Advanced Options</Label>
              </div>
              
              {showAdvancedOptions && (
                <div className="grid gap-2">
                  <Label htmlFor="memo">Private Memo (Optional)</Label>
                  <Textarea
                    id="memo"
                    placeholder="Add a private message for the recipient"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <p className="text-xs text-gray-500">
                    This memo is only visible to the recipient.
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-2 mt-2">
                <Button 
                  onClick={handleCreateStealthAddress}
                  disabled={isCreatingAddress || !recipientStealthKeys || !privateKey}
                  variant={stealthAddress ? "outline" : "default"}
                >
                  {isCreatingAddress ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating Address...
                    </>
                  ) : stealthAddress ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate Address
                    </>
                  ) : (
                    <>
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Create Stealth Address
                    </>
                  )}
                </Button>
                
                {stealthAddress && (
                  <div className="mt-2 space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md border">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-medium">Stealth Address</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyToClipboard(stealthAddress.address, 'stealthAddress')}
                        >
                          {copiedStates['stealthAddress'] ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs font-mono break-all bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        {stealthAddress.address}
                      </p>
                    </div>
                    
                    <div className="flex items-center py-4">
                      <div className="flex-1 border-t" />
                      <p className="mx-4 text-xs text-gray-500 uppercase">Transaction Summary</p>
                      <div className="flex-1 border-t" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">From:</span>
                        <span className="text-sm font-mono">
                          {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">To (Stealth):</span>
                        <span className="text-sm font-mono">
                          {stealthAddress.address.substring(0, 6)}...{stealthAddress.address.substring(38)}
                        </span>
                      </div>
                      {amount && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Amount:</span>
                          <span className="text-sm font-medium">
                            {amount} {network === 'pulsechain' ? 'PLS' : 'ETH'}
                          </span>
                        </div>
                      )}
                      {memo && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Memo:</span>
                          <span className="text-sm italic max-w-[200px] truncate text-right">
                            {memo}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full mt-2" 
                      disabled={!amount || !stealthAddress}
                      onClick={handleSendToStealthAddress}
                    >
                      <Landmark className="mr-2 h-4 w-4" />
                      Send Privately
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StealthAddressGenerator;