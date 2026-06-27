# ERC-8010 Demo — Pre-delegated Signature Verification

Interactive demo showcasing **ERC-8010**: verifying signatures for EIP-7702 delegated accounts, before the delegation transaction is even mined.

---

## What is ERC-8010?

ERC-8010 defines a standardized **signature wrapper format** and **off-chain verification procedure** for pre-delegation signatures. It solves the problem: *"How do I verify a signature signed by an EOA, meant to be validated by a contract the EOA has not delegated to yet?"*

By wrapping the inner signature with the EIP-7702 authorization tuple and a `MAGIC` marker, verifiers detect the marker, simulate delegation via `eth_call`, and validate the signature atomically off-chain—all before any on-chain delegation transaction occurs.

```text
wrapped_signature = inner_signature || context || context_length || MAGIC
```

---

## Documentation Index

Detailed project specifications, guidelines, and guides have been organized under the `/docs` directory:

* 🚀 **[Getting Started](./docs/getting-started.md)**: Local environment setup, dependencies, local Anvil Prague node configuration, and contract deployment.
* 📐 **[Protocol Specification](./docs/architecture/protocol.md)**: ERC-8010 standard wrapper format, byte layouts, and simulated verification workflows.
* ⛓️ **[Smart Contracts](./docs/architecture/contracts.md)**: Design of `SessionKeyValidator`, storage layouts, ERC-1271 signatures, and Foundry tests.
* 🔄 **[Data Flow & Demo Steps](./docs/architecture/data-flow.md)**: Detailed explanation of the interactive 5-step flow and visual data flow chart.
* 🛠️ **[Technology Stack](./docs/style/tech-stack.md)**: Technical decisions, architecture, and locked dependency versions (Next.js 16, React 19, viem v2).
* 📝 **[Guidelines & Style Guide](./docs/style/guidelines.md)**: Contract naming, TypeScript strict safety rules, and demo design principles.
* 📋 **[Implementation Plan](./docs/PLAN.md)**: Complete development outline and milestone tracking.

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Contract Tests

```bash
cd contracts
forge test -vvv
```

### 3. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## License

MIT
