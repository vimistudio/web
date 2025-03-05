"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Phone, Users, Palette, Zap, Package, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { useLanguage } from "@/contexts/language-context";
import { translations } from "@/lib/i18n";

type TranslationKey = keyof typeof translations.en;

const faqItems = [
  {
    questionKey: "faqQuestion1" as TranslationKey,
    answerKey: "faqAnswer1" as TranslationKey,
  },
  {
    questionKey: "faqQuestion2" as TranslationKey,
    answerKey: "faqAnswer2" as TranslationKey,
  },
  {
    questionKey: "faqQuestion3" as TranslationKey,
    answerKey: "faqAnswer3" as TranslationKey,
  },
  {
    questionKey: "faqQuestion4" as TranslationKey,
    answerKey: "faqAnswer4" as TranslationKey,
  },
  {
    questionKey: "faqQuestion5" as TranslationKey,
    answerKey: "faqAnswer5" as TranslationKey,
  },
  {
    questionKey: "faqQuestion6" as TranslationKey,
    answerKey: "faqAnswer6" as TranslationKey,
  },
  {
    questionKey: "faqQuestion7" as TranslationKey,
    answerKey: "faqAnswer7" as TranslationKey,
  },
  {
    questionKey: "faqQuestion8" as TranslationKey,
    answerKey: "faqAnswer8" as TranslationKey,
  },
];

