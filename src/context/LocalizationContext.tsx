"use client";

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { en } from '@/locales/en';
import { lg } from '@/locales/lg';
import { sw } from '@/locales/sw';
import { run } from '@/locales/run';
import type { LANGUAGES } from '@/lib/constants';

type LanguageCode = typeof LANGUAGES[number]['code'];

interface LocalizationContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  translations: Record<string, any>;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const translationsMap: Record<LanguageCode, Record<string, any>> = {
  en,
  lg,
  sw,
  run,
};

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

export const LocalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');
  const [currentTranslations, setCurrentTranslations] = useState<Record<string, any>>(translationsMap.en);

  useEffect(() => {
    const storedLang = localStorage.getItem('afyasync-lang') as LanguageCode | null;
    if (storedLang && translationsMap[storedLang]) {
      setLanguageState(storedLang);
      setCurrentTranslations(translationsMap[storedLang]);
    } else {
      setCurrentTranslations(translationsMap.en); // Default to English
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    if (translationsMap[lang]) {
      setLanguageState(lang);
      setCurrentTranslations(translationsMap[lang]);
      localStorage.setItem('afyasync-lang', lang);
    }
  };
  
  const t = useMemo(() => (key: string, replacements?: Record<string, string | number>): string => {
    let translation = currentTranslations[key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(rKey => {
        translation = translation.replace(`{{${rKey}}}`, String(replacements[rKey]));
      });
    }
    return translation;
  }, [currentTranslations]);


  return (
    <LocalizationContext.Provider value={{ language, setLanguage, translations: currentTranslations, t }}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (context === undefined) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
