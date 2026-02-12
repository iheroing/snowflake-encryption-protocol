import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LOCALE_STORAGE_KEY, translations, type Locale, type TranslationDict } from '../i18n/translations';

type Params = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  localeTag: string;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: Params) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getNestedValue(dict: TranslationDict, key: string): string | null {
  const segments = key.split('.');
  let current: unknown = dict;

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return null;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'string' ? current : null;
}

function interpolate(template: string, params?: Params): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

function detectLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'zh';
  }

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') {
      return stored;
    }
  } catch {
    // ignore storage failures
  }

  return window.navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => detectLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore storage failures
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'zh' ? 'en' : 'zh');
  }, [locale, setLocale]);

  const localeTag = locale === 'zh' ? 'zh-CN' : 'en-US';

  useEffect(() => {
    document.documentElement.lang = localeTag;
  }, [localeTag]);

  const t = useCallback((key: string, params?: Params) => {
    const dict = translations[locale];
    const fallback = translations.zh;
    const message = getNestedValue(dict, key) ?? getNestedValue(fallback, key) ?? key;
    return interpolate(message, params);
  }, [locale]);

  const value = useMemo(
    () => ({ locale, localeTag, setLocale, toggleLocale, t }),
    [locale, localeTag, setLocale, toggleLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
};

