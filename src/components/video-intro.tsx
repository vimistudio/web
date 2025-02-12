"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { storage } from "@/lib/storage";

export function VideoIntro({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnded, setIsVideoEnded] = useState(false);
  const [shouldPlayVideo, setShouldPlayVideo] = useState(false);

  useEffect(() => {
    // Check if video has been seen before
    if (storage.hasSeenVideo()) {
      onComplete();
      return;
    }

    setShouldPlayVideo(true);
  }, [onComplete]);

  useEffect(() => {
    if (!shouldPlayVideo) return;

    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        await video.play();
      } catch (error) {
        console.error('Video playback failed:', error);
        handleVideoEnd();
      }
    };

    const handleVideoEnd = () => {
      setIsVideoEnded(true);
      storage.markVideoAsSeen();
      setTimeout(() => {
        onComplete();
      }, 1000);
    };

    video.addEventListener("ended", handleVideoEnd);
    playVideo();

    return () => {
      video.removeEventListener("ended", handleVideoEnd);
      video.pause();
      video.currentTime = 0;
    };
  }, [shouldPlayVideo, onComplete]);

  if (!shouldPlayVideo) return null;

  return (
    <AnimatePresence>
      {!isVideoEnded && (
        <motion.div
          className="fixed inset-0 z-[60] bg-[#fbfafa] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
        >
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          >
            <source src="/hands-overlay.mp4" type="video/mp4" />
          </video>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
