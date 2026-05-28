'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { Locale, detectLocale, setLocale as saveLocale, t, TranslationKey } from './i18n';

interface I18nContextValue {
  locale: Locale;
  switchLocale: () => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  switchLocale: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  const switchLocale = useCallback(() => {
    const next: Locale = locale === 'en' ? 'zh' : 'en';
    saveLocale(next);
    setLocaleState(next);
  }, [locale]);

  const translate = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => t(key, locale, params),
    [locale],
  );

  return (
    <I18nContext.Provider value={{ locale, switchLocale, t: translate }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
