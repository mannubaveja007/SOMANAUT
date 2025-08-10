"use client"

import { WagmiProvider, createConfig } from "wagmi"
import { mainnet, polygon, optimism, arbitrum } from "wagmi/chains"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"

// Using the provided WalletConnect Project ID
const walletConnectProjectId = "1a728404ebbfc00cd74a8c8b25cc9db1"

const config = createConfig(
  getDefaultConfig({
    appName: "somanaut Game",
    chains: [mainnet, polygon, optimism, arbitrum],
    walletConnectProjectId: walletConnectProjectId,
  }),
)

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider theme="auto" mode="dark">
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
