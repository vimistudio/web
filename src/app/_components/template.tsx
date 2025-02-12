"use client"

import { Header } from "./header"
import { LoadingOverlay } from "@/app/_components/loading-overlay"
import { VideoIntro } from "@/components/video-intro"
import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { storage } from "@/lib/storage"

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHomepage = pathname === "/"
  const [mounted, setMounted] = useState(false)
  const [showVideoIntro, setShowVideoIntro] = useState(false)
  const [showInitialLoader, setShowInitialLoader] = useState(true)

  useEffect(() => {
    if (!isHomepage) {
      setShowInitialLoader(false);
      setMounted(true);
      return;
    }

    // Show initial loader first
    const initialLoaderTimer = setTimeout(() => {
      setShowInitialLoader(false);
      // Only show video if user hasn't seen it
      if (!storage.hasSeenVideo()) {
        setShowVideoIntro(true);
      }
      setMounted(true);
    }, 1500);

    return () => clearTimeout(initialLoaderTimer);
  }, [isHomepage]);

  // Show initial loader
  if (showInitialLoader) {
    return <LoadingOverlay shouldShow={true} />
  }

  return (
    <div className="min-h-screen bg-[#fbfafa] flex flex-col">
      {isHomepage && showVideoIntro && (
        <VideoIntro onComplete={() => setShowVideoIntro(false)} />
      )}
      {isHomepage && !showVideoIntro && mounted && (
        <LoadingOverlay shouldShow={isHomepage} />
      )}
      <Header />
      {children}
    </div>
  )
}
