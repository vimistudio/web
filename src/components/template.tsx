"use client";

import { Header } from "./header";
import { LoadingOverlay } from "@/components/loading-overlay";
import type React from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageProvider } from "@/contexts/language-context";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [mounted, setMounted] = useState(false);
  const [showInitialLoader, setShowInitialLoader] = useState(false);

  useEffect(() => {
    if (!isHomepage) {
      setShowInitialLoader(false);
      setMounted(true);
      return;
    }

    setShowInitialLoader(true);
    setMounted(true);
  }, [isHomepage]);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[var(--bg-color)] flex flex-col overflow-x-hidden">
        {isHomepage && showInitialLoader && (
          <LoadingOverlay shouldShow={true} />
        )}
        <Header />
        <div className="flex-1 flex flex-col">{children}</div>
      </div>
    </LanguageProvider>
  );
}
