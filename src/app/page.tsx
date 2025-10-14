"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState, useLayoutEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { debounce } from "@/lib/utils"; // Assuming debounce is moved to utils
import { usePageTransition } from "@/hooks/use-page-transition";
import { WordRotator } from "@/components/word-rotator";
import { statements, inspirations } from "@/lib/word-bank";
import { useLanguage } from "@/contexts/language-context";
import { HomepageFooter } from "@/components/homepage-footer";

const DEBOUNCE_DELAY = 100;
const HEADING_VARIANTS = {
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.3,
      yoyo: Number.POSITIVE_INFINITY,
    },
  },
};

const SUBHEADER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
};

export default function Home() {
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const { isTransitioning, createTransition } = usePageTransition();
  const { t, language } = useLanguage();

  useLayoutEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };

    checkScreenSize();
    const debounceResize = debounce(checkScreenSize, DEBOUNCE_DELAY);
    window.addEventListener("resize", debounceResize);

    return () => window.removeEventListener("resize", debounceResize);
  }, []);

  // Get words in the current language
  const currentWords = isLargeScreen
    ? statements[language].large
    : statements[language].small;

  const currentInspirations = isLargeScreen
    ? inspirations[language].large
    : inspirations[language].small;

  return (
    <>
      <motion.main
        key="home"
        className="flex-1 flex items-start sm:items-center pt-8 sm:pt-0 mt-0"
        role="main"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto px-4 pt-0 pb-8 sm:py-8">
          <motion.h1
            className="text-[42px] sm:text-[64px] md:text-[80px] lg:text-[120px] font-bold tracking-tight text-center leading-[1.05] sm:leading-[1.1] max-w-[1200px] mx-auto mt-0 pt-2 sm:mt-2"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover="hover"
            variants={HEADING_VARIANTS}
          >
            <motion.div variants={HEADING_VARIANTS}>{t("designed")}</motion.div>
            <div className="relative h-[1.1em] overflow-hidden">
              <motion.span
                className="absolute left-0 right-0"
                variants={HEADING_VARIANTS}
              >
                {t("for")} <WordRotator words={currentWords} />
              </motion.span>
            </div>
            <div className="relative h-[1.1em] overflow-hidden">
              <motion.span
                className="absolute left-0 right-0"
                variants={HEADING_VARIANTS}
              >
                <WordRotator
                  words={currentInspirations}
                  initialDelay={1500}
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
                />
              </motion.span>
            </div>
          </motion.h1>

          <motion.p
            className="text-[#898989] text-base sm:text-lg md:text-xl lg:text-2xl text-center mt-3 sm:mt-6 md:mt-8 max-w-xs sm:max-w-lg md:max-w-3xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={SUBHEADER_VARIANTS}
            custom={0}
          >
            {t("tagline")}
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
                scale: isTransitioning ? 0.95 : [1, 1.05, 1],
                transition: {
                  duration: 1.5,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                },
              }}
              onClick={(e) => {
                // Stop any ongoing animations immediately
                e.stopPropagation();
                // Make sure we're not doing too many animations at once
                if (!isTransitioning) {
                  // Force styles to be applied immediately before transition
                  document.body.offsetHeight;
                  createTransition("/how-it-works");
                }
              }}
            >
              <motion.div
                className="py-2 sm:py-3 pl-4 sm:pl-6 pr-6 sm:pr-8 flex items-center"
                whileHover="hover"
              >
                <span className="text-base sm:text-lg md:text-lg lg:text-xl font-medium whitespace-nowrap mr-2">
                  {t("ctaButton")}
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
                  👌
                </motion.span>
              </motion.div>
              <div className="pr-2 sm:pr-3">
                <motion.div
                  className="bg-white text-black rounded-full w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex items-center justify-center transition-colors group-hover:bg-[hsl(var(--primary-accent))] group-hover:text-white"
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
      <HomepageFooter />
    </>
  );
}
