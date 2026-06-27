# Getting Started

This guide details how to set up the local environment, compile the smart contracts, deploy them locally, and run the ERC-8010 Next.js frontend.

## Prerequisites

- **Node.js**: Version 20+
- **Foundry**: Installed (for Solidity compiling, Anvil development node, and testing)

---

## Installation & Setup

### 1. Install Dependencies

Install the project dependencies for the Next.js frontend:

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (you can copy `.env.example` as a starting point):

```bash
cp .env.example .env
```

Key environment variables:
- `NEXT_PUBLIC_DEMO_PRIVATE_KEY`: A private key with some funds on the local network (or Sepolia) used as the preset account for the demo.
- `NEXT_PUBLIC_MEGAETH_RPC`: MegaETH testnet RPC URL (defaults to public endpoint if omitted).
- `NEXT_PUBLIC_VALIDATOR_ADDRESS`: The deployed address of the `SessionKeyValidator` contract.

---

## Build & Run Commands

### Next.js Frontend

```bash
# Run Next.js in development mode
npm run dev

# Build the application for production
npm run build

# Run ESLint check
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### Foundry Smart Contracts

Navigate to the `contracts` directory to manage Solidity development:

```bash
cd contracts

# Compile Solidity contracts
forge build

# Run all unit and integration tests (verbose output)
forge test -vvv

# Run a specific test
forge test --match-test <TestName> -vvv
```

---

## Local Development & Deployment

To run the full interactive demo, you must run a local Anvil node configured with the **Prague** EVM hardfork (required for EIP-7702):

### 1. Start Anvil

```bash
anvil --hardfork prague
```

### 2. Deploy Contracts

With Anvil running, deploy the demo smart contracts using the deployment script:

```bash
cd contracts
PRIVATE_KEY=<anvil_private_key> forge script script/Deploy.s.sol --broadcast --rpc-url http://127.0.0.1:8545
```

Once deployed, copy the address of the deployed `SessionKeyValidator` contract and set it as `NEXT_PUBLIC_VALIDATOR_ADDRESS` in your `.env` file.
