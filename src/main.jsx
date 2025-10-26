import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import '@mysten/dapp-kit/dist/index.css'
import '@radix-ui/themes/styles.css'

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Theme } from '@radix-ui/themes'
import { networkConfig } from './config/networkConfig'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Theme appearance="light">
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
          <WalletProvider autoConnect>
            <App />
            <Toaster position="bottom-right" />
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </Theme>
  </StrictMode>,
)
