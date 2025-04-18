import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { WagmiConfig, createClient, configureChains, mainnet } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { pulsechain } from '../config/chains';

const { chains, provider, webSocketProvider } = configureChains(
  [mainnet, pulsechain],
  [publicProvider()]
);

const client = createClient({
  autoConnect: true,
  provider,
  webSocketProvider
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig client={client}>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header chains={chains} />
          <main className="p-6 bg-gray-50 flex-1 overflow-auto">
            <Component {...pageProps} />
          </main>
        </div>
      </div>
    </WagmiConfig>
  );
}