"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Download01Icon } from "@/components/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ImageLightbox } from "@/components/portal/image-lightbox";
import { useLocale } from "./locale-provider";

interface Deliverable {
  id: string;
  request_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  url: string | null;
  requests: {
    title: string;
    type: string;
    status: string;
    client_id: string;
  };
}

interface GalleryViewProps {
  clientName: string;
  deliverables: Deliverable[];
}

const filterChipKeys = ["all", "logo", "social", "web", "brand", "presentation", "other"] as const;

const typeGradients: Record<string, string> = {
  logo: "from-purple-300/80 to-purple-200/40",
  social: "from-pink-300/80 to-[#c4b896]",
  web: "from-[#5a7a5a] to-[#c4b896]",
  brand: "from-[#6a7a5a] to-[#8a9a6a]",
  presentation: "from-emerald-300/80 to-emerald-200/40",
  other: "from-gray-300/80 to-gray-200/40",
};

function GalleryImageCard({
  d,
  height,
  gradient,
  deliveredDate,
  deliveredLabel,
  onImageClick,
}: {
  d: Deliverable;
  height: string;
  gradient: string;
  deliveredDate: string;
  deliveredLabel: string;
  onImageClick?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);

  const card = (
    <Card className="break-inside-avoid overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
      <div
        className={`${d.url ? "" : `${height} `}relative overflow-hidden ${d.url ? "" : `bg-gradient-to-b ${gradient}`}`}
      >
        {d.url && (
          <>
            {!loaded && (
              <div className="animate-pulse bg-gray-200 rounded-t-lg h-40" />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={d.url}
              alt={d.file_name}
              className={`w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setLoaded(true)}
            />
          </>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end justify-end p-2 md:items-center md:justify-center">
          <div className="w-8 h-8 md:w-auto md:h-auto flex items-center justify-center rounded-full bg-black/30 md:bg-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <Download01Icon
              size={20}
              className="text-white drop-shadow-md"
            />
          </div>
        </div>
      </div>
      <CardContent className="p-3">
        <p className="text-sm font-medium truncate">{d.requests.title}</p>
        <p className="text-xs text-muted-foreground">
          {deliveredLabel} {deliveredDate}
        </p>
      </CardContent>
    </Card>
  );

  if (onImageClick) {
    return (
      <button type="button" className="w-full text-left" onClick={onImageClick}>
        {card}
      </button>
    );
  }

  return (
    <Link href={`/portal/requests/${d.request_id}`}>{card}</Link>
  );
}

export function GalleryView({ clientName, deliverables }: GalleryViewProps) {
  const { t } = useLocale();
  const [filter, setFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const pathname = usePathname();

  const filterChipLabels: Record<string, string> = {
    all: t("gallery.all"),
    logo: t("gallery.filter.logos"),
    social: t("gallery.filter.social"),
    web: t("gallery.filter.web"),
    brand: t("gallery.filter.brand"),
    presentation: t("gallery.filter.presentation"),
    other: t("gallery.filter.other"),
  };

  const filtered =
    filter === "all"
      ? deliverables
      : deliverables.filter((d) => d.requests.type === filter);

  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  const groups = new Map<string, Deliverable[]>();
  sorted.forEach(d => {
    const key = new Date(d.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  });

  // Build image list for lightbox from the current sorted set
  const lightboxImages = sorted
    .filter((d) => d.mime_type?.startsWith("image/") && d.url)
    .map((d) => ({
      url: d.url!,
      fileName: d.file_name,
      fileSize: d.file_size,
      mimeType: d.mime_type,
    }));

  const deliveredDate = (d: Deliverable) =>
    new Date(d.created_at).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {clientName}
            </h1>
            <span className="text-sm text-muted-foreground hidden md:inline">
              {deliverables.length}{" "}
              {deliverables.length === 1 ? t("gallery.deliverable") : t("gallery.deliverables")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground md:hidden">
            {deliverables.length}{" "}
            {deliverables.length === 1 ? t("gallery.deliverable") : t("gallery.deliverables")}
          </p>
        </div>

        {/* Board / Gallery toggle — desktop */}
        <div className="hidden md:flex gap-1 bg-[#f0eeec] rounded-lg p-1">
          <Link
            href="/portal"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === "/portal"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("tab.board")}
          </Link>
          <Link
            href="/portal/gallery"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === "/portal/gallery"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("tab.gallery")}
          </Link>
        </div>
      </div>

      {/* Mobile: Board/Gallery tabs */}
      <div className="flex gap-4 border-b md:hidden">
        <Link
          href="/portal"
          className="pb-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground"
        >
          {t("tab.board")}
        </Link>
        <Link
          href="/portal/gallery"
          className="pb-2 text-sm font-semibold border-b-2 border-foreground text-foreground"
        >
          {t("tab.gallery")}
        </Link>
      </div>

      {/* Filter Chips + Sort Toggle */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {filterChipKeys.map((key) => {
          const isActive = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2.5 md:py-1.5 rounded-full text-sm whitespace-nowrap shrink-0 transition-colors min-h-[44px] md:min-h-0 ${
                isActive
                  ? "bg-foreground text-white"
                  : "bg-[#f0eeec] text-muted-foreground hover:bg-gray-200"
              }`}
            >
              {filterChipLabels[key]}
            </button>
          );
        })}
        <button
          onClick={() => setSortOrder(s => s === "newest" ? "oldest" : "newest")}
          className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full bg-[#f0eeec] shrink-0 transition-colors"
        >
          {sortOrder === "newest" ? t("gallery.newest") : t("gallery.oldest")}
        </button>
      </div>

      {/* Masonry Grid — grouped by month */}
      {sorted.length > 0 ? (
        <div>
          {Array.from(groups.entries()).map(([monthLabel, items]) => (
            <div key={monthLabel}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{monthLabel}</h3>
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 mb-8">
                {items.map((d, i) => {
                  const heights = [
                    "h-40",
                    "h-52",
                    "h-44",
                    "h-56",
                    "h-48",
                    "h-36",
                    "h-60",
                  ];
                  const height = heights[i % heights.length];
                  const gradient =
                    typeGradients[d.requests.type] ?? typeGradients.other;

                  const isImage = d.mime_type?.startsWith("image/") && d.url;
                  const imageIndex = isImage
                    ? lightboxImages.findIndex((img) => img.url === d.url)
                    : -1;

                  return (
                    <GalleryImageCard
                      key={d.id}
                      d={d}
                      height={height}
                      gradient={gradient}
                      deliveredDate={deliveredDate(d)}
                      deliveredLabel={t("gallery.delivered")}
                      onImageClick={
                        imageIndex >= 0
                          ? () => {
                              setLightboxIndex(imageIndex);
                              setLightboxOpen(true);
                            }
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            {filter === "all"
              ? t("gallery.empty")
              : t("gallery.emptyFiltered", { type: filterChipLabels[filter] ?? filter })}
          </p>
        </div>
      )}

      {/* Image Lightbox */}
      {lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}
    </div>
  );
}
