"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      className="flex items-center justify-center px-2 py-1 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors text-sm font-medium"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      aria-label={`Switch to ${language === "en" ? "Spanish" : "English"}`}
    >
      <span
        className={`mr-1 ${language === "en" ? "font-bold" : "opacity-60"}`}
      >
        EN
      </span>
      <span className="mx-1 text-gray-400">|</span>
      <span
        className={`ml-1 ${language === "es" ? "font-bold" : "opacity-60"}`}
      >
        ES
      </span>
    </motion.button>
  );
}
