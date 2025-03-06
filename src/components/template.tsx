"use client";

import { Header } from "./header";
import { LoadingOverlay } from "@/components/loading-overlay";
import { LanguageToggle } from "@/components/language-toggle";
import type React from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageProvider } from "@/contexts/language-context";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [mounted, setMounted] = useState(false);
  const [showInitialLoader, setShowInitialLoader] = useState(false);
  const [showLanguageToggle, setShowLanguageToggle] = useState(false);

  useEffect(() => {
    if (!isHomepage) {
      setShowInitialLoader(false);
      setMounted(true);
      setShowLanguageToggle(true);
      return;
    }

    setShowInitialLoader(true);
    setMounted(true);

    // Hide language toggle during loading, then show it after loading completes (2s to be safe)
    setShowLanguageToggle(false);
    const timer = setTimeout(() => {
      setShowLanguageToggle(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isHomepage]);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[var(--bg-color)] flex flex-col overflow-x-hidden">
        {isHomepage && showInitialLoader && (
          <LoadingOverlay shouldShow={true} />
        )}
        <Header />

        {/* Show language toggle based on dedicated state */}
        {mounted && showLanguageToggle && (
          <LanguageToggle isHomepage={isHomepage} />
        )}

        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </LanguageProvider>
  );
}
