"use client";

import { useLanguage } from "@/lib/i18n/hooks";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, toggleLocale } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="gap-1.5 text-xs font-medium"
      aria-label={`Switch language (current: ${locale === "en" ? "English" : "中文"})`}
    >
      <Languages className="h-4 w-4" />
      <span className="hidden sm:inline">
        {locale === "en" ? "中文" : "EN"}
      </span>
    </Button>
  );
}
