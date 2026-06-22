"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountBadge } from "@/components/AccountBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/hooks";
import { FileCode, Home, Play, BookOpen } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const links = [
    { href: "/", label: t.navbar.home, icon: Home },
    { href: "/demo", label: t.navbar.demo, icon: Play },
    { href: "/explain", label: t.navbar.explain, icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg tracking-tight"
          >
            <FileCode className="h-5 w-5 text-blue-500" />
            <span>
              ERC-8010{" "}
              <span className="text-zinc-400 font-normal text-sm">Demo</span>
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
                  pathname === link.href
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {/* <AccountBadge /> */}
        </div>
      </div>
    </header>
  );
}
