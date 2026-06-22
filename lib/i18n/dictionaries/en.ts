import type { Translations } from "../types";

export const en: Translations = {
  common: {
    copy: "Copy",
    copied: "Copied",
    pending: "Pending",
    done: "Done",
    valid: "Valid ✓",
    failed: "Failed ✗",
    loading: "Loading...",
    network: "Network",
  },
  navbar: {
    home: "Home",
    demo: "Demo",
    explain: "Explain",
  },
  home: {
    badge: "Draft ERC-8010",
    title: "Pre-delegated Signature Verification",
    subtitle:
      "Verify EIP-7702 signatures before the delegation transaction is even mined. ERC-8010 wraps your signature with an authorization, letting verifiers simulate delegation atomically.",
    tryDemo: "Try the Demo",
    howItWorks: "How It Works",
    whatIsTitle: "What is ERC-8010?",
    problemTitle: "The Problem",
    problemDesc:
      "EIP-7702 lets EOAs delegate to smart contracts. But what about messages signed before the delegation hits the chain? Standard ERC-1271 and ERC-6492 can't verify them.",
    solutionTitle: "The Solution",
    solutionDesc:
      "ERC-8010 defines a signature wrapper format that bundles an inner signature with the EIP-7702 authorization. A 32-byte MAGIC marker at the end lets verifiers detect it.",
    flowTitle: "The Flow",
    flowDesc:
      "Sign → Wrap → Verify off-chain (via simulated delegation) → Delegate on-chain → Verify again (via real delegation). Same signature, same result.",
    formatTitle: "The ERC-8010 Wrapper Format",
    verificationTitle: "Verification Paths",
    preDelegationBadge: "Pre-delegation",
    preDelegationTitle: "ERC-8010 Path",
    preDelegationDesc:
      "viem detects the MAGIC marker → extracts the authorization → simulates delegation via eth_call with authorization list → calls isValidSignature atomically.",
    postDelegationBadge: "Post-delegation",
    postDelegationTitle: "ERC-1271 Path",
    postDelegationDesc:
      "viem detects the delegation already exists on-chain (0xef0100...) → calls isValidSignature directly. No simulation needed.",
    ctaTitle: "Ready to see it in action?",
    ctaDesc:
      "Sign a message with the preset account, wrap it with ERC-8010, and verify — all in under a minute.",
    ctaButton: "Start the Demo",
    footer: "Built with",
  },
  demo: {
    title: "ERC-8010 Demo",
    subtitle:
      "Walk through the complete pre-delegation signature verification flow.",
    networkLabel: "Network:",
    steps: [
      { id: 1, label: "Sign Message" },
      { id: 2, label: "Wrap with ERC-8010" },
      { id: 3, label: "Verify Off-Chain" },
      { id: 4, label: "Delegate On-Chain" },
      { id: 5, label: "Verify Post-Delegate" },
    ],
    notConfiguredTitle: "Demo account not configured",
    notConfiguredDesc1: "Set",
    notConfiguredDesc2: "in .env to start the demo.",
    step1Title: "Step 1: Sign a Message",
    step1Desc:
      "Sign a message with the preset account. This signature will later be verified by the delegated contract.",
    messageLabel: "Message to sign",
    signatureLabel: "ECDSA Signature (inner_signature)",
    signButton: "Sign Message",
    signedButton: "Signed ✓",
    step2Title: "Step 2: Wrap with ERC-8010",
    step2Desc:
      "Sign an EIP-7702 authorization with the preset account and build the ERC-8010 wrapped signature: inner_sig || context || context_len || MAGIC.",
    authLabel: "EIP-7702 Authorization",
    wrappedLabel: "ERC-8010 Wrapped Signature",
    wrapButton: "Sign Auth & Wrap",
    wrappedButton: "Wrapped ✓",
    step3Title: "Step 3: Verify Off-Chain (Pre-delegation)",
    step3Desc:
      "Verify the wrapped signature using viem's verifyHash. It auto-detects the MAGIC marker and simulates delegation via eth_call.",
    simulatingText: "Simulating delegation and verifying signature...",
    verifiedTitle: "Signature verified via ERC-8010",
    verifiedDesc:
      "viem detected the MAGIC marker, extracted the authorization, simulated delegation via eth_call, and called isValidSignature — all atomically. No on-chain transaction needed.",
    failedTitle: "Verification failed",
    failedDesc:
      "The signature could not be verified. Check that the delegate contract is deployed and the session key is authorized.",
    reverify: "Re-verify",
    verifyOffChain: "Verify Off-Chain",
    step4Title: "Step 4: Execute Delegation On-Chain",
    step4Desc:
      "Send a type-4 transaction with the EIP-7702 authorization list. This sets the EOA's code to 0xef0100 || delegate.",
    sendingText: "Sending delegation transaction...",
    executedTitle: "Delegation executed",
    viewExplorer: "View on Explorer",
    executeDelegation: "Execute Delegation",
    delegatedButton: "Delegated ✓",
    step5Title: "Step 5: Verify Post-Delegation",
    step5Desc:
      "Verify the same wrapped signature again. Now that delegation is on-chain, viem detects the delegation code and uses ERC-1271 directly — no simulation needed.",
    verifyingText: "Verifying signature against delegated account...",
    stillValidTitle: "Signature still valid!",
    stillValidDesc:
      "The exact same wrapped signature validates after delegation. The only difference is the path viem takes: ERC-8010 simulation before, ERC-1271 directly after.",
    failedPostTitle: "Verification failed",
    verifyPostDelegate: "Verify Post-Delegate",
    completeTitle: "Demo Complete!",
    completeDesc:
      "ERC-8010 ensures signatures work before AND after delegation. The same wrapped signature verifies successfully in both scenarios, with viem automatically detecting the right verification path.",
    comparisonTitle: "Comparison: Pure ECDSA Recovery",
    comparisonDesc:
      "The most fundamental verification: recover the signer's public key from the hash + signature using recoverAddress. 100% off-chain — no RPC, no contract, no delegation. Compare this with the ERC-8010 and ERC-1271 paths above.",
    recoveringText: "Recovering signer address from signature...",
    ecdsaSuccessTitle: "ECDSA recovery successful",
    ecdsaSuccessDesc:
      "The recovered signer address matches the demo account. This confirms the message was signed by the expected private key — no chain interaction needed.",
    ecdsaFailedTitle: "ECDSA recovery failed",
    ecdsaFailedDesc:
      "The recovered address does not match the demo account. The signature may be corrupted or signed by a different key.",
    verifyEcdsa: "Verify with ECDSA Recovery",
    aspect: "Aspect",
    path: "Path",
    method: "Method",
    onChain: "On-chain?",
    verifies: "Verifies",
    result: "Result",
    ecdsaPath: "Native ECDSA",
    erc8010Path: "ERC-8010",
    erc1271Path: "ERC-1271",
    ecdsaMethod: "recoverAddress (off-chain)",
    erc8010Method: "eth_call + auth list (simulated)",
    erc1271Method: "Direct isValidSignature call",
    ecdsaOnChain: "No (0 RPC calls)",
    erc8010OnChain: "Simulated (1 eth_call)",
    erc1271OnChain: "Yes (1 eth_call)",
    ecdsaVerifies: "Signer = account holder",
    erc8010Verifies: "Account would accept signature if delegated",
    erc1271Verifies: "Delegated account accepts signature",
    preDelegation: "Pre-delegation",
    postDelegation: "Post-delegation",
    toast: {
      chainSwitched: (name: string) => `Switched to ${name}`,
      accountNotConfigured:
        "Demo account not configured. Set NEXT_PUBLIC_DEMO_PRIVATE_KEY in .env",
      messageSigned: "Message signed",
      signingFailed: (msg: string) => `Signing failed: ${msg}`,
      missingSig: "Missing signature or wallet",
      walletNotAvailable:
        "Wallet client not available. Check NEXT_PUBLIC_DEMO_PRIVATE_KEY.",
      signatureWrapped: "Signature wrapped with ERC-8010",
      wrappingFailed: (msg: string) => `Wrapping failed: ${msg}`,
      verifiedSimulation: "Signature verified via ERC-8010 simulation",
      verificationFailed: "Verification failed",
      verificationError: (msg: string) => `Verification error: ${msg}`,
      delegationExecuted: "Delegation executed on-chain",
      delegationFailed: (msg: string) => `Delegation failed: ${msg}`,
      stillValid: "Same signature, still valid after delegation!",
      postVerifyFailed: "Verification failed post-delegation",
      ecdsaVerified: "ECDSA recovery verified — signer matches demo account",
      ecdsaFailed:
        "ECDSA recovery failed — recovered address does not match",
      ecdsaError: (msg: string) => `ECDSA recovery error: ${msg}`,
      copied: (label: string) => `${label} copied`,
    },
  },
  explain: {
    title: "How ERC-8010 Works",
    subtitle:
      "A deep dive into the signature wrapper format and verification procedure.",
    formatTitle: "Signature Wrapper Format",
    innerSigTitle: "inner_signature",
    innerSigDesc:
      "The original ECDSA signature (or any format the delegate contract expects). Typically 65 bytes.",
    contextTitle: "context",
    contextDesc: "ABI-encoded tuple: (authorization, init_to, init_data)",
    contextItem1:
      "authorization: EIP-7702 signed auth tuple (chain_id, address, nonce, yParity, r, s)",
    contextItem2: "init_to: (optional) initializer contract address",
    contextItem3: "init_data: (optional) initializer calldata",
    lengthTitle: "context_length",
    lengthDesc:
      "4 bytes, uint32 big-endian. The byte-length of the context. Used to parse where the context ends and the MAGIC begins.",
    magicTitle: "MAGIC",
    magicDesc: "32-byte constant:",
    verificationTitle: "Verification Flow",
    standardsTitle: "Related Standards",
    eip7702Title: "EIP-7702 — Set EOA Account Code",
    eip7702Content1:
      "EIP-7702 adds a new transaction type that allows an EOA to set code on its own address in a single transaction. The code is a delegation designation: 0xef0100 || address (23 bytes). When the EOA is called, it delegatecalls into the designated implementation contract.",
    eip7702Content2:
      "This is the foundation that ERC-8010 builds on — without EIP-7702, there would be no pre-delegation signatures to verify.",
    erc1271Title: "ERC-1271 — Standard Signature Validation",
    erc1271Content1:
      "ERC-1271 defines the isValidSignature(bytes32 hash, bytes signature) → bytes4 interface. The delegate contract must implement this so verifiers can check signatures against the delegated EOA.",
    erc1271Content2:
      "ERC-8010 calls isValidSignature after simulating delegation to get the final validation result.",
    erc6492Title: "ERC-6492 — Predeploy Signature Verification",
    erc6492Content1:
      "ERC-6492 handles signatures for contracts that will be deployed via CREATE2 but don't exist yet. ERC-8010 delegates to ERC-6492 as a fallback when no MAGIC marker is detected.",
    erc6492Content2:
      "Together, ERC-6492 + ERC-8010 + ERC-1271 + native EOA verification form a universal signature verification pipeline.",
    viemTitle: "viem — Built-in ERC-8010 Support",
    viemContent:
      "viem (by @jxom, lead author of ERC-8010) has first-class support for ERC-8010. The verifyHash and verifyTypedData actions automatically detect ERC-8010 wrapped signatures and perform the complete verification flow described above.",
  },
};
