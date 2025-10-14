"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface WordRotatorProps {
  words?: string[];
  interval?: number;
  initialDelay?: number;
  className?: string;
}

export function WordRotator({
  words = [],
  interval = 3000,
  initialDelay = 0,
  className = "text-[hsl(var(--primary-accent))]",
}: WordRotatorProps) {
  // Add guard clause for empty words array
  if (!words?.length) {
    return null;
  }

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    // Set initial delay before starting rotation
    const timeout = setTimeout(() => {
      intervalId = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
      }, interval);
    }, initialDelay);

    return () => {
      clearTimeout(timeout);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [words.length, interval, initialDelay]);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={words[currentIndex]}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className={`inline-block will-change-transform ${className}`}
      >
        {words[currentIndex]}
      </motion.span>
    </AnimatePresence>
  );
}
