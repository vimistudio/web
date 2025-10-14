"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState, useLayoutEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { debounce } from "@/lib/utils"; // Assuming debounce is moved to utils
import { usePageTransition } from "@/hooks/use-page-transition";
import { WordRotator } from "@/components/word-rotator";
import { statements, inspirations } from "@/lib/word-bank";
import { useLanguage } from "@/contexts/language-context";
import { HomepageFooter } from "@/components/homepage-footer";
import Image from "next/image";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const checkTextFit = () => {
      if (!headingRef.current) return;

      // Get computed font size of the heading
      const computedStyle = window.getComputedStyle(headingRef.current);
      const fontSize = parseFloat(computedStyle.fontSize);

      // Get container width
      const containerWidth =
        containerRef.current?.offsetWidth || window.innerWidth;

      // Calculate available width (80% of container for some padding)
      const availableWidth = containerWidth * 0.8;

      // Get the longest phrase from large arrays
      const longestStatement = statements[language].large.reduce((a, b) =>
        a.length > b.length ? a : b
      );
      const longestInspiration = inspirations[language].large.reduce((a, b) =>
        a.length > b.length ? a : b
      );

      // Estimate character width (roughly 0.6 of font size for typical fonts)
      const charWidth = fontSize * 0.6;

      // Calculate required widths
      const statementWidth = longestStatement.length * charWidth;
      const inspirationWidth = longestInspiration.length * charWidth;

      // Use large words only if both fit comfortably
      const shouldUseLarge =
        statementWidth < availableWidth && inspirationWidth < availableWidth;

      setIsLargeScreen(shouldUseLarge);
    };

    checkTextFit();
    const debounceResize = debounce(checkTextFit, DEBOUNCE_DELAY);
    window.addEventListener("resize", debounceResize);

    return () => window.removeEventListener("resize", debounceResize);
  }, [language]);

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
        <div
          ref={containerRef}
          className="container mx-auto px-4 pt-0 pb-8 sm:py-8"
        >
          <motion.h1
            ref={headingRef}
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

          <div className="mt-8 sm:mt-12 md:mt-16 lg:mt-20 space-y-2 sm:space-y-3 max-w-xs sm:max-w-lg md:max-w-3xl mx-auto">
            <motion.p
              className="text-[#898989] text-base sm:text-lg md:text-xl text-center"
              initial="hidden"
              animate="visible"
              variants={SUBHEADER_VARIANTS}
              custom={0}
            >
              {t("tagline1")}
            </motion.p>
            <motion.p
              className="text-[#898989] text-base sm:text-lg md:text-xl text-center"
              initial="hidden"
              animate="visible"
              variants={SUBHEADER_VARIANTS}
              custom={1}
            >
              {t("tagline2")}
            </motion.p>
            <motion.div
              className="relative inline-block"
              initial="hidden"
              animate="visible"
              variants={SUBHEADER_VARIANTS}
              custom={2}
            >
              {/* Stamp SVG Background */}
              <motion.div
                className="relative w-[280px] sm:w-[350px] md:w-[420px] lg:w-[500px] h-auto"
                initial={{ scale: 0, rotate: -8 }}
                animate={{
                  scale: 1,
                  rotate: [-5, -3, -4, -3, -5],
                }}
                transition={{
                  scale: {
                    duration: 0.5,
                    delay: 0.3,
                    type: "spring",
                    stiffness: 200,
                  },
                  rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <Image
                  src="/stamp-no-stress_1.svg"
                  alt="No stress, just good design"
                  width={500}
                  height={282}
                  className="w-full h-auto"
                  priority
                />

                {/* Animated emoji overlay */}
                <motion.span
                  className="absolute right-[8%] top-[48%] text-3xl sm:text-4xl md:text-5xl lg:text-6xl transform -translate-y-1/2"
                  animate={{
                    rotate: [0, -10, 10, -10, 10, 0],
                    scale: [1, 1.2, 1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut",
                  }}
                  whileHover={{
                    rotate: [0, -20, 20, -20, 20, 0],
                    scale: [1, 1.3, 1.3, 1.3, 1],
                    transition: {
                      duration: 0.5,
                    },
                  }}
                >
                  👌
                </motion.span>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            className="mt-6 sm:mt-8 md:mt-12 lg:mt-16 flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {/* Primary CTA - Book a call */}
            <motion.a
              href="/start-project"
              className="group cursor-pointer inline-flex items-center bg-black text-white rounded-full transition-colors px-6 sm:px-8 py-3 sm:py-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                if (!isTransitioning) {
                  createTransition("/start-project");
                }
              }}
            >
              <span className="text-base sm:text-lg font-medium whitespace-nowrap">
                {t("ctaButton1")}
              </span>
            </motion.a>

            {/* Secondary CTA - See process */}
            <motion.div
              className="group cursor-pointer inline-flex items-center border-2 border-black text-black rounded-full transition-all hover:bg-black hover:text-white px-6 sm:px-8 py-3 sm:py-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isTransitioning) {
                  createTransition("/how-it-works");
                }
              }}
            >
              <span className="text-base sm:text-lg font-medium whitespace-nowrap mr-2">
                {t("ctaButton2")}
              </span>
              <motion.div
                className="transition-transform group-hover:translate-x-1"
                transition={{ duration: 0.3 }}
              >
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.main>
      <HomepageFooter />
    </>
  );
}
