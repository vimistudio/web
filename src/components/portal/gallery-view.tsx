"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Download01Icon } from "@/components/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

const filterChips = [
  { key: "all", label: "All" },
  { key: "logo", label: "Logos" },
  { key: "social", label: "Social" },
  { key: "web", label: "Web" },
  { key: "brand", label: "Brand" },
];

const typeGradients: Record<string, string> = {
  logo: "from-purple-300/80 to-purple-200/40",
  social: "from-pink-300/80 to-[#c4b896]",
  web: "from-[#5a7a5a] to-[#c4b896]",
  brand: "from-[#6a7a5a] to-[#8a9a6a]",
  presentation: "from-emerald-300/80 to-emerald-200/40",
  other: "from-gray-300/80 to-gray-200/40",
};

export function GalleryView({ clientName, deliverables }: GalleryViewProps) {
  const [filter, setFilter] = useState("all");
  const pathname = usePathname();

  const filtered =
    filter === "all"
      ? deliverables
      : deliverables.filter((d) => d.requests.type === filter);

  const deliveredDate = (d: Deliverable) =>
    new Date(d.created_at).toLocaleDateString("en-US", {
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
              {deliverables.length === 1 ? "deliverable" : "deliverables"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground md:hidden">
            {deliverables.length}{" "}
            {deliverables.length === 1 ? "deliverable" : "deliverables"}
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
            Board
          </Link>
          <Link
            href="/portal/gallery"
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              pathname === "/portal/gallery"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Gallery
          </Link>
        </div>
      </div>

      {/* Mobile: Board/Gallery tabs */}
      <div className="flex gap-4 border-b md:hidden">
        <Link
          href="/portal"
          className="pb-2 text-sm font-medium border-b-2 border-transparent text-muted-foreground"
        >
          Board
        </Link>
        <Link
          href="/portal/gallery"
          className="pb-2 text-sm font-semibold border-b-2 border-foreground text-foreground"
        >
          Gallery
        </Link>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {filterChips.map((chip) => {
          const isActive = filter === chip.key;
          return (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? "bg-foreground text-white"
                  : "bg-[#f0eeec] text-muted-foreground hover:bg-gray-200"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Masonry Grid */}
      {filtered.length > 0 ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {filtered.map((d, i) => {
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

            return (
              <Link href={`/portal/requests/${d.request_id}`} key={d.id}>
              <Card
                className="break-inside-avoid overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
              >
                <div
                  className={`${height} relative overflow-hidden ${d.url ? "" : `bg-gradient-to-b ${gradient}`}`}
                >
                  {d.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.url}
                      alt={d.file_name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <Download01Icon
                      size={20}
                      className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                    />
                  </div>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate">
                    {d.requests.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Delivered {deliveredDate(d)}
                  </p>
                </CardContent>
              </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            {filter === "all"
              ? "No deliverables yet. They'll appear here as designs are completed."
              : `No ${filter} deliverables yet.`}
          </p>
        </div>
      )}
    </div>
  );
}
