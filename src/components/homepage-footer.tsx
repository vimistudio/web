"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";

export function HomepageFooter() {
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState({
    seattle: "",
    elSalvador: "",
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

        setCurrentTime({
          seattle: seattleTime,
          elSalvador: elSalvadorTime,
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

  return (
    <footer className="bg-black text-white w-full mt-auto">
      {/* Top Row */}
      <div className="max-w-7xl mx-auto border-b border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-3 py-3 text-xs sm:text-sm font-mono">
          <div className="px-4 text-center md:text-left mb-2 md:mb-0">
            SEATTLE | {currentTime.seattle} GMT-7
          </div>
          <div className="flex items-center justify-center space-x-2 mb-2 md:mb-0">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>{bookingText}</span>
          </div>
          <div className="px-4 text-center md:text-right">
            EL SALVADOR | {currentTime.elSalvador} GMT-6
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center py-4 px-4">
          <div className="text-gray-400 text-xs sm:text-sm font-mono text-center md:text-left mb-4 md:mb-0">
            © VIMI STUDIO {new Date().getFullYear()}. <br></br>
            {t("allRightsReserved")}
          </div>
          <div className="flex justify-center mb-4 md:mb-0">
            <Image
              src="/logo-vimi.png"
              alt="Vimi Studio"
              width={40}
              height={40}
              className="h-6 w-auto transition-transform duration-300 hover:scale-125"
            />
          </div>
          <div className="flex justify-center md:justify-end space-x-6 text-xs sm:text-sm font-mono">
            <Link
              href="https://instagram.com/vimistudioteam"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              INSTAGRAM
            </Link>
            <Link
              href="https://x.com/vimistudio/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              X
            </Link>
            <Link
              href="https://www.linkedin.com/company/vimistudioteam/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              LINKEDIN
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
