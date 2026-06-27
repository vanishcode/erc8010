# Technology Stack & Dependencies

This document highlights the technical choices and library versions locked in the repository.

---

## Core Technologies

| Layer | Technology | Selection Rationale |
|------|------|----------|
| **Chain Layer** | Local Anvil / Sepolia / MegaETH Testnet | Support for Prague EVM and EIP-7702 code delegation. |
| **Smart Contracts** | Solidity 0.8.28 + Foundry | Prague EVM support, compiler performance, built-in EIP-7702 cheatcodes. |
| **Blockchain SDK** | viem v2 | Outstanding TypeScript ergonomics, lightweight build size, and built-in ERC-8010/EIP-7702 helper methods (managed by the standard author). |
| **Web3 Hooks** | wagmi v3 | Deeply integrated with viem for account connections, transaction workflows, and signing. |
| **Frontend Framework** | Next.js 16 | React 19 compatibility, fast Server Components rendering, and Tailwind CSS v4 styling support. |
| **UI Components** | shadcn/ui + Radix UI | Clean, tailorable pre-built components that conform fully to accessibility standards. |
| **Styling** | Tailwind CSS v4 | Class-first styling utility built directly into modern bundlers. |

---

## Dependency Versions

The following package versions are locked in the workspace to guarantee build consistency:

| Package | Version | Description |
|---------|---------|-------------|
| `next` | `^16.2.9` | Next.js 16 Web Framework |
| `react` / `react-dom` | `^19.2.0` | React 19 Runtime |
| `typescript` | `^5.7` | Type safety tooling |
| `wagmi` | `^3.6.17` | React hooks for Ethereum |
| `viem` | `^2.53.1` | Low-level Ethereum library |
| `@tanstack/react-query` | `^5.x` | Server state synchronization |
| `tailwindcss` | `^4.x` | CSS styling engine |
| `lucide-react` | `latest` | Vector icon asset library |
| `next-themes` | `latest` | Dark mode and theme manager |
| `solc` | `0.8.28` | Solidity Compiler version in Foundry |
