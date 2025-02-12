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

    const hasSeenVideo = storage.hasSeenVideo();

    // If we're on homepage and haven't seen the video, skip loader and show video
    if (!hasSeenVideo) {
      setShowInitialLoader(false);
      setShowVideoIntro(true);
      setMounted(true);
    } else {
      // If we've seen the video, show loader then content
      const initialLoaderTimer = setTimeout(() => {
        setShowInitialLoader(false);
        setMounted(true);
      }, 1500);

      return () => clearTimeout(initialLoaderTimer);
    }
  }, [isHomepage]);

  // Show initial loader only if video has been seen before
  if (showInitialLoader && storage.hasSeenVideo()) {
    return <LoadingOverlay shouldShow={true} />
  }

  return (
    <div className="min-h-screen bg-[#fbfafa] flex flex-col">
      {isHomepage && showVideoIntro && (
        <VideoIntro onComplete={() => setShowVideoIntro(false)} />
      )}
      {isHomepage && !showVideoIntro && mounted && storage.hasSeenVideo() && (
        <LoadingOverlay shouldShow={isHomepage} />
      )}
      <Header />
      {children}
    </div>
  )
}
