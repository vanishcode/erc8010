"use client";

import { useContext } from "react";
import { I18nContext, type I18nContextValue } from "./context";

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return ctx;
}

/**
 * Convenience hook: returns just the translations object.
 * Usage: const { t } = useTranslation(); t.navbar.home
 */
export function useTranslation() {
  const { t } = useI18n();
  return { t };
}

/**
 * Returns locale + toggle. For building language switchers.
 */
export function useLanguage() {
  const { locale, setLocale, toggleLocale } = useI18n();
  return { locale, setLocale, toggleLocale };
}
