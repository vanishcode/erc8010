import {
  concat,
  decodeAbiParameters,
  encodeAbiParameters,
  encodeFunctionData,
  parseAbiParameters,
  recoverAddress,
  size,
  slice,
  toHex,
  type Hex,
  type PublicClient,
  type Address,
} from "viem";
import type { Authorization } from "viem";

/**
 * The ERC-8010 MAGIC marker: 32 bytes of repeating 0x8010.
 */
export const ERC8010_MAGIC: Hex =
  "0x8010801080108010801080108010801080108010801080108010801080108010";

/**
 * Wrap an inner signature with ERC-8010 context.
 *
 * Format:
 *   wrapped = inner_signature || context || context_length || MAGIC
 */
export function wrapErc8010Signature({
  innerSignature,
  authorization,
  initTo = "0x0000000000000000000000000000000000000000",
  initData = "0x",
}: {
  innerSignature: Hex;
  authorization: Authorization;
  initTo?: Hex;
  initData?: Hex;
}): Hex {
  const authBytes = encodeAbiParameters(
    parseAbiParameters(
      "uint256 chainId, address delegate, uint256 nonce, uint8 yParity, bytes32 r, bytes32 s"
    ),
    [
      BigInt(authorization.chainId ?? 0),
      authorization.address,
      BigInt(authorization.nonce ?? 0),
      authorization.yParity ?? 0,
      authorization.r ?? "0x",
      authorization.s ?? "0x",
    ]
  );

  const context = encodeAbiParameters(
    parseAbiParameters("bytes auth, address initTo, bytes initData"),
    [authBytes, initTo, initData]
  );

  const contextLen = size(context);
  const ctxLenBytes = toHex(contextLen, { size: 4 });

  return concat([innerSignature, context, ctxLenBytes, ERC8010_MAGIC]);
}

/**
 * Parsed ERC-8010 wrapped signature components.
 */
export type ParsedErc8010Signature = {
  innerSignature: Hex;
  authorization: Authorization;
  initTo: Hex;
  initData: Hex;
};

/**
 * Parse an ERC-8010 wrapped signature back into its components.
 *
 * Format: inner_sig || context || context_len (4 bytes) || MAGIC (32 bytes)
 * context = abi.encode(auth_bytes, initTo, initData)
 */
export function parseErc8010Signature(
  wrappedSignature: Hex
): ParsedErc8010Signature | null {
  // Check for MAGIC marker at the end
  const magicEnd = slice(wrappedSignature, -32);
  if (magicEnd !== ERC8010_MAGIC) return null;

  // Read context_length (4 bytes big-endian, right before MAGIC)
  const ctxLenHex = slice(wrappedSignature, -36, -32); // 4 bytes before MAGIC
  const ctxLen = parseInt(ctxLenHex, 16);

  // Extract context bytes
  const ctxStart = size(wrappedSignature) - 36 - ctxLen;
  const ctxEnd = ctxStart + ctxLen;
  const context = slice(wrappedSignature, ctxStart, ctxEnd);

  // Extract inner signature
  const innerSignature = slice(wrappedSignature, 0, ctxStart);

  // Parse context: (bytes auth, address initTo, bytes initData)
  const [authBytes, initTo, initData] = decodeAbiParameters(
    parseAbiParameters("bytes auth, address initTo, bytes initData"),
    context
  );

  // Parse auth: (uint256 chainId, address delegate, uint256 nonce, uint8 yParity, bytes32 r, bytes32 s)
  const [chainId, delegate, nonce, yParity, r, s] = decodeAbiParameters(
    parseAbiParameters(
      "uint256 chainId, address delegate, uint256 nonce, uint8 yParity, bytes32 r, bytes32 s"
    ),
    authBytes
  );

  const authorization: Authorization = {
    chainId: Number(chainId),
    address: delegate,
    nonce: Number(nonce),
    yParity: Number(yParity),
    r,
    s,
  };

  return { innerSignature, authorization, initTo, initData };
}

/**
 * Verify an ERC-8010 wrapped signature off-chain.
 *
 * Pre-delegation: simulates EIP-7702 delegation via eth_call with
 * authorizationList, then calls isValidSignature atomically.
 *
 * Post-delegation: calls isValidSignature directly on the delegated account.
 */
export async function verifyErc8010Signature(
  client: PublicClient,
  {
    address,
    hash,
    wrappedSignature,
  }: {
    address: Address;
    hash: Hex;
    wrappedSignature: Hex;
  }
): Promise<boolean> {
  const parsed = parseErc8010Signature(wrappedSignature);
  if (!parsed) {
    // Not an ERC-8010 signature — fall back to standard ECDSA
    return client.verifyHash({ address, hash, signature: wrappedSignature });
  }

  const { innerSignature, authorization } = parsed;

  // Encode the isValidSignature call
  const data = encodeFunctionData({
    abi: [
      {
        name: "isValidSignature",
        type: "function",
        inputs: [
          { name: "hash", type: "bytes32" },
          { name: "signature", type: "bytes" },
        ],
        outputs: [{ name: "magicValue", type: "bytes4" }],
      },
    ],
    functionName: "isValidSignature",
    args: [hash, innerSignature],
  });

  // First try: simulate delegation via eth_call with authorizationList.
  // This is the pre-delegation ERC-8010 path.
  try {
    const { data: result } = await client.call({
      to: address,
      data,
      authorizationList: [authorization],
    } as Parameters<typeof client.call>[0]);
    if (result === "0x1626ba7e") return true;
  } catch {
    // Pre-delegation simulation failed.
    // The account might already be delegated — try direct call (ERC-1271 path).
  }

  // Second try: direct isValidSignature call (post-delegation ERC-1271 path).
  try {
    const valid = await client.verifyHash({
      address,
      hash,
      signature: innerSignature,
    });
    return valid;
  } catch {
    return false;
  }
}

/**
 * Verify a signature using pure ECDSA public key recovery — 100% off-chain.
 *
 * Recovers the signer's address from the message hash and ECDSA signature,
 * then compares it with the expected address. No chain interaction needed.
 *
 * This serves as a baseline comparison against ERC-8010 and ERC-1271
 * verification which both require chain interaction.
 *
 * @param hash - The EIP-191 message hash (from hashMessage).
 * @param signature - Raw 65-byte ECDSA signature (the inner_signature).
 * @param expectedAddress - The address that should have signed the message.
 * @returns Object with `valid` (whether addresses match) and `recoveredAddress`.
 */
export async function verifyEcdsaRecovery({
  hash,
  signature,
  expectedAddress,
}: {
  hash: Hex;
  signature: Hex;
  expectedAddress: Address;
}): Promise<{ valid: boolean; recoveredAddress: Address }> {
  const recovered = await recoverAddress({ hash, signature });
  return {
    valid: recovered.toLowerCase() === expectedAddress.toLowerCase(),
    recoveredAddress: recovered,
  };
}
