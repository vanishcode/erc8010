"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  FileSignature,
  Layers,
  Zap,
  Code2,
  Play,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/hooks";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:py-20">
      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-6 mb-16">
        <Badge variant="secondary" className="text-xs tracking-wide">
          {t.home.badge}
        </Badge>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight max-w-2xl">
          {t.home.title}
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-xl">
          {t.home.subtitle}
        </p>
        <div className="flex gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-9 px-4 text-sm font-medium"
          >
            <Play className="h-4 w-4" /> {t.home.tryDemo}
          </Link>
          <Link
            href="/explain"
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-background hover:bg-muted h-9 px-4 text-sm font-medium"
          >
            <Code2 className="h-4 w-4" /> {t.home.howItWorks}
          </Link>
        </div>
      </section>

      <Separator className="mb-16" />

      {/* What is ERC-8010 */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-8 text-center">
          {t.home.whatIsTitle}
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <FileSignature className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>{t.home.problemTitle}</CardTitle>
              <CardDescription>
                {t.home.problemDesc}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Layers className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>{t.home.solutionTitle}</CardTitle>
              <CardDescription>
                {t.home.solutionDesc}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-amber-500 mb-2" />
              <CardTitle>{t.home.flowTitle}</CardTitle>
              <CardDescription>
                {t.home.flowDesc}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Signature Format Preview */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {t.home.formatTitle}
        </h2>
        <Card className="bg-zinc-50 dark:bg-zinc-900 font-mono text-sm overflow-x-auto">
          <CardContent className="p-6">
            <pre className="leading-relaxed">
              <code>
                <span className="text-blue-500">wrapped_signature</span> ={" "}
                <span className="text-emerald-500">inner_signature</span>
                {" || "}
                <span className="text-amber-500">context</span>
                {" || "}
                <span className="text-purple-500">context_length</span>
                {" || "}
                <span className="text-red-500">MAGIC</span>
                {"\n\n"}
                <span className="text-zinc-500">// MAGIC =</span>
                {"\n"}
                <span className="text-red-400">
                  0x80108010801080108010801080108010
                </span>
                {"\n"}
                <span className="text-red-400">
                  801080108010801080108010801080108010
                </span>
                {"\n\n"}
                <span className="text-zinc-500">// context = abi.encode(</span>
                {"\n"}
                <span className="text-zinc-500">//   authorization, //</span>{" "}
                <span className="text-zinc-400">
                  (chain_id, address, nonce, y_parity, r, s)
                </span>
                {"\n"}
                <span className="text-zinc-500">//   init_to,      //</span>{" "}
                <span className="text-zinc-400">optional initializer</span>
                {"\n"}
                <span className="text-zinc-500">//   init_data     //</span>{" "}
                <span className="text-zinc-400">optional init calldata</span>
                {"\n"}
                <span className="text-zinc-500">// )</span>
              </code>
            </pre>
          </CardContent>
        </Card>
      </section>

      {/* Verification Paths */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {t.home.verificationTitle}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader>
              <Badge className="w-fit mb-2">{t.home.preDelegationBadge}</Badge>
              <CardTitle className="text-lg">{t.home.preDelegationTitle}</CardTitle>
              <CardDescription>
                {t.home.preDelegationDesc}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <Badge className="w-fit mb-2" variant="outline">
                {t.home.postDelegationBadge}
              </Badge>
              <CardTitle className="text-lg">{t.home.postDelegationTitle}</CardTitle>
              <CardDescription>
                {t.home.postDelegationDesc}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center">
        <Separator className="mb-12" />
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">{t.home.ctaTitle}</h2>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-md">
            {t.home.ctaDesc}
          </p>
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-9 px-4 text-sm font-medium"
          >
            {t.home.ctaButton} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 text-center text-sm text-zinc-400">
        <p>
          {t.home.footer}{" "}
          <a
            href="https://viem.sh"
            className="underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            viem
          </a>{" "}
          ·{" "}
          <a
            href="https://nextjs.org"
            className="underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Next.js
          </a>{" "}
          ·{" "}
          <a
            href="https://eips.ethereum.org/EIPS/eip-7702"
            className="underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            EIP-7702
          </a>
        </p>
      </footer>
    </div>
  );
}
