"use client";

import { Header } from "./header";
import { LoadingOverlay } from "@/components/loading-overlay";
import type React from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
    <div className="min-h-screen bg-[#F3F2F1] flex flex-col">
      {isHomepage && showInitialLoader && <LoadingOverlay shouldShow={true} />}
      <Header />
      {children}
    </div>
  );
}
