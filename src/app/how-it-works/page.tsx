"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Phone, Users, Palette, Zap, Package, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

const faqItems = [
  {
    question: "WHAT HAPPENS IF MY PROJECT SCOPE CHANGES MID-WAY?",
    answer:
      "We understand that project requirements can evolve. We maintain flexible processes to accommodate changes while ensuring timeline and budget transparency.",
  },
  {
    question: "CAN YOU COLLABORATE WITH OUR IN-HOUSE TEAM?",
    answer:
      "Absolutely! We regularly work alongside in-house teams, providing complementary expertise and seamless integration with your existing workflows.",
  },
  {
    question: "WHY NOT HIRE DESIGNERS FULL-TIME?",
    answer:
      "Our specialized team brings diverse expertise and proven processes, offering flexibility and cost-effectiveness compared to full-time hires.",
  },
  {
    question: "VIMISTUDIO VS OTHER CONTRACTORS",
    answer:
      "We combine agency-quality design with the personal attention of freelancers, delivering consistent results through our established process.",
  },
  {
    question: "HOW DO YOU CHARGE?",
    answer:
      "We offer transparent, project-based pricing with clear deliverables. Contact us for a custom quote based on your specific needs.",
  },
  {
    question:
      "DO YOU HANDLE CONTENT CREATION, OR SHOULD WE PROVIDE COPY AND VISUALS?",
    answer:
      "We can handle both. While you're welcome to provide content, we also offer comprehensive content creation services to ensure cohesive design and messaging.",
  },
  {
    question: "WHAT IF I ONLY NEED A SMALL DESIGN TASK?",
    answer:
      "We handle projects of all sizes. Our flexible approach allows us to scale our services to match your specific needs.",
  },
  {
    question: "HOW SOON CAN YOU START?",
    answer:
      "We typically can begin new projects within 1-2 weeks. Contact us to discuss your timeline and requirements.",
  },
];

const processSteps = [
  {
    icon: Phone,
    title: "Request a Quote or Book a Call",
    description: "Get in touch with us to discuss your project needs.",
  },
  {
    icon: Users,
    title: "Kickoff Call",
    description: "We'll dive deep into your vision and requirements.",
  },
  {
    icon: Palette,
    title: "Moodboards and Feedback",
    description: "We'll create initial designs and gather your feedback.",
  },
  {
    icon: Zap,
    title: "Design Sprint Iteration",
    description: "Rapid iterations to refine and perfect the design.",
  },
  {
    icon: Package,
    title: "Final Design Delivery",
    description: "Receive your polished, ready-to-use design.",
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);

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
        if (prev === processSteps.length - 2) {
          // Trigger confetti on the last step
          setTimeout(() => {
            triggerConfetti();
            setShowFAQ(true); // Show FAQ after confetti
          }, 500); // Small delay to allow the last step to animate
        }
        return prev + 1;
      });
    }, 2000);

    return () => clearInterval(timer);
  }, [triggerConfetti]); // Added triggerConfetti to dependencies

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
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">
          HOW IT WORKS
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

          {processSteps.map((step, index) => (
            <motion.div
              key={step.title}
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
                  {step.title}
                </h3>
                <p
                  className={`transition-colors duration-300 ${
                    index <= activeStep ? "text-gray-600" : "text-gray-400"
                  } text-sm md:text-base`}
                >
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Invisible div to trigger the banner */}
        <div ref={bottomRef} className="h-1 w-full" />

        <AnimatePresence>
          {showBanner && showFAQ && (
            <motion.div
              className="fixed bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md p-4 flex justify-center items-center"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="text-white text-center pb-safe">
                <p className="text-lg font-semibold mb-2">
                  Ready to explore what we can do for you?
                </p>
                <motion.button
                  className="bg-white text-black px-6 py-2 rounded-full inline-flex items-center gap-2 hover:bg-opacity-90 transition-colors"
                  onClick={() => router.push("/what-we-do")}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  What We Do
                  <ArrowRight size={20} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invisible div to trigger the banner */}
        <div ref={bottomRef} className="h-1 w-full" />

        <AnimatePresence>
          {showFAQ && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 0.5 }}
              className="container mx-auto px-4 py-16"
            >
              <h2 className="text-4xl font-bold mb-12 text-center">
                YOUR QUESTIONS, <span className="text-gray-500">ANSWERED.</span>
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
                      <h3 className="text-lg font-medium">{item.question}</h3>
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
                      <div className="text-gray-600">{item.answer}</div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
