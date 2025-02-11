"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WordRotator } from "@/components/word-rotator";
import { statements } from "@/lib/word-bank";

export default function Home() {
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const currentWords = isLargeScreen ? statements.large : statements.small;

  const headingVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.3,
        yoyo: Number.POSITIVE_INFINITY,
      },
    },
  };

  const subheaderVariants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
      },
    }),
  };

  return (
    <motion.main
      key="home"
      className="flex-1 flex items-center"
      role="main"
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 py-8">
        <motion.h1
          className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[120px] font-bold tracking-tight text-center leading-[1.1] max-w-[1200px] mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover="hover"
          variants={headingVariants}
        >
          <motion.div variants={headingVariants}>Designed</motion.div>
          <div className="relative h-[1.1em] overflow-hidden">
            <motion.span
              className="absolute left-0 right-0"
              variants={headingVariants}
            >
              for <WordRotator words={currentWords} />
              <span className="text-black">.</span>
            </motion.span>
          </div>
          <motion.div variants={headingVariants}>Inspired</motion.div>
          <motion.div variants={headingVariants}>by stories.</motion.div>
        </motion.h1>

        <motion.p
          className="text-[#898989] text-lg sm:text-xl md:text-xl lg:text-2xl text-center mt-4 sm:mt-6 md:mt-8 max-w-xs sm:max-w-lg md:max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={subheaderVariants}
          custom={0}
        >
          Every click, every scroll — intentionally designed to connect, engage,
          and inspire.
        </motion.p>

        <motion.div
          className="mt-6 sm:mt-8 md:mt-12 lg:mt-16 flex justify-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <motion.div
            className="group cursor-pointer inline-flex items-center bg-black text-white rounded-full transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              scale: [1, 1.05, 1],
              transition: {
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              },
            }}
            onClick={() => router.push("/how-it-works")}
          >
            <motion.div
              className="py-2 sm:py-3 pl-4 sm:pl-6 pr-6 sm:pr-8 flex items-center"
              whileHover="hover"
            >
              <span className="text-base sm:text-lg md:text-lg lg:text-xl font-medium whitespace-nowrap mr-2">
                WE DESIGN, YOU SHINE
              </span>
              <motion.span
                className="inline-block"
                variants={{
                  hover: {
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.2, 0.9, 1.1, 1],
                    transition: {
                      duration: 0.6,
                      ease: "easeInOut",
                      times: [0, 0.2, 0.4, 0.6, 0.8, 1],
                      repeat: Number.POSITIVE_INFINITY,
                      repeatDelay: 0.5,
                    },
                  },
                }}
              >
                ✨
              </motion.span>
            </motion.div>
            <div className="pr-2 sm:pr-3">
              <motion.div
                className="bg-white text-black rounded-full w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex items-center justify-center transition-colors group-hover:bg-[#777EF0] group-hover:text-white"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.3 }}
              >
                <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.main>
  );
}
