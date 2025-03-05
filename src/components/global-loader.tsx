"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500) // Adjust this duration as needed

    return () => clearTimeout(timer)
  }, [])

  if (!isLoading) return null

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F3F2F1]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <motion.svg
        width="80"
        height="86"
        viewBox="0 0 308 330"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ scale: 0.8, rotate: 0 }}
        animate={{
          scale: [0.8, 1, 0.9, 1],
          rotate: 360,
        }}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
          times: [0, 0.5, 0.8, 1],
        }}
      >
        <motion.path
          d="M229.65 292.88C228.83 295.57 228.39 296.99 228.39 296.99L196 329.37L0 133.34L32.38 101L36.38 99.67L51.08 114.37L79.67 142.96L94.81 158.1L91 159.34L162.41 230.75L163.69 226.86L178.77 242L207 270.28L229.65 292.88Z"
          fill="#909AF7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        />
        <motion.path
          d="M229.65 292.88C228.83 295.57 228.39 296.99 228.39 296.99L205.74 274.24L177.52 245.9L178.77 242.01L185.77 220.63L219.5 117.24L209.68 120.46L197 124.6L94.85 158.06L91 159.34L47.52 116.1C47.75 115.98 48.95 115.36 51.07 114.33C54.81 112.46 61.36 109.21 69.96 104.95C93.82 93.15 133.56 73.68 173.75 54.69C205.46 39.67 237.4 25 262 14.55L306.47 0C317 7.14 240.48 257.64 229.65 292.88Z"
          fill="#909AF7"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        />
        <motion.path
          d="M306.47 0L222.48 257.52L213.99 248.98L207.04 270.28L205.74 274.29L162.37 230.75L163.65 226.86L204.36 102.12L79.7099 142.92L75.8199 144.2L32.3799 100.96L36.4199 99.63L57.6999 92.66L49.1499 84.19L262.05 14.53L306.47 0Z"
          fill="#ECEEFE"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
        />
      </motion.svg>
    </motion.div>
  )
}

