"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "@/lib/i18n/hooks";

export default function ExplainPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-4">
        {t.explain.title}
      </h1>
      <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-10">
        {t.explain.subtitle}
      </p>

      {/* Wrapper Format */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">{t.explain.formatTitle}</h2>
        <Card className="bg-zinc-50 dark:bg-zinc-900 overflow-x-auto">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 shrink-0 bg-blue-500">1</Badge>
                <div>
                  <p className="font-medium text-blue-600 dark:text-blue-400">
                    {t.explain.innerSigTitle}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {t.explain.innerSigDesc}
                  </p>
                </div>
              </div>
              <div className="text-zinc-400 text-center">+</div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 shrink-0 bg-amber-500">2</Badge>
                <div>
                  <p className="font-medium text-amber-600 dark:text-amber-400">
                    {t.explain.contextTitle}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {t.explain.contextDesc}
                  </p>
                  <ul className="list-disc list-inside text-sm text-zinc-500 mt-1 space-y-1">
                    <li>
                      <strong>{t.explain.contextItem1}</strong>
                    </li>
                    <li>
                      <strong>{t.explain.contextItem2}</strong>
                    </li>
                    <li>
                      <strong>{t.explain.contextItem3}</strong>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="text-zinc-400 text-center">+</div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 shrink-0 bg-purple-500">3</Badge>
                <div>
                  <p className="font-medium text-purple-600 dark:text-purple-400">
                    {t.explain.lengthTitle}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {t.explain.lengthDesc}
                  </p>
                </div>
              </div>
              <div className="text-zinc-400 text-center">+</div>
              <div className="flex items-start gap-3">
                <Badge className="mt-0.5 shrink-0 bg-red-500">4</Badge>
                <div>
                  <p className="font-medium text-red-600 dark:text-red-400">
                    {t.explain.magicTitle}
                  </p>
                  <p className="text-sm text-zinc-500">{t.explain.magicDesc}</p>
                  <code className="block mt-1 text-xs bg-zinc-100 dark:bg-zinc-800 p-2 rounded break-all">
                    0x8010801080108010801080108010801080108010801080108010801080108010
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="mb-12" />

      {/* Verification Flow */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">{t.explain.verificationTitle}</h2>
        <Card>
          <CardContent className="p-6">
            <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
              <code>
                <span className="text-zinc-500">// verifyHash(address, digest, wrapped_signature)</span>
                {"\n\n"}
                <span className="text-zinc-500">// Step 1: Check for MAGIC</span>
                {"\n"}
                <span className="text-blue-500">if</span> (wrapped_signature.
                <span className="text-amber-500">last32Bytes</span> =={" "}
                <span className="text-red-400">MAGIC</span>) {"{"}
                {"\n"}
                {"  "}
                <span className="text-zinc-500">
                  // ERC-8010 path: pre-delegation
                </span>
                {"\n"}
                {"  "}parse wrapped_signature → (innerSig, authorization,
                initTo, initData)
                {"\n\n"}
                {"  "}
                <span className="text-blue-500">if</span> (account.
                <span className="text-amber-500">code</span> =={" "}
                <span className="text-emerald-400">0xef0100</span> || delegate)
                {"{"}
                {"\n"}
                {"    "}
                <span className="text-zinc-500">
                  // Already delegated → use ERC-1271
                </span>
                {"\n"}
                {"    "}
                <span className="text-blue-500">return</span> account.
                <span className="text-amber-500">isValidSignature</span>(digest,
                innerSig)
                {"\n"}
                {"  "}
                {"}"}
                {"\n\n"}
                {"  "}
                <span className="text-zinc-500">
                  // Not yet delegated → simulate via eth_call
                </span>
                {"\n"}
                {"  "}
                <span className="text-blue-500">return</span> eth_call(
                {"\n    "}authorizationList: [authorization],
                {"\n    "}calls: [
                {"\n      "}initTo.call(initData),{" "}
                <span className="text-zinc-500">// optional</span>
                {"\n      "}account.isValidSignature(digest, innerSig)
                {"\n    "}]
                {"\n  "})
                {"\n"}
                {"}"}
                {"\n\n"}
                <span className="text-zinc-500">
                  // Step 2: No MAGIC → fall back to ERC-6492
                </span>
                {"\n"}
                <span className="text-blue-500">else</span> {"{"}
                {"\n"}
                {"  "}
                <span className="text-blue-500">return</span>{" "}
                <span className="text-amber-500">
                  verifyErc6492Signature
                </span>
                (address, digest, wrapped_signature)
                {"\n"}
                {"}"}
              </code>
            </pre>
          </CardContent>
        </Card>
      </section>

      <Separator className="mb-12" />

      {/* EIP Relationships */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4">{t.explain.standardsTitle}</h2>
        <Accordion className="w-full">
          <AccordionItem value="eip7702">
            <AccordionTrigger>{t.explain.eip7702Title}</AccordionTrigger>
            <AccordionContent className="text-sm text-zinc-500 space-y-2">
              <p>
                {t.explain.eip7702Content1}
              </p>
              <p>
                {t.explain.eip7702Content2}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="erc1271">
            <AccordionTrigger>
              {t.explain.erc1271Title}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-zinc-500 space-y-2">
              <p>
                {t.explain.erc1271Content1}
              </p>
              <p>
                {t.explain.erc1271Content2}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="erc6492">
            <AccordionTrigger>
              {t.explain.erc6492Title}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-zinc-500 space-y-2">
              <p>
                {t.explain.erc6492Content1}
              </p>
              <p>
                {t.explain.erc6492Content2}
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="viem">
            <AccordionTrigger>
              {t.explain.viemTitle}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-zinc-500 space-y-2">
              <p>
                {t.explain.viemContent}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
