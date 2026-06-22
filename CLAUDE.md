# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ERC-8010 interactive demo showcasing **pre-delegation signature verification** for EIP-7702 delegated accounts. ERC-8010 defines a standardized signature wrapper format (`inner_sig || context || context_len || MAGIC`) that allows off-chain verification of signatures signed by an EOA before the EIP-7702 delegation transaction is mined.

- **Spec**: [ERC-8010](https://github.com/ethereum/ERCs/pull/1186)
- **Key dependencies**: EIP-7702 (delegation), ERC-1271 (contract signature validation), ERC-6492 (pre-deploy verification)
- **Status**: Draft

## Build & Run Commands

```bash
# Frontend
npm install               # Install dependencies
npm run dev               # Start Next.js dev server (port 3000)
npm run build             # Production build
npm run lint              # ESLint

# Smart Contracts
cd contracts
forge build               # Compile contracts
forge test -vvv           # Run all tests with verbose output
forge test --match-test <TestName> -vvv   # Run a single test

# Local development (needed for full demo flow)
anvil --hardfork prague   # Requires Prague EVM hardfork for EIP-7702
```

### Deploy contracts to local Anvil

```bash
cd contracts
PRIVATE_KEY=<anvil_private_key> forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545
```

## Architecture

```
erc8010/
├── contracts/            # Foundry project (Solidity 0.8.28, Prague EVM)
│   ├── src/              # SessionKeyValidator.sol, SessionKeyInitializer.sol
│   ├── test/             # Erc8010Verification, SessionKeyValidator, Eip7702Delegation tests
│   └── script/           # Deploy.s.sol
├── app/                  # Next.js 16 App Router
│   ├── page.tsx          # Landing page
│   ├── demo/page.tsx     # Core 5-step interactive demo (all client-side)
│   ├── explain/page.tsx  # Technical deep-dive
│   ├── layout.tsx        # Root layout with Providers + Navbar
│   └── providers.tsx     # ThemeProvider + I18nProvider + TooltipProvider + Toaster
├── components/           # shadcn/ui (Base UI) components + custom components
├── lib/
│   ├── erc8010.ts        # Core ERC-8010 logic: wrap, parse, verify
│   ├── account.ts        # Demo account from env, viem client factory
│   ├── chains.ts         # Chain definitions (MegaETH testnet, etc.)
│   ├── i18n/             # Internationalization (en/zh dictionaries)
│   └── utils.ts          # cn() helper (clsx + tailwind-merge)
└── doc/PLAN.md           # Detailed implementation plan
```

### Core concepts

- **ERC-8010 signature format**: `inner_signature || context || context_length || MAGIC` where MAGIC is `0x80108010...` (32 bytes of repeating 0x8010). Context encodes the EIP-7702 authorization tuple + init data.
- **`lib/erc8010.ts`** is the central utility module — contains `wrapErc8010Signature()`, `parseErc8010Signature()`, `verifyErc8010Signature()`, and `verifyEcdsaRecovery()`. The verify function uses a two-try strategy: first attempting pre-delegation simulation via `eth_call` with `authorizationList`, then falling back to direct ERC-1271 if the account is already delegated.
- **Smart contracts**: `SessionKeyValidator.sol` implements ERC-1271 and validates signatures from authorized session keys. Uses `address(this)` as the delegator identifier — when called via EIP-7702 delegation (delegatecall), `address(this)` equals the EOA, enabling per-delegator session key storage.
- **No wallet connection needed**: The demo uses a preset private key (`NEXT_PUBLIC_DEMO_PRIVATE_KEY` in `.env`) with viem's `privateKeyToAccount` for all operations (signing, authorization, sending transactions).

### Smart contract design

`SessionKeyValidator.sol` — the delegate target contract:
- `authorizeSessionKey(sessionKey, expiry)` / `revokeSessionKey(sessionKey)` — manage which session keys can sign
- `isValidSignature(bytes32 hash, bytes calldata signature)` — ERC-1271: decodes `(address sessionKey, bytes ecdsaSig)`, checks authorization/expiry, recovers signer, returns `0x1626ba7e` or `0xffffffff`
- Storage: `mapping(address delegator => mapping(address sessionKey => uint256 expiry))`
- Uses `ecrecover` precompile (inline assembly) for ECDSA recovery

`SessionKeyInitializer.sol` — atomically initializes session keys during the delegation transaction (demonstrates `init_to`/`init_data` in the ERC-8010 context).

### Foundry config

- Solidity 0.8.28, Prague EVM, via_ir enabled, optimizer on
- Tests use Foundry's EIP-7702 cheatcodes

### Tech stack

| Layer | Technology |
|-------|-----------|
| Chain Interaction | viem ^2.53 (has built-in ERC-8010 `verifyHash` support) |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| UI | shadcn/ui (Base UI + class-variance-authority), lucide-react |
| State | @tanstack/react-query (via sonner for toasts) |
| i18n | Custom light-weight context + dictionary pattern (en/zh) |
| Theming | next-themes (class strategy, system default) |

### Routes

- `/` — Landing page with hero and intro
- `/demo` — 5-step interactive demo (sign → wrap → verify pre-delegation → execute delegation → verify post-delegation) plus ECDSA comparison
- `/explain` — Technical deep-dive page

### Environment variables

See `.env.example`. Key variables:
- `NEXT_PUBLIC_DEMO_PRIVATE_KEY` — demo account private key (required for the demo to function)
- `NEXT_PUBLIC_MEGAETH_RPC` — MegaETH testnet RPC URL (defaults to public endpoint)
- `NEXT_PUBLIC_VALIDATOR_ADDRESS` — deployed SessionKeyValidator address
