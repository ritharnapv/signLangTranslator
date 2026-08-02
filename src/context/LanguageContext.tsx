import React, { createContext, useContext, useState, useEffect } from 'react';
import { UILanguage, SUPPORTED_UI_LANGUAGES, TranslationDictionary, getTranslation, LanguageInfo } from '../lib/i18n';

interface LanguageContextType {
  language: UILanguage;
  setLanguage: (lang: UILanguage) => void;
  t: (key: keyof TranslationDictionary) => string;
  supportedLanguages: LanguageInfo[];
  currentLanguageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'asl_ui_language_pref';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<UILanguage>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'kn' || saved === 'ml' || saved === 'ta')) {
        return saved as UILanguage;
      }
    } catch (e) {
      console.warn("Could not load UI language preference:", e);
    }
    return 'en';
  });

  const setLanguage = (lang: UILanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, lang);
    } catch (e) {
      console.warn("Could not save UI language preference:", e);
    }
  };

  const t = (key: keyof TranslationDictionary): string => {
    return getTranslation(language, key);
  };

  const currentLanguageInfo = SUPPORTED_UI_LANGUAGES.find(l => l.code === language) || SUPPORTED_UI_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        supportedLanguages: SUPPORTED_UI_LANGUAGES,
        currentLanguageInfo,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
