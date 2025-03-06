"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";
import { motion } from "framer-motion";

export function HomepageFooter() {
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState({
    seattle: "",
    elSalvador: "",
    madrid: "",
  });
  const [bookingText, setBookingText] = useState("");

  // Update the booking text
  useEffect(() => {
    const updateBookingText = () => {
      const today = new Date();
      const monthIndex = today.getMonth();
      const yearShort = today.getFullYear().toString().slice(2);

      // Get month abbreviation using i18n
      const monthKeys = [
        "jan",
        "feb",
        "mar",
        "apr",
        "may",
        "jun",
        "jul",
        "aug",
        "sep",
        "oct",
        "nov",
        "dec",
      ];
      const monthAbbr = t(monthKeys[monthIndex] as any);

      setBookingText(`${t("bookingFor")} ${monthAbbr}'${yearShort}`);
    };

    updateBookingText();
  }, [language, t]);

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      try {
        const seattleTime = new Date().toLocaleTimeString(
          language === "es" ? "es-ES" : "en-US",
          {
            timeZone: "America/Los_Angeles", // Seattle timezone
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }
        );

        const elSalvadorTime = new Date().toLocaleTimeString(
          language === "es" ? "es-ES" : "en-US",
          {
            timeZone: "America/El_Salvador", // El Salvador timezone
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }
        );

        const madridTime = new Date().toLocaleTimeString(
          language === "es" ? "es-ES" : "en-US",
          {
            timeZone: "Europe/Madrid", // Madrid timezone
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }
        );

        setCurrentTime({
          seattle: seattleTime,
          elSalvador: elSalvadorTime,
          madrid: madridTime,
        });
      } catch (error) {
        console.error("Error updating time:", error);
      }
    };

    // Initial update
    updateTime();

    // Set interval for updates
    const timer = setInterval(updateTime, 1000); // Update every second

    // Cleanup
    return () => clearInterval(timer);
  }, [language]);

  // Footer animation variants
  const footerVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 15,
        delay: 0.2,
        duration: 0.7,
      },
    },
  };

  return (
    <motion.footer
      className="w-full mt-auto relative overflow-hidden bg-gradient-to-r from-black via-gray-900 to-black"
      initial="hidden"
      animate="visible"
      variants={footerVariants}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-indigo-500/10 blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-purple-500/10 blur-3xl"></div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-8 relative z-10">
        {/* Top section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 space-y-8 md:space-y-0">
          {/* Logo and booking status in a single flex container */}
          <div className="flex flex-col sm:flex-row items-center space-y-8 sm:space-y-0 sm:space-x-12">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="flex-shrink-0"
            >
              <Image
                src="/logo-vimi.png"
                alt="Vimi Studio"
                width={60}
                height={60}
                className="h-10 w-auto"
              />
            </motion.div>

            {/* Booking status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="backdrop-blur-sm bg-white/5 rounded-full py-2 px-6 flex items-center space-x-3 border border-white/10 shadow-glow"
            >
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white font-mono tracking-wider text-sm">
                {bookingText}
              </span>
            </motion.div>
          </div>

          {/* Social links */}
          <div className="flex space-x-6">
            {[
              {
                href: "https://instagram.com/vimistudioteam",
                label: "INSTAGRAM",
              },
              { href: "https://x.com/vimistudio/", label: "X" },
              {
                href: "https://www.linkedin.com/company/vimistudioteam/",
                label: "LINKEDIN",
              },
            ].map((social) => (
              <motion.div key={social.label} whileHover={{ y: -3 }}>
                <Link
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-gray-400 hover:text-white transition-colors font-mono text-xs"
                >
                  {social.label}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Simple divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-8"></div>

        {/* Bottom section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Times */}
          <div className="flex flex-col sm:flex-row flex-wrap space-y-2 sm:space-y-0 sm:space-x-8 text-xs font-mono">
            <motion.div
              whileHover={{ letterSpacing: "0.05em" }}
              className="flex items-center space-x-2"
            >
              <div className="w-1 h-1 rounded-full bg-indigo-400"></div>
              <span className="text-gray-400">SEATTLE</span>
              <span className="text-white">{currentTime.seattle}</span>
            </motion.div>
            <motion.div
              whileHover={{ letterSpacing: "0.05em" }}
              className="flex items-center space-x-2"
            >
              <div className="w-1 h-1 rounded-full bg-purple-400"></div>
              <span className="text-gray-400">EL SALVADOR</span>
              <span className="text-white">{currentTime.elSalvador}</span>
            </motion.div>
            <motion.div
              whileHover={{ letterSpacing: "0.05em" }}
              className="flex items-center space-x-2"
            >
              <div className="w-1 h-1 rounded-full bg-pink-400"></div>
              <span className="text-gray-400">MADRID</span>
              <span className="text-white">{currentTime.madrid}</span>
            </motion.div>
          </div>

          {/* Copyright */}
          <div className="text-gray-500 text-xs items-center">
            © VIMI STUDIO {new Date().getFullYear()} <br></br>{" "}
            {t("allRightsReserved")}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
