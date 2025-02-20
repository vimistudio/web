"use client";

import { motion } from "framer-motion";
import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect, useState } from "react";

export default function StartProject() {
  const [currentMonth, setCurrentMonth] = useState("");

  useEffect(() => {
    // Initialize Cal when the component mounts
    (async () => {
      const cal = await getCalApi();
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#777EF0" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();

    // Function to update the current month
    const updateMonth = () => {
      const now = new Date();
      const currentMonthName = now.toLocaleString("default", { month: "long" });
      const currentYear = now.getFullYear();
      setCurrentMonth(`${currentMonthName} ${currentYear}`);
    };

    // Initial update
    updateMonth();

    // Function to calculate milliseconds until the next month
    const getMillisecondsUntilNextMonth = () => {
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return nextMonth.getTime() - now.getTime();
    };

    // Set up the interval to update at the start of each month
    const setMonthUpdateInterval = () => {
      const msUntilNextMonth = getMillisecondsUntilNextMonth();

      // Set a timeout to update at the exact start of the next month
      const timeoutId = setTimeout(() => {
        updateMonth();
        // After updating, set up the next interval
        setMonthUpdateInterval();
      }, msUntilNextMonth);

      return timeoutId;
    };

    // Start the update cycle
    const timeoutId = setMonthUpdateInterval();

    // Cleanup function
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <motion.main
      key="start-project"
      className="flex-1 flex items-center justify-center py-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 px-4">
          Let's Create Something Remarkable
        </h1>
        <div className="flex flex-col items-center justify-center mb-8 px-4">
          <div className="flex items-center mb-2 sm:mb-0">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse flex-shrink-0"></div>
            <p className="text-lg sm:text-xl">Get in touch.</p>
          </div>
          <p className="text-lg sm:text-xl">
            New spots open for {currentMonth}.
          </p>
        </div>
        <div className="inline-block w-full max-w-4xl">
          <Cal
            calLink="vimistudio"
            style={{
              width: "100%",
              height: "100%",
              minHeight: "600px",
              position: "relative",
            }}
            config={{
              name: "Vimi Studio",
              styles: {
                branding: "#777EF0",
              },
            }}
          />
        </div>
      </div>
    </motion.main>
  );
}
