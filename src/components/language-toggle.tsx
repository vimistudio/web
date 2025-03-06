"use client";

import React from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <motion.button
        onClick={toggleLanguage}
        className="flex items-center justify-center rounded-full 
                  bg-black text-white shadow-lg
                  hover:shadow-xl transition-all duration-300
                  w-12 h-12 sm:w-14 sm:h-14"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 20,
          duration: 0.4,
        }}
        aria-label={`Switch to ${language === "en" ? "Spanish" : "English"}`}
      >
        <div className="text-center font-medium">
          {language === "en" ? "ES" : "EN"}
        </div>
      </motion.button>
    </div>
  );
}
