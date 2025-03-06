"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Language, translations } from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with browser language or default to English
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    // Get language preference from localStorage if available
    const savedLanguage = localStorage.getItem("language") as Language;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "es")) {
      setLanguage(savedLanguage);
    } else {
      // Try to detect browser language
      const browserLang = navigator.language.split("-")[0];
      if (browserLang === "es") {
        setLanguage("es");
      }
    }
  }, []);

  // Save language preference when it changes
  useEffect(() => {
    localStorage.setItem("language", language);
    // Also set html lang attribute for accessibility
    document.documentElement.lang = language;
  }, [language]);

  // Translation function
  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
