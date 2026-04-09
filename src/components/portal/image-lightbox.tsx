"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  Download01Icon,
} from "@/components/ui/icons";

// --- Types ---

interface LightboxImage {
  url: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Helpers ---

function formatFileSize(bytes: number | null): string {
  if (bytes == null || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// --- Component ---

export function ImageLightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync initialIndex when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setImageLoaded(false);
      setControlsVisible(true);
    }
  }, [open, initialIndex]);

  const total = images.length;
  const current = images[currentIndex] ?? images[0];
  const hasMultiple = total > 1;

  // --- Navigation ---

  const goNext = useCallback(() => {
    if (!hasMultiple) return;
    setImageLoaded(false);
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [hasMultiple, total]);

  const goPrev = useCallback(() => {
    if (!hasMultiple) return;
    setImageLoaded(false);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [hasMultiple, total]);

  // --- Auto-hide controls ---

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 2000);
  }, []);

  useEffect(() => {
    if (open) {
      resetHideTimer();
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [open, resetHideTimer]);

  // --- Keyboard ---

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
        resetHideTimer();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
        resetHideTimer();
      }
      // Escape is handled by Dialog
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goNext, goPrev, resetHideTimer]);

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/90 backdrop-blur-sm" />
        <DialogContent
          className="fixed inset-0 z-50 flex flex-col items-center justify-center border-none bg-transparent p-0 shadow-none max-w-none w-full h-full translate-x-0 translate-y-0 left-0 top-0 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 sm:rounded-none"
          onPointerMove={resetHideTimer}
          onPointerDown={resetHideTimer}
        >
          {/* Accessible title — visually hidden */}
          <DialogTitle className="sr-only">
            {current.fileName}
          </DialogTitle>

          {/* Close button */}
          <button
            onClick={() => onOpenChange(false)}
            className={`absolute top-4 right-4 z-50 rounded-full bg-white/10 hover:bg-white/20 p-2.5 transition-all duration-300 ${
              controlsVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            }`}
            aria-label="Close lightbox"
          >
            <Cancel01Icon size={20} className="text-white" />
          </button>

          {/* Main image area */}
          <div
            ref={containerRef}
            className="relative flex-1 flex items-center justify-center w-full px-4 md:px-16"
          >
            {/* Left arrow */}
            {hasMultiple && (
              <button
                onClick={() => {
                  goPrev();
                  resetHideTimer();
                }}
                className={`absolute left-2 md:left-6 z-40 rounded-full bg-white/10 hover:bg-white/20 p-2.5 transition-all duration-300 ${
                  controlsVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-2 pointer-events-none"
                }`}
                aria-label="Previous image"
              >
                <ArrowLeft01Icon size={24} className="text-white" />
              </button>
            )}

            {/* Image */}
            <div className="relative max-w-full max-h-[80vh] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={current.url}
                src={current.url}
                alt={current.fileName}
                className={`max-w-full max-h-[80vh] object-contain transition-opacity duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
                draggable={false}
              />
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Right arrow */}
            {hasMultiple && (
              <button
                onClick={() => {
                  goNext();
                  resetHideTimer();
                }}
                className={`absolute right-2 md:right-6 z-40 rounded-full bg-white/10 hover:bg-white/20 p-2.5 transition-all duration-300 ${
                  controlsVisible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 translate-x-2 pointer-events-none"
                }`}
                aria-label="Next image"
              >
                <ArrowRight01Icon size={24} className="text-white" />
              </button>
            )}
          </div>

          {/* Bottom bar: metadata + download */}
          <div
            className={`w-full flex items-center justify-between px-4 md:px-8 py-4 transition-all duration-300 ${
              controlsVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 pointer-events-none"
            }`}
          >
            {/* File info */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <p className="text-sm text-white/80 font-medium truncate">
                  {current.fileName}
                </p>
                <p className="text-xs text-white/40">
                  {[
                    formatFileSize(current.fileSize),
                    current.mimeType,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>

            {/* Center: position indicator */}
            {hasMultiple && (
              <span className="text-xs text-white/40 hidden sm:block">
                {currentIndex + 1} of {total}
              </span>
            )}

            {/* Download button */}
            <a
              href={current.url}
              download={current.fileName}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#909af7] hover:bg-[#7b85e8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              <Download01Icon size={16} />
              <span className="hidden sm:inline">Download</span>
            </a>
          </div>

          {/* Mobile position indicator */}
          {hasMultiple && (
            <span className="text-xs text-white/40 pb-4 sm:hidden">
              {currentIndex + 1} of {total}
            </span>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
