"use client";

import { useState } from "react";
import { hashMessage, type Authorization, type Hex } from "viem";
import {
  demoAccount,
  getPublicClient,
  getWalletClient,
  getActiveChain,
} from "@/lib/account";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Copy,
  ExternalLink,
  Play,
  Loader2,
  ShieldCheck,
  Code,
  Layers,
} from "lucide-react";
import { wrapErc8010Signature, verifyErc8010Signature, verifyEcdsaRecovery } from "@/lib/erc8010";
import { useTranslation } from "@/lib/i18n/hooks";

// SessionKeyValidator deployed address
const FALLBACK_VALIDATOR = "0x5615dEB798BB3E4dFa0139dFa1b3D433Cc23b72f";
const VALIDATOR_ADDRESS =
  (process.env.NEXT_PUBLIC_VALIDATOR_ADDRESS as Hex) || FALLBACK_VALIDATOR;

export default function DemoPage() {
  const { t } = useTranslation();
  const STEPS = t.demo.steps;

  const address = demoAccount?.address ?? null;
  const isReady = demoAccount !== null;

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [message, setMessage] = useState("Hello ERC-8010!");
  const [innerSig, setInnerSig] = useState<Hex | null>(null);

  // Step 2 state
  const [authorization, setAuthorization] = useState<Authorization | null>(
    null
  );
  const [wrappedSig, setWrappedSig] = useState<Hex | null>(null);

  // Step 3 state
  const [preVerifyResult, setPreVerifyResult] = useState<boolean | null>(null);
  const [preVerifyLoading, setPreVerifyLoading] = useState(false);

  // Step 4 state
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [txLoading, setTxLoading] = useState(false);

  // Step 5 state
  const [postVerifyResult, setPostVerifyResult] = useState<boolean | null>(
    null
  );
  const [postVerifyLoading, setPostVerifyLoading] = useState(false);

  // ECDSA recovery verification
  const [ecdsaVerifyResult, setEcdsaVerifyResult] = useState<boolean | null>(null);
  const [ecdsaVerifyLoading, setEcdsaVerifyLoading] = useState(false);

  // Sign the message
  const handleSign = async () => {
    if (!isReady || !address || !demoAccount) {
      toast.error(t.demo.toast.accountNotConfigured);
      return;
    }
    try {
      const sig = await demoAccount.signMessage({ message });
      setInnerSig(sig);
      setCurrentStep(2);
      toast.success(t.demo.toast.messageSigned);
    } catch (e: unknown) {
      toast.error(
        t.demo.toast.signingFailed(e instanceof Error ? e.message : "Unknown error")
      );
    }
  };

  // Wrap the signature
  const handleWrap = async () => {
    if (!innerSig || !address) {
      toast.error(t.demo.toast.missingSig);
      return;
    }

    const walletClient = getWalletClient();
    if (!walletClient || !demoAccount) {
      toast.error(t.demo.toast.walletNotAvailable);
      return;
    }

    const publicClient = getPublicClient();

    try {
      // Sign an EIP-7702 authorization using the preset account
      const auth = await walletClient.signAuthorization({
        account: demoAccount,
        contractAddress: VALIDATOR_ADDRESS,
        chainId: publicClient.chain?.id ?? getActiveChain().id,
      });
      setAuthorization(auth);

      // Build the ERC-8010 wrapped signature
      const wrapped = wrapErc8010Signature({
        innerSignature: innerSig,
        authorization: auth,
      });
      setWrappedSig(wrapped);

      setCurrentStep(3);
      toast.success(t.demo.toast.signatureWrapped);
    } catch (e: unknown) {
      console.log(e)
      toast.error(
        t.demo.toast.wrappingFailed(e instanceof Error ? e.message : "Unknown error")
      );
    }
  };

  // Verify off-chain (pre-delegation)
  const handlePreVerify = async () => {
    if (!wrappedSig || !address) return;

    const publicClient = getPublicClient();

    setPreVerifyLoading(true);
    try {
      const hash = hashMessage(message);
      const valid = await verifyErc8010Signature(publicClient, {
        address,
        hash,
        wrappedSignature: wrappedSig,
      });
      setPreVerifyResult(valid);
      if (valid) {
        setCurrentStep(4);
        toast.success(t.demo.toast.verifiedSimulation);
      } else {
        toast.error(t.demo.toast.verificationFailed);
      }
    } catch (e: unknown) {
      setPreVerifyResult(false);
      toast.error(
        t.demo.toast.verificationError(e instanceof Error ? e.message : "Unknown error")
      );
    } finally {
      setPreVerifyLoading(false);
    }
  };

  // Execute delegation on-chain
  const handleDelegate = async () => {
    if (!authorization || !address) return;

    const walletClient = getWalletClient();
    if (!walletClient || !demoAccount) return;

    const publicClient = getPublicClient();

    setTxLoading(true);
    try {
      const hash = await walletClient.sendTransaction({
        account: demoAccount,
        chain: getActiveChain(),
        to: address,
        authorizationList: [authorization],
        value: 0n,
      });
      setTxHash(hash);

      // Wait for receipt
      await publicClient.waitForTransactionReceipt({ hash });
      setCurrentStep(5);
      toast.success(t.demo.toast.delegationExecuted);
    } catch (e: unknown) {
      toast.error(
        t.demo.toast.delegationFailed(e instanceof Error ? e.message : "Unknown error")
      );
    } finally {
      setTxLoading(false);
    }
  };

  // Verify post-delegation
  const handlePostVerify = async () => {
    if (!wrappedSig || !address) return;

    const publicClient = getPublicClient();

    setPostVerifyLoading(true);
    try {
      const hash = hashMessage(message);
      const valid = await verifyErc8010Signature(publicClient, {
        address,
        hash,
        wrappedSignature: wrappedSig,
      });
      setPostVerifyResult(valid);
      if (valid) {
        toast.success(t.demo.toast.stillValid);
      } else {
        toast.error(t.demo.toast.postVerifyFailed);
      }
    } catch (e: unknown) {
      setPostVerifyResult(false);
      toast.error(
        t.demo.toast.verificationError(e instanceof Error ? e.message : "Unknown error")
      );
    } finally {
      setPostVerifyLoading(false);
    }
  };

  // Verify via pure ECDSA recovery (no chain interaction)
  const handleEcdsaVerify = async () => {
    if (!innerSig || !address) return;

    setEcdsaVerifyLoading(true);
    try {
      const hash = hashMessage(message);
      const { valid } = await verifyEcdsaRecovery({
        hash,
        signature: innerSig,
        expectedAddress: address,
      });
      setEcdsaVerifyResult(valid);
      if (valid) {
        toast.success(t.demo.toast.ecdsaVerified);
      } else {
        toast.error(t.demo.toast.ecdsaFailed);
      }
    } catch (e: unknown) {
      setEcdsaVerifyResult(false);
      toast.error(
        t.demo.toast.ecdsaError(e instanceof Error ? e.message : "Unknown error")
      );
    } finally {
      setEcdsaVerifyLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(t.demo.toast.copied(label));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {t.demo.title}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          {t.demo.subtitle}
        </p>
      </div>

      {/* Step Progress */}
      <div className="mb-8 flex items-center gap-2 flex-wrap">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center gap-2">
            <Badge
              variant={currentStep === step.id ? "default" : "outline"}
              className={
                currentStep > step.id
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : currentStep === step.id
                    ? ""
                    : "opacity-50"
              }
            >
              {currentStep > step.id ? (
                <CheckCircle2 className="mr-.5 h-3 w-3" />
              ) : (
                step.id + ". "
              )}
              {step.label}
            </Badge>
            {i < STEPS.length - 1 && (
              <ChevronRight className="h-3 w-3 text-zinc-400 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {!isReady && (
        <Alert className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>{t.demo.notConfiguredTitle}</AlertTitle>
          <AlertDescription>
            {t.demo.notConfiguredDesc1}{" "}
            <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">NEXT_PUBLIC_DEMO_PRIVATE_KEY</code>{" "}
            {t.demo.notConfiguredDesc2}
          </AlertDescription>
        </Alert>
      )}

      {/* Step 1: Sign Message */}
      <Card className={currentStep >= 1 ? "" : "opacity-50"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t.demo.step1Title}</CardTitle>
            <Badge variant="secondary">
              {innerSig ? t.common.done : t.common.pending}
            </Badge>
          </div>
          <CardDescription>
            {t.demo.step1Desc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">{t.demo.messageLabel}</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a message..."
              disabled={!!innerSig}
            />
          </div>

          {innerSig && (
            <div className="space-y-2">
              <Label className="text-xs font-mono text-zinc-500">
                {t.demo.signatureLabel}
              </Label>
              <code className="block rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3 text-xs break-all font-mono">
                {innerSig}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => copyToClipboard(innerSig, "Signature")}
              >
                <Copy className="h-3 w-3" /> {t.common.copy}
              </Button>
            </div>
          )}

          <Button
            onClick={handleSign}
            disabled={!isReady || !!innerSig}
            className="gap-2"
          >
            <Play className="h-4 w-4" />
            {innerSig ? t.demo.signedButton : t.demo.signButton}
          </Button>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      {/* Step 2: Wrap */}
      <Card className={currentStep >= 2 ? "" : "opacity-50"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {t.demo.step2Title}
            </CardTitle>
            <Badge variant="secondary">
              {wrappedSig ? t.common.done : t.common.pending}
            </Badge>
          </div>
          <CardDescription>
            {t.demo.step2Desc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authorization && (
            <div className="space-y-2">
              <Label className="text-xs font-mono text-zinc-500">
                {t.demo.authLabel}
              </Label>
              <code className="block rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3 text-xs break-all font-mono">
                chainId: {authorization.chainId?.toString()}
                {"\n"}delegate: {authorization.address}
                {"\n"}nonce: {authorization.nonce?.toString()}
              </code>
            </div>
          )}

          {wrappedSig && (
            <div className="space-y-3">
              <Label className="text-xs font-mono text-zinc-500">
                {t.demo.wrappedLabel}
              </Label>

              {/* Byte Visualizer */}
              <div className="flex h-8 rounded-lg overflow-hidden text-[10px] font-mono">
                <div
                  className="bg-blue-500 text-white flex items-center justify-center"
                  style={{
                    flex: wrappedSig.length - 2 - 64 * 2 - 8 - 4,
                  }}
                >
                  inner_sig
                </div>
                <div className="bg-amber-500 text-white flex items-center justify-center px-1">
                  ctx
                </div>
                <div
                  className="bg-purple-500 text-white flex items-center justify-center"
                  style={{ flex: 8 }}
                >
                  len
                </div>
                <div
                  className="bg-red-500 text-white flex items-center justify-center"
                  style={{ flex: 64 }}
                >
                  MAGIC
                </div>
              </div>
              <div className="flex gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-blue-500" />
                  inner
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-amber-500" />
                  context
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-purple-500" />
                  length
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded bg-red-500" />
                  MAGIC
                </span>
              </div>

              <code className="block rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3 text-xs break-all font-mono max-h-32 overflow-y-auto">
                {wrappedSig}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs"
                onClick={() =>
                  copyToClipboard(wrappedSig, "Wrapped signature")
                }
              >
                <Copy className="h-3 w-3" /> {t.common.copy}
              </Button>
            </div>
          )}

          <Button
            onClick={handleWrap}
            disabled={!innerSig || !!wrappedSig}
            className="gap-2"
          >
            <Layers className="h-4 w-4" />
            {wrappedSig ? t.demo.wrappedButton : t.demo.wrapButton}
          </Button>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      {/* Step 3: Verify Pre-delegation */}
      <Card className={currentStep >= 3 ? "" : "opacity-50"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {t.demo.step3Title}
            </CardTitle>
            <Badge variant="secondary">
              {preVerifyResult === true ? t.common.valid : t.common.pending}
            </Badge>
          </div>
          <CardDescription>
            {t.demo.step3Desc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {preVerifyLoading && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.demo.simulatingText}
            </div>
          )}

          {preVerifyResult === true && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-300">
                {t.demo.verifiedTitle}
              </AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400 text-sm">
                {t.demo.verifiedDesc}
              </AlertDescription>
            </Alert>
          )}

          {preVerifyResult === false && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>{t.demo.failedTitle}</AlertTitle>
              <AlertDescription>
                {t.demo.failedDesc}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handlePreVerify}
            disabled={!wrappedSig || preVerifyLoading}
            className="gap-2"
          >
            {preVerifyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {preVerifyResult === true ? t.demo.reverify : t.demo.verifyOffChain}
          </Button>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      {/* Step 4: Delegate On-Chain */}
      <Card className={currentStep >= 4 ? "" : "opacity-50"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {t.demo.step4Title}
            </CardTitle>
            <Badge variant="secondary">{txHash ? t.common.done : t.common.pending}</Badge>
          </div>
          <CardDescription>
            {t.demo.step4Desc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {txLoading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.demo.sendingText}
              </div>
              <Progress value={50} className="w-full" />
            </div>
          )}

          {txHash && (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-700 dark:text-blue-300">
                {t.demo.executedTitle}
              </AlertTitle>
              <AlertDescription>
                <code className="block text-xs break-all font-mono mt-1">
                  {txHash}
                </code>
                <Button
                  variant="link"
                  size="sm"
                  className="gap-1 text-xs p-0 h-auto mt-1"
                  onClick={() => {
                    const chain = getActiveChain();
                    const explorerUrl =
                      chain.blockExplorers?.default?.url;
                    if (explorerUrl) {
                      window.open(`${explorerUrl}/tx/${txHash}`, "_blank");
                    }
                  }}
                >
                  <ExternalLink className="h-3 w-3" /> {t.demo.viewExplorer}
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleDelegate}
            disabled={!authorization || txLoading || !!txHash}
            className="gap-2"
          >
            {txLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Code className="h-4 w-4" />
            )}
            {txHash ? t.demo.delegatedButton : t.demo.executeDelegation}
          </Button>
        </CardContent>
      </Card>

      <Separator className="my-4" />

      {/* Step 5: Verify Post-delegation */}
      <Card className={currentStep >= 5 ? "" : "opacity-50"}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {t.demo.step5Title}
            </CardTitle>
            <Badge variant="secondary">
              {postVerifyResult === true
                ? t.common.valid
                : postVerifyResult === false
                  ? t.common.failed
                  : t.common.pending}
            </Badge>
          </div>
          <CardDescription>
            {t.demo.step5Desc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {postVerifyLoading && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.demo.verifyingText}
            </div>
          )}

          {postVerifyResult === true && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-300">
                {t.demo.stillValidTitle}
              </AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400 text-sm">
                {t.demo.stillValidDesc}
              </AlertDescription>
            </Alert>
          )}

          {postVerifyResult === false && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>{t.demo.failedPostTitle}</AlertTitle>
            </Alert>
          )}

          {/* Comparison table */}
          {preVerifyResult === true && postVerifyResult === true && (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">{t.demo.aspect}</th>
                    <th className="px-4 py-2 text-left font-medium">
                      {t.demo.preDelegation}
                    </th>
                    <th className="px-4 py-2 text-left font-medium">
                      {t.demo.postDelegation}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-zinc-200 dark:border-zinc-700">
                    <td className="px-4 py-2 font-medium">{t.demo.path}</td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="text-xs">
                        {t.demo.erc8010Path}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      <Badge variant="outline" className="text-xs">
                        {t.demo.erc1271Path}
                      </Badge>
                    </td>
                  </tr>
                  <tr className="border-t border-zinc-200 dark:border-zinc-700">
                    <td className="px-4 py-2 font-medium">{t.demo.method}</td>
                    <td className="px-4 py-2 text-xs">
                      {t.demo.erc8010Method}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {t.demo.erc1271Method}
                    </td>
                  </tr>
                  <tr className="border-t border-zinc-200 dark:border-zinc-700">
                    <td className="px-4 py-2 font-medium">{t.demo.result}</td>
                    <td className="px-4 py-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 inline" />{" "}
                      valid
                    </td>
                    <td className="px-4 py-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 inline" />{" "}
                      valid
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <Button
            onClick={handlePostVerify}
            disabled={!txHash || postVerifyLoading}
            className="gap-2"
          >
            {postVerifyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {postVerifyResult === true ? t.demo.reverify : t.demo.verifyPostDelegate}
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      {postVerifyResult === true && (
        <>
          <Separator className="my-8" />
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-700 dark:text-green-300 text-lg">
              {t.demo.completeTitle}
            </AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-400">
              {t.demo.completeDesc}
            </AlertDescription>
          </Alert>
        </>
      )}

      {/* ECDSA Recovery Verification — third method, pure off-chain */}
      <Separator className="my-8" />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {t.demo.comparisonTitle}
            </CardTitle>
            <Badge variant="secondary">
              {ecdsaVerifyResult === true
                ? t.common.valid
                : ecdsaVerifyResult === false
                  ? t.common.failed
                  : t.common.pending}
            </Badge>
          </div>
          <CardDescription>
            {t.demo.comparisonDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ecdsaVerifyLoading && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t.demo.recoveringText}
            </div>
          )}

          {ecdsaVerifyResult === true && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700 dark:text-green-300">
                {t.demo.ecdsaSuccessTitle}
              </AlertTitle>
              <AlertDescription className="text-green-600 dark:text-green-400 text-sm">
                {t.demo.ecdsaSuccessDesc}
              </AlertDescription>
            </Alert>
          )}

          {ecdsaVerifyResult === false && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>{t.demo.ecdsaFailedTitle}</AlertTitle>
              <AlertDescription>
                {t.demo.ecdsaFailedDesc}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleEcdsaVerify}
            disabled={!innerSig || ecdsaVerifyLoading}
            className="gap-2"
          >
            {ecdsaVerifyLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            {ecdsaVerifyResult === true
              ? t.demo.reverify
              : t.demo.verifyEcdsa}
          </Button>

          {/* Three-way comparison table */}
          {preVerifyResult === true &&
            postVerifyResult === true &&
            ecdsaVerifyResult === true && (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-900">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">
                        {t.demo.aspect}
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        {t.demo.ecdsaPath}
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        {t.demo.erc8010Path}
                        <br />
                        ({t.demo.preDelegation})
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        {t.demo.erc1271Path}
                        <br />
                        ({t.demo.postDelegation})
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-zinc-200 dark:border-zinc-700">
                      <td className="px-4 py-2 font-medium">{t.demo.path}</td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs">
                          {t.demo.ecdsaPath}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs">
                          {t.demo.erc8010Path}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs">
                          {t.demo.erc1271Path}
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-t border-zinc-200 dark:border-zinc-700">
                      <td className="px-4 py-2 font-medium">{t.demo.method}</td>
                      <td className="px-4 py-2 text-xs">
                        {t.demo.ecdsaMethod}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {t.demo.erc8010Method}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {t.demo.erc1271Method}
                      </td>
                    </tr>
                    <tr className="border-t border-zinc-200 dark:border-zinc-700">
                      <td className="px-4 py-2 font-medium">{t.demo.onChain}</td>
                      <td className="px-4 py-2 text-xs">{t.demo.ecdsaOnChain}</td>
                      <td className="px-4 py-2 text-xs">
                        {t.demo.erc8010OnChain}
                      </td>
                      <td className="px-4 py-2 text-xs">{t.demo.erc1271OnChain}</td>
                    </tr>
                    <tr className="border-t border-zinc-200 dark:border-zinc-700">
                      <td className="px-4 py-2 font-medium">{t.demo.verifies}</td>
                      <td className="px-4 py-2 text-xs">
                        {t.demo.ecdsaVerifies}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {t.demo.erc8010Verifies}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        {t.demo.erc1271Verifies}
                      </td>
                    </tr>
                    <tr className="border-t border-zinc-200 dark:border-zinc-700">
                      <td className="px-4 py-2 font-medium">{t.demo.result}</td>
                      <td className="px-4 py-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />{" "}
                        valid
                      </td>
                      <td className="px-4 py-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />{" "}
                        valid
                      </td>
                      <td className="px-4 py-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />{" "}
                        valid
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
