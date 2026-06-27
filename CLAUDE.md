# CLAUDE.md

This file provides guidance to assistant agents when working within this repository.

## Project Overview

ERC-8010 interactive demo showcasing **pre-delegation signature verification** for EIP-7702 delegated accounts. It allows off-chain signature validation signed by an EOA before its code delegation transaction is mined.

Detailed specifications can be found under the `docs/` directory.

---

## Build & Run Commands

### Frontend (Next.js 16 / React 19)

```bash
npm install        # Install frontend & client dependencies
npm run dev        # Run Next.js in development mode (port 3000)
npm run build      # Compile the web application
npm run lint       # Run ESLint check
```

### Smart Contracts (Solidity 0.8.28 / Foundry)

```bash
cd contracts
forge build        # Compile Solidity contracts
forge test -vvv    # Run unit and integration tests with verbose logging
forge test --match-test <TestName> -vvv # Run a specific test case
```

### Local Development Node (Anvil Prague)

```bash
# EIP-7702 delegation requires the Prague hardfork
anvil --hardfork prague

# Deploy contracts locally
cd contracts
PRIVATE_KEY=<anvil_private_key> forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545
```

---

## Technical Specifications & Guidelines

Please refer to the organized docs in `/docs` for any deeper integration details:

- **Architecture & Protocol**: See [docs/architecture/protocol.md](./docs/architecture/protocol.md) for signature layout.
- **Smart Contracts**: See [docs/architecture/contracts.md](./docs/architecture/contracts.md) for `SessionKeyValidator.sol` and interfaces.
- **Data Flow**: See [docs/architecture/data-flow.md](./docs/architecture/data-flow.md) for the 5-step demo mechanics.
- **Coding Style & Design Rules**: See [docs/style/guidelines.md](./docs/style/guidelines.md) for Solidity, TypeScript, and React conventions.
