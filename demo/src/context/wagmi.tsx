'use client';

// import { wagmiAdapter, projectId } from '@/config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { mainnet, arbitrum, avalanche, base, optimism, polygon } from '@reown/appkit/networks';
import React, { type ReactNode } from 'react';
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi';
import { reownProjectId } from '@/config/env';
import { wagmiAdapter } from '@/config/wc';

// Set up queryClient
const queryClient = new QueryClient();

if (!reownProjectId) {
  throw new Error('Project ID is not defined');
}

// Set up metadata
export const appKitMetadata = {
  name: 'appkit-example-scroll',
  description: 'AppKit Example - Scroll',
  url: 'https://scrollapp.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Create the modal
export const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  projectId: reownProjectId,
  networks: [mainnet, arbitrum, avalanche, base, optimism, polygon],
  defaultNetwork: mainnet,
  metadata: appKitMetadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
  customWallets: [{
    id: 'labyrinthWallet',
    name: 'Labyrinth wallet',
    homepage: 'http://localhost:3001/',
    image_url: '',
    mobile_link: '',
    desktop_link: '',
    webapp_link: 'http://localhost:3001/',
    app_store: '',
    play_store: '',
  }]
});

function ContextProvider({ children, cookies }: { children: ReactNode; cookies: string | null }) {
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
