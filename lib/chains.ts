import { defineChain, type Chain } from "viem";

/**
 * MegaETH Testnet — chain ID 6343.
 * Not yet in viem's built-in chain list, so we define it manually.
 */
export const megaethTestnet = defineChain({
  id: 6343,
  name: "MegaETH Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_MEGAETH_RPC || "https://carrot.megaeth.com/rpc",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "MegaETH Explorer",
      url: "https://testnet-mega.etherscan.io",
    },
  },
  testnet: true,
});

/** All supported chains. */
export const SUPPORTED_CHAINS = [megaethTestnet] as const;

/** Default chain used by the demo. */
export const DEFAULT_CHAIN: Chain = megaethTestnet;

/** Resolve a chain by its numeric ID. */
export function getChainById(id: number): Chain | undefined {
  return SUPPORTED_CHAINS.find((c) => c.id === id);
}
