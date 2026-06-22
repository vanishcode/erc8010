# ERC-8010 Demo — Pre-delegated Signature Verification

Interactive demo showcasing **ERC-8010**: verifying signatures for EIP-7702 delegated accounts, before the delegation transaction is even mined.

## What is ERC-8010?

ERC-8010 defines a standardized **signature wrapper format** and **off-chain verification procedure** for pre-delegation signatures. It solves the problem: "How do I verify a signature signed by an EOA, meant to be validated by a contract the EOA *hasn't delegated to yet*?"

The key insight: wrap the inner signature with the EIP-7702 authorization tuple and a 32-byte MAGIC marker. Verifiers detect the MAGIC, simulate delegation via `eth_call`, and validate the signature atomically — all before any on-chain transaction.

- **Spec**: [ERC-8010](https://github.com/ethereum/ERCs/pull/1186)
- **Depends on**: [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702), [ERC-1271](https://eips.ethereum.org/EIPS/eip-1271), [ERC-6492](https://eips.ethereum.org/EIPS/eip-6492)
- **Status**: Draft

## Project Structure

```
erc8010/
├── contracts/              # Foundry project (Solidity)
│   ├── src/                # Smart contracts
│   ├── test/               # Unit + integration tests
│   └── script/             # Deploy scripts
├── app/                    # Next.js 16 App Router
│   ├── page.tsx            # Landing page
│   ├── demo/page.tsx       # 5-step interactive demo
│   └── explain/page.tsx    # Technical deep-dive
├── components/             # shadcn/ui components
├── lib/                    # Utilities (wagmi config, ERC-8010 utils)
└── doc/PLAN.md             # Detailed implementation plan
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.28 + Foundry (Prague EVM) |
| Chain Interaction | viem, wagmi v3 |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| UI Components | shadcn/ui (Base UI) |

## Getting Started

### Prerequisites

- Node.js 20+
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### 1. Install dependencies

```bash
npm install
```

### 2. Run smart contract tests

```bash
cd contracts
forge test -vvv
```

### 3. Start local Anvil (Prague hardfork)

```bash
anvil --hardfork prague
```

### 4. Deploy contracts (local)

```bash
cd contracts
PRIVATE_KEY=<anvil_private_key> forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545
```

### 5. Start the frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Run the demo

1. Connect your wallet
2. Navigate to **/demo**
3. Follow the 5-step flow:

- **Step 1**: Sign a message with your EOA
- **Step 2**: Sign an EIP-7702 authorization and build the ERC-8010 wrapper
- **Step 3**: Verify the wrapped signature off-chain (viem simulates delegation)
- **Step 4**: Execute the delegation transaction on-chain
- **Step 5**: Verify the same signature again (now via direct ERC-1271)

## ERC-8010 Signature Format

```
wrapped = inner_signature || context || context_length || MAGIC

MAGIC = 0x8010801080108010801080108010801080108010801080108010801080108010
```

## License

MIT

Built with [viem](https://viem.sh), [wagmi](https://wagmi.sh), [Next.js](https://nextjs.org), and [Foundry](https://book.getfoundry.sh).
