"use client"

import { Header } from "./header"
import { LoadingOverlay } from "@/app/_components/loading-overlay"
import { VideoIntro } from "@/components/video-intro"
import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHomepage = pathname === "/"
  const [mounted, setMounted] = useState(false)
  const [showVideoIntro, setShowVideoIntro] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true)
    }, 100) // Short delay to ensure smooth mounting

    return () => clearTimeout(timer)
  }, [])

  // Only show loading overlay on homepage
  if (!mounted && isHomepage) {
    return <LoadingOverlay shouldShow={true} />
  }

  return (
    <div className="min-h-screen bg-[#fbfafa] flex flex-col">
      {isHomepage && showVideoIntro && (
        <VideoIntro onComplete={() => setShowVideoIntro(false)} />
      )}
      {isHomepage && !showVideoIntro && <LoadingOverlay shouldShow={isHomepage} />}
      <Header />
      {children}
    </div>
  )
}
