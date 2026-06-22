import {
  createPublicClient,
  createWalletClient,
  http,
  type Chain,
  type Hex,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { DEFAULT_CHAIN, getChainById, SUPPORTED_CHAINS } from "./chains";

// ── Private key ──────────────────────────────────────────────

const PK = (process.env.NEXT_PUBLIC_DEMO_PRIVATE_KEY || "0x3e5804dd190fb312e1a8ac104ad31271980b1692bf973f1fc552eacd409ecb3b") as Hex;

/**
 * The preset demo account derived from NEXT_PUBLIC_DEMO_PRIVATE_KEY.
 * Returns `null` when the env var is not set.
 */
export const demoAccount: PrivateKeyAccount | null = PK
  ? privateKeyToAccount(PK)
  : null;

// ── Active chain (mutable for runtime chain switching) ──────

let _activeChain: Chain = DEFAULT_CHAIN;

/** The currently active chain. */
export function getActiveChain(): Chain {
  return _activeChain;
}

/** Switch to a different supported chain by ID. */
export function switchChain(chainId: number): Chain {
  const chain = getChainById(chainId);
  if (!chain) throw new Error(`Unsupported chain ID: ${chainId}`);
  _activeChain = chain;
  return chain;
}

function rpcUrl(chain: Chain): string {
  return chain.rpcUrls.default.http[0];
}

// ── Public client ───────────────────────────────────────────

/**
 * Get a viem PublicClient for the currently active chain.
 * Re-created on each call so chain switches take effect immediately.
 */
export function getPublicClient(): PublicClient {
  return createPublicClient({
    chain: _activeChain,
    transport: http(rpcUrl(_activeChain)),
  });
}

// ── Wallet client ───────────────────────────────────────────

/**
 * Get a viem WalletClient for the currently active chain.
 * Returns `null` when NEXT_PUBLIC_DEMO_PRIVATE_KEY is not set.
 */
export function getWalletClient(): WalletClient | null {
  if (!demoAccount) return null;
  return createWalletClient({
    account: demoAccount,
    chain: _activeChain,
    transport: http(rpcUrl(_activeChain)),
  });
}

// ── Re-exports ──────────────────────────────────────────────

export { SUPPORTED_CHAINS, DEFAULT_CHAIN };
