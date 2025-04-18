import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { formatAddress } from '../lib/ethers';
import { ArrowLeft, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { networks } from '../lib/ethers';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ownerAddress, setOwnerAddress] = useState<string | null>(null);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [walletType, setWalletType] = useState<'smartContract' | 'eoa'>('smartContract');
  const [socialRecoveryEnabled, setSocialRecoveryEnabled] = useState(false);
  const [mpcEnabled, setMpcEnabled] = useState(false);

  useEffect(() => {
    // Retrieve wallet info from localStorage
    const address = localStorage.getItem('walletAddress');
    const owner = localStorage.getItem('ownerAddress');
    const hasEncryptedWallet = localStorage.getItem('hasEncryptedWallet') === 'true';
    const type = localStorage.getItem('walletType') as 'smartContract' | 'eoa' || 'smartContract';
    const recoveryThreshold = localStorage.getItem('recoveryThreshold');
    const mpc = localStorage.getItem('mpcEnabled') === 'true';
    
    if (address) {
      setWalletAddress(address);
      setOwnerAddress(owner);
      setIsEncrypted(hasEncryptedWallet);
      setWalletType(type);
      setSocialRecoveryEnabled(!!recoveryThreshold);
      setMpcEnabled(mpc);
    } else {
      // No wallet found, redirect to wallet creation
      setLocation('/wallet/create');
    }
  }, [setLocation]);

  const copyAddressToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress).then(
        () => {
          toast({
            title: "Address Copied",
            description: "Wallet address copied to clipboard"
          });
        },
        () => {
          toast({
            title: "Failed to Copy",
            description: "Permission denied",
            variant: "destructive"
          });
        }
      );
    }
  };

  const openBlockExplorer = () => {
    if (walletAddress) {
      // Default to PulseChain network
      const network = 'pulsechain';
      const explorerUrl = `${networks[network].blockExplorer}/address/${walletAddress}`;
      window.open(explorerUrl, '_blank');
    }
  };

  const disconnectWallet = () => {
    // Clear all wallet-related data
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('ownerAddress');
    localStorage.removeItem('hasEncryptedWallet');
    localStorage.removeItem('walletType');
    localStorage.removeItem('mpcEnabled');
    localStorage.removeItem('recoveryThreshold');
    // If we had encrypted keys, we would clear those too
    
    // Redirect to wallet creation
    setLocation('/wallet/create');
    
    toast({
      title: "Wallet Disconnected",
      description: "Your smart contract wallet has been disconnected.",
    });
  };

  if (!walletAddress) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl mb-4">Loading wallet...</h2>
          <Button onClick={() => setLocation('/wallet/create')}>
            Create New Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Your Wallet</CardTitle>
            <CardDescription>
              Manage your secure wallet on PulseChain and Ethereum
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 dark:bg-dark-600 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Wallet Address</h3>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={copyAddressToClipboard}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button variant="ghost" size="sm" onClick={openBlockExplorer}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View on Explorer
                    </Button>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-dark-500 rounded border font-mono text-sm break-all">
                  {walletAddress}
                </div>
              </div>
              
              {/* Owner Address (Only shown for smart contract wallets) */}
              {ownerAddress && (
                <div className="p-4 bg-gray-50 dark:bg-dark-600 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Owner Address (EOA)</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (ownerAddress) {
                          navigator.clipboard.writeText(ownerAddress);
                          toast({
                            title: "Address Copied",
                            description: "Owner address copied to clipboard"
                          });
                        }
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-3 bg-white dark:bg-dark-500 rounded border font-mono text-sm break-all">
                    {ownerAddress}
                  </div>
                  <p className="text-xs mt-2 text-muted-foreground">
                    This is the controlling key for your smart contract wallet
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-1">Wallet Type</h3>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full bg-blue-500 mr-2`}></div>
                    <p className="text-sm">{walletType === 'smartContract' ? 'Smart Contract Wallet' : 'Regular Wallet'}</p>
                  </div>
                  {walletType === 'smartContract' && (
                    <p className="text-xs mt-2 text-muted-foreground">
                      Enhanced security with smart contract features
                    </p>
                  )}
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-1">Security Features</h3>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full ${isEncrypted ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></div>
                      <span>Password Protection</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full ${mpcEnabled ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></div>
                      <span>Multi-Party Computation</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <div className={`w-2 h-2 rounded-full ${socialRecoveryEnabled ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></div>
                      <span>Social Recovery</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-1">Network</h3>
                  <p className="text-sm">PulseChain Mainnet</p>
                  <p className="text-xs mt-2 text-muted-foreground">
                    Compatible with Ethereum network
                  </p>
                </div>
              </div>
              
              {/* Smart Contract Features */}
              {walletType === 'smartContract' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Social Recovery</h3>
                    <p className="text-sm">
                      {socialRecoveryEnabled 
                        ? "Enabled with threshold of " + localStorage.getItem('recoveryThreshold') + " guardians" 
                        : "Not configured"}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => toast({
                        title: "Coming Soon",
                        description: "Guardian management will be available in the next update",
                      })}
                    >
                      Manage Guardians
                    </Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Transaction Limits</h3>
                    <p className="text-sm">No limits configured</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => toast({
                        title: "Coming Soon",
                        description: "Transaction limits will be available in the next update",
                      })}
                    >
                      Set Limits
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setLocation('/wallet/create')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Wallet Creation
            </Button>
            
            <Button variant="destructive" onClick={disconnectWallet}>
              Disconnect Wallet
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center p-8 border border-dashed rounded-lg">
          <h3 className="text-xl font-medium mb-2">Ready for Future Features</h3>
          <p className="text-muted-foreground mb-4">
            Transaction history, token balances, privacy tools, and AI strategies will appear here in future updates.
          </p>
        </div>
      </div>
    </div>
  );
}