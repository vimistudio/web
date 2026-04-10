"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
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
  const touchStartX = useRef(0);

  // Sync initialIndex when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setImageLoaded(false);
      setControlsVisible(true);
    }
  }, [open, initialIndex]);

  // Close lightbox if images array becomes empty (e.g. realtime deletion)
  useEffect(() => {
    if (open && images.length === 0) {
      onOpenChange(false);
    }
  }, [open, images.length, onOpenChange]);

  // Clamp currentIndex if images array shrinks
  useEffect(() => {
    if (currentIndex >= images.length && images.length > 0) {
      setCurrentIndex(images.length - 1);
    }
  }, [currentIndex, images.length]);

  const total = images.length;
  const current = images[currentIndex] ?? images[0];
  const hasMultiple = total > 1;

  // Preload adjacent images for smoother navigation
  useEffect(() => {
    if (!open || total <= 1) return;
    const toPreload = [
      images[(currentIndex + 1) % total]?.url,
      images[(currentIndex - 1 + total) % total]?.url,
    ].filter(Boolean);
    toPreload.forEach((url) => {
      const img = new Image();
      img.src = url!;
    });
  }, [open, currentIndex, total, images]);

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
            className="absolute top-4 right-4 z-50 rounded-full bg-white/10 hover:bg-white/20 p-2.5 transition-colors"
            aria-label="Close lightbox"
          >
            <Cancel01Icon size={20} className="text-white" />
          </button>

          {/* Main image area */}
          <div
            ref={containerRef}
            className="relative flex-1 flex items-center justify-center w-full px-4 md:px-16"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const delta = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(delta) > 50) {
                if (delta > 0) {
                  goPrev();
                } else {
                  goNext();
                }
                resetHideTimer();
              }
            }}
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
                  <div
                    className="animate-pulse bg-white/5 rounded-lg"
                    style={{
                      width: "80vw",
                      maxWidth: "800px",
                      aspectRatio: "16/9",
                    }}
                  />
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

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {typeof navigator !== "undefined" && navigator.share && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(current.url);
                      const blob = await res.blob();
                      const file = new File([blob], current.fileName, { type: blob.type });
                      await navigator.share({ files: [file] });
                    } catch {
                      // User cancelled share — not an error
                    }
                  }}
                  className="flex items-center gap-2 bg-[#909af7] hover:bg-[#7b85e8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors sm:hidden"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  Share
                </button>
              )}
              <button
                onClick={() => {
                  // Safari requires clipboard.write in the same gesture tick.
                  // Passing a Promise to ClipboardItem avoids the async gap.
                  if (navigator.clipboard && window.ClipboardItem) {
                    const mimeType = current.mimeType || "image/png";
                    const blobPromise = fetch(current.url).then((res) => res.blob());
                    navigator.clipboard
                      .write([
                        new ClipboardItem({
                          [mimeType]: blobPromise,
                        }),
                      ])
                      .then(() => toast.success("Copied to clipboard"))
                      .catch(() => toast.error("Couldn't copy image"));
                  } else if (navigator.share) {
                    fetch(current.url)
                      .then((res) => res.blob())
                      .then((blob) => {
                        const file = new File([blob], current.fileName, { type: blob.type });
                        return navigator.share({ files: [file] });
                      })
                      .catch(() => toast.error("Couldn't share image"));
                  } else {
                    toast.error("Clipboard not supported in this browser");
                  }
                }}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span className="hidden sm:inline">Copy</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(current.url);
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = current.fileName;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch {
                    toast.error("Couldn't download file");
                  }
                }}
                className="flex items-center gap-2 bg-[#909af7] hover:bg-[#7b85e8] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Download01Icon size={16} />
                <span className="hidden sm:inline">Download</span>
              </button>
            </div>
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
