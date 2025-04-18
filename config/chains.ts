import { Chain } from 'wagmi';

export const pulsechain: Chain = {
  id: 369, // Pulsechain mainnet chainId
  name: 'PulseChain',
  network: 'pulsechain',
  nativeCurrency: { name: 'PLS', symbol: 'PLS', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.pulsechain.com'] } },
  blockExplorers: { default: { name: 'PulseScan', url: 'https://scan.pulsechain.com' } }
};