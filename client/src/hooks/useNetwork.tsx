import React, { createContext, useContext, useState, ReactNode } from 'react';
import { networks } from '../lib/ethers';

type NetworkType = 'pulsechain' | 'ethereum';

interface NetworkContextType {
  networkKey: NetworkType;
  setNetworkKey: (network: NetworkType) => void;
  networkConfig: typeof networks.pulsechain;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  // Default to PulseChain
  const [networkKey, setNetworkKey] = useState<NetworkType>('pulsechain');

  // Get the active network config
  const networkConfig = networks[networkKey];

  return (
    <NetworkContext.Provider
      value={{
        networkKey,
        setNetworkKey,
        networkConfig
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
  
  return {
    network: context.networkKey,
    setNetwork: context.setNetworkKey,
    networkConfig: context.networkConfig
  };
}