"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/i18n/hooks";

/**
 * Syncs the <html lang> attribute with the current locale.
 * Must be rendered inside I18nProvider.
 */
export function HtmlLang() {
  const { locale } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
