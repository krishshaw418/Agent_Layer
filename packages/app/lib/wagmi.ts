import { createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

const dappUrl =
  process.env.NEXT_PUBLIC_DAPP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000'

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'Agent Layer',
        url: dappUrl,
      },
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
  batch: {
    multicall: false,
  },
})