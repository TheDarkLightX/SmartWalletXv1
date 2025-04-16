import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Usb, AlertTriangle } from 'lucide-react';

import { 
  HardwareWalletType, 
  ConnectionStatus,
  connectLedger, 
  connectTrezor, 
  getHardwareWalletCapabilities 
} from '@/lib/hardware-wallets';

export function HardwareWalletConnector() {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [walletType, setWalletType] = useState<HardwareWalletType>(HardwareWalletType.NONE);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const connectHardwareWallet = async (type: HardwareWalletType) => {
    try {
      setConnectionStatus(ConnectionStatus.CONNECTING);
      setWalletType(type);
      setError(null);
      
      let walletInfo;
      if (type === HardwareWalletType.LEDGER) {
        walletInfo = await connectLedger();
      } else if (type === HardwareWalletType.TREZOR) {
        walletInfo = await connectTrezor();
      } else {
        throw new Error('Unsupported hardware wallet type');
      }
      
      if (walletInfo.status === ConnectionStatus.ERROR) {
        setConnectionStatus(ConnectionStatus.ERROR);
        setError(walletInfo.error || 'Unknown connection error');
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: walletInfo.error || 'Failed to connect to hardware wallet',
        });
        return;
      }
      
      setConnectionStatus(ConnectionStatus.CONNECTED);
      setAccounts(walletInfo.accounts || []);
      
      toast({
        title: "Hardware Wallet Connected",
        description: `Successfully connected to ${type} wallet`,
      });
      
      // If accounts are found, select the first one by default
      if (walletInfo.accounts && walletInfo.accounts.length > 0) {
        setSelectedAccount(walletInfo.accounts[0]);
      }
      
    } catch (err) {
      setConnectionStatus(ConnectionStatus.ERROR);
      setError(err.message || 'Unknown error');
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: err.message || 'Failed to connect hardware wallet',
      });
    }
  };
  
  const disconnect = () => {
    setConnectionStatus(ConnectionStatus.DISCONNECTED);
    setWalletType(HardwareWalletType.NONE);
    setAccounts([]);
    setSelectedAccount(null);
    setError(null);
    
    toast({
      title: "Disconnected",
      description: "Hardware wallet disconnected",
    });
  };
  
  // Display capabilities of the connected wallet
  const renderCapabilities = () => {
    if (walletType === HardwareWalletType.NONE) return null;
    
    const capabilities = getHardwareWalletCapabilities(walletType);
    
    return (
      <div className="mt-4 text-sm">
        <h4 className="font-medium mb-2">Wallet Capabilities:</h4>
        <ul className="grid grid-cols-2 gap-y-1">
          <li className={capabilities.supportsPulsechain ? 'text-green-600' : 'text-red-600'}>
            {capabilities.supportsPulsechain ? '✓' : '✗'} PulseChain
          </li>
          <li className={capabilities.supportsEthereum ? 'text-green-600' : 'text-red-600'}>
            {capabilities.supportsEthereum ? '✓' : '✗'} Ethereum
          </li>
          <li className={capabilities.supportsEIP1559 ? 'text-green-600' : 'text-red-600'}>
            {capabilities.supportsEIP1559 ? '✓' : '✗'} EIP-1559
          </li>
          <li className={capabilities.supportsPulseX ? 'text-green-600' : 'text-red-600'}>
            {capabilities.supportsPulseX ? '✓' : '✗'} PulseX
          </li>
        </ul>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Usb className="mr-2 h-5 w-5" />
          Hardware Wallet
        </CardTitle>
        <CardDescription>
          Connect securely to your hardware wallet device
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {connectionStatus === ConnectionStatus.DISCONNECTED && (
          <Tabs defaultValue="ledger">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="ledger">Ledger</TabsTrigger>
              <TabsTrigger value="trezor">Trezor</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ledger" className="space-y-4">
              <div className="text-sm">
                <p>Connect your Ledger device, unlock it, and open the Ethereum application.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Ensure your device is updated to the latest firmware</li>
                  <li>Browser support for USB devices is required</li>
                  <li>Approve the connection on your device when prompted</li>
                </ul>
              </div>
              
              <Button 
                onClick={() => connectHardwareWallet(HardwareWalletType.LEDGER)}
                className="w-full"
              >
                Connect Ledger
              </Button>
            </TabsContent>
            
            <TabsContent value="trezor" className="space-y-4">
              <div className="text-sm">
                <p>Connect your Trezor device and follow the on-screen instructions.</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>You may need to enter your PIN on the device</li>
                  <li>A popup window will appear for confirmation</li>
                  <li>Keep your device connected during the entire session</li>
                </ul>
              </div>
              
              <Button 
                onClick={() => connectHardwareWallet(HardwareWalletType.TREZOR)}
                className="w-full"
              >
                Connect Trezor
              </Button>
            </TabsContent>
          </Tabs>
        )}
        
        {connectionStatus === ConnectionStatus.CONNECTING && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p>Connecting to {walletType} device...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Please follow any prompts on your device
            </p>
          </div>
        )}
        
        {connectionStatus === ConnectionStatus.CONNECTED && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <p className="font-medium text-green-600">
                Connected to {walletType} device
              </p>
            </div>
            
            {accounts.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Available Accounts:</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {accounts.map((account, index) => (
                    <div 
                      key={index}
                      className={`p-2 rounded-md text-sm cursor-pointer transition-colors ${
                        selectedAccount === account 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                      onClick={() => setSelectedAccount(account)}
                    >
                      {account}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {renderCapabilities()}
          </div>
        )}
        
        {connectionStatus === ConnectionStatus.ERROR && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'An unknown error occurred while connecting to the hardware wallet.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      {connectionStatus === ConnectionStatus.CONNECTED && (
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={disconnect}
            className="w-full"
          >
            Disconnect Device
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}