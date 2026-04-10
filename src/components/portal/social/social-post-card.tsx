"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download01Icon } from "@/components/ui/icons";
import { InstagramCarouselPreview } from "./instagram-carousel-preview";

interface SocialPostCardProps {
  slides: { url: string; alt?: string }[];
  handle: string;
  caption?: string;
  coverUrl: string | null;
  title: string;
}

export function SocialPostCard({
  slides,
  handle,
  caption,
  coverUrl,
  title,
}: SocialPostCardProps) {
  const [open, setOpen] = useState(false);

  const handleDownloadAll = async () => {
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      try {
        const res = await fetch(slide.url);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `slide-${String(i + 1).padStart(2, "0")}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        // skip failed downloads
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer group relative overflow-hidden rounded-lg">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-52 bg-gradient-to-br from-pink-300/80 to-[#c4b896] flex items-center justify-center">
              <span className="text-white text-sm font-medium">{title}</span>
            </div>
          )}
          {/* Carousel indicator */}
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <rect x="6" y="6" width="20" height="20" rx="2" opacity="0.5" />
            </svg>
            <span className="text-white text-[10px] font-medium">
              {slides.length}
            </span>
          </div>
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-medium">View Carousel</span>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-[440px] p-4 bg-[#111] border-none">
        <InstagramCarouselPreview
          slides={slides}
          handle={handle}
          caption={caption}
          subtitle="Instagram Carousel"
        />
        <div className="flex justify-center mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadAll}
            className="text-white border-white/20 hover:bg-white/10"
          >
            <Download01Icon className="w-4 h-4 mr-2" />
            Download All ({slides.length} slides)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
