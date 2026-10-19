import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, Locale, TranslationKeys } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, defaultVal?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "dmaic-locale";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale;
    if (saved === "zh" || saved === "en") return saved;
    // 默认判断浏览器语言
    const navLang = navigator.language.toLowerCase();
    if (navLang.startsWith("zh")) return "zh";
    return "en";
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = (path: string, defaultVal?: string): string => {
    const keys = path.split(".");
    let current: any = translations[locale];
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        // 回退到英文
        let fallback: any = translations["en"];
        for (const fbKey of keys) {
          if (fallback && typeof fallback === "object" && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return defaultVal || path;
          }
        }
        return typeof fallback === "string" ? fallback : (defaultVal || path);
      }
    }
    return typeof current === "string" ? current : (defaultVal || path);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
