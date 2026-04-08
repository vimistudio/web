"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Download01Icon } from "@hugeicons-pro/core-stroke-rounded";

interface Deliverable {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
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

const typeColors: Record<string, string> = {
  logo: "from-purple-200 to-purple-100",
  social: "from-pink-200 to-pink-100",
  web: "from-blue-200 to-blue-100",
  brand: "from-amber-200 to-amber-100",
  presentation: "from-emerald-200 to-emerald-100",
  other: "from-gray-200 to-gray-100",
};

export function GalleryView({ clientName, deliverables }: GalleryViewProps) {
  const [filter, setFilter] = useState("all");

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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{clientName}</h1>
        <p className="text-sm text-muted-foreground">
          {deliverables.length}{" "}
          {deliverables.length === 1 ? "deliverable" : "deliverables"}
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {filterChips.map((chip) => {
          const isActive = filter === chip.key;
          const count =
            chip.key === "all"
              ? deliverables.length
              : deliverables.filter((d) => d.requests.type === chip.key).length;

          return (
            <button
              key={chip.key}
              onClick={() => setFilter(chip.key)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? "bg-foreground text-white"
                  : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
              }`}
            >
              {chip.label}
              {count > 0 && !isActive && (
                <span className="ml-1 text-xs">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Pinterest Masonry Grid */}
      {filtered.length > 0 ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {filtered.map((d, i) => {
            // Vary heights for masonry effect
            const heights = ["h-40", "h-56", "h-48", "h-64", "h-44"];
            const height = heights[i % heights.length];
            const gradient =
              typeColors[d.requests.type] ?? typeColors.other;

            return (
              <Card
                key={d.id}
                className="break-inside-avoid overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
              >
                {/* Placeholder gradient — will be replaced with actual thumbnails */}
                <div
                  className={`${height} bg-gradient-to-b ${gradient} relative`}
                >
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
