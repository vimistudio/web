"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Real IG truncates captions to ~125 chars on first view, with "...more" link.
function CaptionBlock({ caption, handle }: { caption: string; handle: string }) {
  const [expanded, setExpanded] = useState(false);
  const TRUNCATE_AT = 125;
  const isLong = caption.length > TRUNCATE_AT;
  const display = !expanded && isLong ? caption.slice(0, TRUNCATE_AT).trimEnd() : caption;
  return (
    <div className="px-3.5 pb-3.5 text-[13px] text-gray-900 leading-relaxed">
      <span className="font-semibold">{handle}</span>{" "}
      <span className="whitespace-pre-wrap">{display}</span>
      {isLong && !expanded && (
        <>
          <span>… </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(true);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            more
          </button>
        </>
      )}
      {isLong && expanded && (
        <>
          {" "}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(false);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            less
          </button>
        </>
      )}
      <span className="block text-[10px] text-gray-400 tracking-wide mt-1">
        HACE 1 HORA
      </span>
    </div>
  );
}

interface CarouselSlide {
  url: string;
  alt?: string;
}

interface InstagramCarouselPreviewProps {
  slides: CarouselSlide[];
  handle: string;
  caption?: string;
  avatarUrl?: string;
  subtitle?: string;
  variant?: "full" | "card";
}

export function InstagramCarouselPreview({
  slides,
  handle,
  caption,
  avatarUrl,
  subtitle,
  variant = "full",
}: InstagramCarouselPreviewProps) {
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [scale, setScale] = useState(1);
  const vpRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const total = slides.length;

  // Compute scale factor: container width / 1080
  useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setScale(entry.contentRect.width / 1080);
      }
    });
    observer.observe(vp);
    return () => observer.disconnect();
  }, []);

  const goTo = useCallback(
    (n: number) => {
      setCurrent(Math.max(0, Math.min(total - 1, n)));
    },
    [total]
  );

  // Pointer-drag swipe (not Embla — scale transforms break Embla's DOM measurements)
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setDragX(0);
    if (trackRef.current) trackRef.current.style.transition = "none";
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragX(e.clientX - startX);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (trackRef.current) trackRef.current.style.transition = "";
    if (dragX < -50) goTo(current + 1);
    else if (dragX > 50) goTo(current - 1);
    setDragX(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(current + 1);
      if (e.key === "ArrowLeft") goTo(current - 1);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [current, goTo]);

  const trackTransform = isDragging
    ? `translateX(calc(-${current * 100}% + ${dragX}px))`
    : `translateX(-${current * 100}%)`;

  const isCard = variant === "card";

  return (
    <div
      className={`bg-white overflow-hidden ${
        isCard ? "rounded-lg" : "rounded-xl shadow-2xl"
      }`}
      style={{ width: isCard ? "100%" : "min(390px, 100%)" }}
    >
      {/* IG Header */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-[2px] flex-shrink-0">
          <div className="w-full h-full rounded-full bg-white p-[1px]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={handle}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                {handle.replace("@", "").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-gray-900 leading-tight truncate">
            {handle.replace("@", "")}
          </div>
          {subtitle && (
            <div className="text-[11px] text-gray-400 leading-tight truncate">
              {subtitle}
            </div>
          )}
        </div>
        <div className="text-gray-400 text-lg px-1 cursor-pointer select-none">
          ···
        </div>
      </div>

      {/* IG Viewport — 4:5 aspect ratio */}
      <div
        ref={vpRef}
        className="relative w-full bg-black select-none"
        style={{
          aspectRatio: "4 / 5",
          cursor: isDragging ? "grabbing" : "grab",
          overflow: "hidden",
          touchAction: "pan-y",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          ref={trackRef}
          className="flex h-full"
          style={{
            transform: trackTransform,
            transition: isDragging
              ? "none"
              : "transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            willChange: "transform",
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.url + i}
              className="flex-shrink-0 h-full relative"
              style={{ flexBasis: "100%", width: "100%" }}
            >
              {/* Slide scaler: 1080x1350 scaled to fit viewport */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: 1080,
                  height: 1350,
                  transformOrigin: "top left",
                  transform: `scale(${scale})`,
                }}
              >
                <img
                  src={slide.url}
                  alt={slide.alt || `Slide ${i + 1}`}
                  draggable={false}
                  style={{
                    width: 1080,
                    height: 1350,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      {total > 1 && (
        <div className="flex justify-center gap-[5px] py-2.5 border-b border-gray-100">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-200"
              style={{
                width: i === current ? 16 : 6,
                height: 6,
                borderRadius: i === current ? 3 : "50%",
                background: i === current ? "#3897f0" : "#dbdbdb",
              }}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center px-3.5 pt-2.5 pb-1.5 gap-3.5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-gray-900"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-gray-900"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-gray-900"
        >
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-gray-900 ml-auto"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      {/* Caption — truncated like real Instagram (~125 chars), expandable */}
      {caption && (
        <CaptionBlock caption={caption} handle={handle.replace("@", "")} />
      )}
    </div>
  );
}
