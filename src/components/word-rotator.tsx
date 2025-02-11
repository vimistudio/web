"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function WordRotator({ words = [] }: { words: string[] }) {  // Add default empty array
  // Add guard clause for empty words array
  if (!words?.length) {
    return null
  }

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [words.length])

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={words[currentIndex]}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="inline-block text-[hsl(var(--primary-accent))]"
      >
        {words[currentIndex]}
      </motion.span>
    </AnimatePresence>
  )
}

