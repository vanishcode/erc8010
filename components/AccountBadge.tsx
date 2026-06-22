"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Key } from "lucide-react";
import { demoAccount, getActiveChain } from "@/lib/account";

function truncateAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function AccountBadge() {
  const [copied, setCopied] = useState(false);
  const chain = getActiveChain();

  if (!demoAccount) {
    return (
      <Badge variant="outline" className="text-xs gap-1 text-amber-600">
        <Key className="h-3 w-3" />
        No key set
      </Badge>
    );
  }

  const address = demoAccount.address;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-xs">
        {chain.name}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 font-mono text-xs"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {truncateAddress(address)}
      </Button>
    </div>
  );
}
