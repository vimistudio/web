"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";

const industries = [
  "AI",
  "Fintech",
  "SaaS",
  "Emerging tech",
  "web3",
  "e-com",
  "BI",
  "Real estate",
  "Health tech",
  "EdTech",
  "Enterprise",
  "Startups",
];

const services = [
  "UX Research",
  "Web/mobile app design",
  "Visual design",
  "Branding",
  "MVPs",
  "Motion",
  "Design systems",
  "Pitch decks",
  "UX copywriting",
];

const timeframes = [
  { service: "Brand sprints", duration: "1-2 weeks" },
  { service: "MVPs", duration: "1-3 months" },
  { service: "Websites", duration: "2-10 weeks" },
  { service: "Design systems", duration: "2-6 weeks" },
  { service: "UX audits", duration: "1-4 weeks" },
];

const techStack = [
  {
    name: "Figma",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg",
  },
  {
    name: "Notion",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/notion/notion-original.svg",
  },
  {
    name: "Tailwind",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg",
  },
  {
    name: "Next.js",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg",
  },
  {
    name: "React",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  },
  {
    name: "Slack",
    icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/slack/slack-original.svg",
  },
];

export default function WhatWeDo() {
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowBanner(true);
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
  }, []);

  return (
    <motion.main
      key="what-we-do"
      className="flex-1 flex flex-col items-center py-12 md:pt-24 lg:pt-32 relative"
      role="main"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 mb-8 md:mb-16">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-12 bg-[#F5F5F5] rounded-3xl p-8"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-500 mb-4">
                WHO WE WORK WITH:
              </h3>
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <motion.div
                    key={industry}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <Button
                      variant="outline"
                      className="rounded-full border border-dashed hover:border-solid hover:bg-[#777EF0] hover:text-white transition-all"
                    >
                      {industry}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-500 mb-4">
                OUR TECH STACK:
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
                {techStack.map((tech) => (
                  <motion.div
                    key={tech.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 relative bg-gray-100 rounded-xl p-2">
                      <Image
                        src={tech.icon || "/placeholder.svg"}
                        alt={`${tech.name} icon`}
                        width={32}
                        height={32}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-sm text-gray-600">{tech.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-12 bg-[#111111] text-white rounded-3xl p-8"
          >
            <div>
              <h3 className="text-lg font-medium text-gray-400 mb-4">
                WHAT WE DO:
              </h3>
              <div className="flex flex-wrap gap-2">
                {services.map((service) => (
                  <motion.div
                    key={service}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    viewport={{ once: true }}
                  >
                    <Button
                      variant="secondary"
                      className="rounded-full bg-white/10 hover:bg-[#777EF0] border-none"
                    >
                      {service}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-400 mb-4">
                HOW FAST WE DO IT:
              </h3>
              <div className="grid gap-2">
                {timeframes.map(({ service, duration }) => (
                  <motion.div
                    key={service}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-2"
                  >
                    <Button
                      variant="secondary"
                      className="rounded-full bg-white/10 hover:bg-[#777EF0] border-none flex-grow text-left justify-start"
                    >
                      {service}: {duration}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Invisible div to trigger the banner */}
      <div ref={bottomRef} className="h-1 w-full" />

      <AnimatePresence>
        {showBanner && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#5046c0] to-[#3d3599] p-4 flex justify-center items-center"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="text-white text-center pb-safe">
              <p className="text-lg font-semibold mb-2">
                Ready to bring your vision to life?
              </p>
              <motion.button
                className="bg-white text-[#5046c0] px-6 py-2 rounded-full inline-flex items-center gap-2 hover:bg-opacity-90 transition-colors"
                onClick={() => router.push("/start-project")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Your Project
                <ArrowRight size={20} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