const processSteps = [
  {
    icon: Phone,
    titleKey: "initialConsultation" as TranslationKey,
    descriptionKey: "initialConsultationDesc" as TranslationKey,
  },
  {
    icon: Users,
    titleKey: "discoveryPhase" as TranslationKey,
    descriptionKey: "discoveryPhaseDesc" as TranslationKey,
  },
  {
    icon: Palette,
    titleKey: "designBriefing" as TranslationKey,
    descriptionKey: "designBriefingDesc" as TranslationKey,
  },
  {
    icon: Zap,
    titleKey: "designSprint" as TranslationKey,
    descriptionKey: "designSprintDesc" as TranslationKey,
  },
  {
    icon: Package,
    titleKey: "finalDelivery" as TranslationKey,
    descriptionKey: "finalDeliveryDesc" as TranslationKey,
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [showExcitementTooltip, setShowExcitementTooltip] = useState(false);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const triggerConfetti = () => {
    const colors = [
      "hsl(var(--primary-accent))",
      "#9099F2",
      "#5A62EE",
      "#3D46EB",
      "#FFFFFF",
      "#000000",
    ];
    const commonConfig = {
      particleCount: 100,
      spread: 100,
      colors: colors,
    };

    const leftConfetti = () => {
      confetti({
        ...commonConfig,
        origin: { x: 0.2, y: 0.6 },
      });
    };

    const middleConfetti = () => {
      confetti({
        ...commonConfig,
        origin: { x: 0.5, y: 0.6 },
      });
    };

    const rightConfetti = () => {
      confetti({
        ...commonConfig,
        origin: { x: 0.8, y: 0.6 },
      });
    };

    leftConfetti();
    middleConfetti();
    rightConfetti();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => {
        if (prev === processSteps.length - 1) {
          clearInterval(timer);
          return prev;
        }

        // Show excitement tooltip right before the final step
        if (prev === processSteps.length - 2) {
          // First hide the tooltip if it's shown
          setShowExcitementTooltip(false);

          // Then show it with a slight delay for better effect
          setTimeout(() => {
            setShowExcitementTooltip(true);

            // Hide it after 3.5 seconds
            setTimeout(() => {
              setShowExcitementTooltip(false);
            }, 3500);
          }, 300);

          // Trigger confetti with a longer delay
          setTimeout(() => {
            triggerConfetti();
            setShowFAQ(true); // Show FAQ after confetti
          }, 1000);
        }

        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Add 1 second delay before showing the banner
          setTimeout(() => {
            setShowBanner(true);
          }, 1000);
        } else {
          setShowBanner(false);
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 0.1,
      }
    );

    if (bottomRef.current) {
      observer.observe(bottomRef.current);
    }

    return () => {
      if (bottomRef.current) {
        observer.unobserve(bottomRef.current);
      }
    };
  }, []); // Keep dependencies empty array

  return (
    <motion.main
      key="how-it-works"
      className="flex-1 flex items-center"
      role="main"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.3,
      }}
    >
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">
          {t("howItWorksTitle")}
        </h2>
        <div className="relative md:flex md:justify-between md:items-start">
          {/* Timeline line for mobile - moved before the steps */}
          <div className="absolute left-6 top-6 bottom-0 w-0.5 bg-gray-200 md:hidden">
            <motion.div
              className="absolute top-0 left-0 w-full bg-[hsl(var(--primary-accent))]"
              style={{
                originY: 0,
                height: `${(activeStep + 1) * 20}%`,
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Timeline line for desktop - moved before the steps */}
          <div className="hidden md:block absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200">
            <motion.div
              className="absolute top-0 left-0 h-full bg-[#5046c0]"
              style={{
                originX: 0,
                width: `${(activeStep / (processSteps.length - 1)) * 100}%`,
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Excitement Tooltip */}
          <AnimatePresence>
            {showExcitementTooltip && (
              <motion.div
                className="absolute z-10 md:bottom-full md:left-[85%] md:mb-2 md:-translate-x-1/2
                           /* Mobile positioning */
                           left-12 top-[80%] md:top-auto"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="bg-black text-white px-4 py-2 rounded-lg shadow-lg text-sm md:text-base font-medium">
                  {t("excitementTooltip")} ✨
                  {/* Triangle pointer - different position on mobile vs desktop */}
                  <div
                    className="absolute w-3 h-3 bg-black transform rotate-45 
                                  md:left-1/2 md:-bottom-1.5 md:-ml-1.5
                                  /* Mobile pointer position */
                                  -left-1.5 top-1/2 -mt-1.5 md:top-auto"
                  ></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {processSteps.map((step, index) => (
            <motion.div
              key={step.titleKey}
              className={`flex md:flex-col items-start mb-8 md:mb-0 relative md:w-1/5`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
            >
              <div
                className={`rounded-full p-3 mr-4 md:mr-0 md:mb-4 md:self-center flex-shrink-0 w-12 h-12 flex items-center justify-center transition-colors duration-300 ${
                  index <= activeStep
                    ? "bg-[hsl(var(--primary-accent))]"
                    : "bg-gray-200"
                }`}
              >
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <div className="md:text-center flex-grow">
                <h3
                  className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                    index <= activeStep
                      ? "text-[hsl(var(--primary-accent))]"
                      : "text-gray-400"
                  }`}
                >
                  {t(step.titleKey)}
                </h3>
                <p
                  className={`transition-colors duration-300 ${
                    index <= activeStep ? "text-gray-600" : "text-gray-400"
                  } text-sm md:text-base`}
                >
                  {t(step.descriptionKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom ref div */}
        <div className="w-full h-1" ref={bottomRef} />

        <AnimatePresence>
          {showFAQ && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5 }}
              className="container mx-auto px-4 py-16 pb-32"
            >
              <h2 className="text-4xl font-bold mb-12 text-center">
                {t("yourQuestions")}{" "}
                <span className="text-gray-500">{t("answered")}</span>
              </h2>
              <div className="max-w-4xl mx-auto space-y-4">
                {faqItems.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="border-b border-gray-200"
                  >
                    <button
                      className="w-full text-left flex justify-between items-center py-4"
                      onClick={() =>
                        setOpenIndex(openIndex === index ? null : index)
                      }
                      aria-expanded={openIndex === index}
                    >
                      <h3 className="text-lg font-medium">
                        {t(item.questionKey)}
                      </h3>
                      <div
                        className={`text-[hsl(var(--primary-accent))] transition-transform duration-200 ${
                          openIndex === index ? "rotate-45" : ""
                        }`}
                      >
                        +
                      </div>
                    </button>
                    <motion.div
                      initial={false}
                      animate={{
                        height: openIndex === index ? "auto" : 0,
                        opacity: openIndex === index ? 1 : 0,
                        marginBottom: openIndex === index ? 16 : 0,
                      }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                      }}
                      className="overflow-hidden"
                    >
                      <div className="text-gray-600">{t(item.answerKey)}</div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom ref div */}
        <div className="w-full h-1" ref={bottomRef} />

        {/* Banner */}
        <AnimatePresence>
          {showBanner && showFAQ && (
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md p-4 flex justify-center items-center"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="text-white text-center pb-safe">
                <p className="text-lg font-semibold mb-2">
                  {t("readyToExplore")}
                </p>
                <motion.button
                  className="bg-white text-black px-6 py-2 rounded-full inline-flex items-center gap-2 hover:bg-opacity-90 transition-colors"
                  onClick={() => router.push("/what-we-do")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t("whatWeDoButton")}
                  <ArrowRight size={20} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
