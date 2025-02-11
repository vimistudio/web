"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Phone, Users, Palette, Zap, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";

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
  const router = useRouter();

  const triggerConfetti = () => {
    const colors = [
      "#777EF0",
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
          }, 500); // Small delay to allow the last step to animate
        }
        return prev + 1;
      });
    }, 4500); // Changed from 2000 to 1500

    return () => clearInterval(timer);
  }, [triggerConfetti]); // Added triggerConfetti to dependencies

  return (
    <motion.main
      key="how-it-works"
      className="flex-1 flex items-center"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">
          How It Works
        </h2>
        <div className="relative md:flex md:justify-between md:items-start">
          {/* Timeline line for mobile - moved before the steps */}
          <div className="absolute left-6 top-6 bottom-0 w-0.5 bg-gray-200 md:hidden">
            <motion.div
              className="absolute top-0 left-0 w-full bg-[#777EF0]"
              style={{ 
                originY: 0,
                height: `${((activeStep + 1) * 20)}%`,
              }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Timeline line for desktop - moved before the steps */}
          <div className="hidden md:block absolute top-5 left-[10%] right-[10%] h-0.5 bg-gray-200">
            <motion.div
              className="absolute top-0 left-0 h-full bg-[#777EF0]"
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
                  index <= activeStep ? "bg-[#777EF0]" : "bg-gray-200"
                }`}
              >
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <div className="md:text-center flex-grow">
                <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                  index <= activeStep ? "text-[#777EF0]" : "text-gray-400"
                }`}>
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
        <div className="mt-12 text-center space-x-4">
          <Button
            className="bg-[#111111] text-white hover:bg-[#777EF0] transition-colors rounded-full px-6 py-3 text-lg"
            onClick={() => router.push("/")}
          >
            Back to Home
          </Button>
          <Button
            className="bg-[#777EF0] text-white hover:bg-[#111111] transition-colors rounded-full px-6 py-3 text-lg"
            onClick={() => router.push("/what-we-do")}
          >
            What We Do
          </Button>
        </div>
      </div>
    </motion.main>
  );
}
