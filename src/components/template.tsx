"use client";

import { Header } from "./header";
import { LoadingOverlay } from "@/components/loading-overlay";
import { VideoIntro } from "@/components/video-intro";
import type React from "react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/";
  const [mounted, setMounted] = useState(false);
  const [showVideoIntro, setShowVideoIntro] = useState(false);
  const [showInitialLoader, setShowInitialLoader] = useState(false);

  useEffect(() => {
    if (!isHomepage) {
      setShowInitialLoader(false);
      setMounted(true);
      return;
    }

    const hasSeenVideo = storage.hasSeenVideo();

    if (!hasSeenVideo) {
      setShowVideoIntro(true);
    } else {
      setShowInitialLoader(true);
    }

    setMounted(true);
  }, [isHomepage]);

  return (
    <div className="min-h-screen bg-[#fbfafa] flex flex-col">
      {isHomepage && showVideoIntro && (
        <VideoIntro onComplete={() => setShowVideoIntro(false)} />
      )}
      {isHomepage && showInitialLoader && <LoadingOverlay shouldShow={true} />}
      <Header />
      {children}
    </div>
  );
}
