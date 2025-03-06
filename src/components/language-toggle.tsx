"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/language-context";

type LanguageToggleProps = {
  isHomepage: boolean;
};

export function LanguageToggle({ isHomepage }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1280);
  const [containerOffset, setContainerOffset] = useState(0);

  // Calculate container width and offset on mount and resize
  useEffect(() => {
    if (typeof window === "undefined") return;

    const calculateContainerMetrics = () => {
      // 1280px is max-w-7xl, but we need to account for smaller screens
      const maxContainerWidth = 1280;
      const horizontalPadding = 32; // px-4 on each side (16px * 2)
      const width = Math.min(
        window.innerWidth - horizontalPadding,
        maxContainerWidth
      );

      // Calculate the left offset to center the container
      const offset = Math.max(0, (window.innerWidth - width) / 2);

      setContainerWidth(width);
      setContainerOffset(offset);
    };

    // Calculate initially
    calculateContainerMetrics();

    // Recalculate on resize
    window.addEventListener("resize", calculateContainerMetrics);
    return () =>
      window.removeEventListener("resize", calculateContainerMetrics);
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  // Compute right position based on container width
  const rightPosition = `${containerOffset + 16}px`;

  return (
    <div
      className={`fixed z-50 ${
        isHomepage ? "top-32" : "top-32"
      } pointer-events-none`}
      style={{ right: rightPosition }}
    >
      <motion.button
        className="pointer-events-auto text-3xl filter drop-shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: isHovered ? 1 : 0.6, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          opacity: { duration: 0.2 },
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleLanguage}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={`Switch to ${language === "en" ? "Spanish" : "English"}`}
      >
        {language === "en" ? "🇪🇸" : "🇺🇸"}
      </motion.button>
    </div>
  );
}
