import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { generateWallet, getBalance, formatAddress } from '../lib/ethers';
import { useToast } from './use-toast';
import { useNetwork } from './useNetwork';

// Define wallet state types
interface WalletState {
  address: string | null;
  balance: string | null;
  isConnected: boolean;
  isLoading: boolean;
}

// Define context interface
interface WalletContextType {
  wallet: WalletState;
  connectWallet: (address: string, privateKey?: string) => void;
  disconnectWallet: () => void;
  createNewWallet: () => { address: string; privateKey: string };
  selectedAddress: string | null;
  truncatedAddress: string | null;
}

// Create context
export const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Provider component
export function WalletProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { network, networkConfig } = useNetwork();
  
  // Initial wallet state
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: null,
    isConnected: false,
    isLoading: true,
  });

  // Check for saved wallet on component mount
  useEffect(() => {
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress) {
      connectWallet(savedAddress);
    } else {
      setWallet(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Update balance when address or network changes
  useEffect(() => {
    if (wallet.address) {
      updateBalance();
    }
  }, [wallet.address, network]);

  // Update wallet balance
  const updateBalance = async () => {
    if (!wallet.address) return;
    
    try {
      const balanceValue = await getBalance(wallet.address, network);
      setWallet(prev => ({ ...prev, balance: balanceValue }));
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast({
        title: 'Balance Update Failed',
        description: 'Could not fetch your current balance.',
        variant: 'destructive',
      });
    }
  };

  // Connect to a wallet
  const connectWallet = (address: string, privateKey?: string) => {
    // In a production app, we would:
    // 1. Validate the address format
    // 2. Store the encrypted private key if provided
    
    setWallet({
      address,
      balance: null,
      isConnected: true,
      isLoading: false,
    });
    
    // Save address to localStorage
    localStorage.setItem('walletAddress', address);
    
    toast({
      title: 'Wallet Connected',
      description: `Connected to ${formatAddress(address)}`,
    });
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setWallet({
      address: null,
      balance: null,
      isConnected: false,
      isLoading: false,
    });
    
    // Remove from localStorage
    localStorage.removeItem('walletAddress');
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  };

  // Create a new wallet
  const createNewWallet = () => {
    const newWallet = generateWallet();
    return newWallet;
  };

  // Format address for display
  const truncatedAddress = wallet.address ? formatAddress(wallet.address) : null;

  // Provide context
  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectWallet,
        disconnectWallet,
        createNewWallet,
        selectedAddress: wallet.address,
        truncatedAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Hook for using the wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}