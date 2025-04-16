import React, { createContext, useContext, useState, ReactNode } from 'react';
import { networks, defaultNetwork } from '@/lib/ethers';

export type NetworkKey = 'pulsechain' | 'ethereum';

interface NetworkContextType {
  currentNetwork: NetworkKey;
  setNetwork: (network: NetworkKey) => void;
  networkName: string;
  nativeCurrencySymbol: string;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkKey>('pulsechain');

  const setNetwork = (network: NetworkKey) => {
    setCurrentNetwork(network);
  };

  const networkName = networks[currentNetwork].name;
  const nativeCurrencySymbol = networks[currentNetwork].nativeCurrency.symbol;

  return (
    <NetworkContext.Provider 
      value={{ 
        currentNetwork, 
        setNetwork, 
        networkName,
        nativeCurrencySymbol
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}