"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusSignIcon, Comment01Icon } from "@/components/ui/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Request {
  id: string;
  title: string;
  description: string | null;
  type: "logo" | "social" | "web" | "brand" | "presentation" | "other";
  status: "queued" | "in_progress" | "review" | "done";
  priority: number;
  created_at: string;
  updated_at: string;
  deliverables: { id: string; file_path: string; mime_type: string | null }[];
  comments: { id: string }[];
}

interface ClientBoardProps {
  clientName: string;
  requests: Request[];
  requestCount: number;
}

const statusColumns = [
  { key: "in_progress" as const, label: "In Progress", color: "bg-blue-500" },
  { key: "queued" as const, label: "Queued", color: "bg-gray-400" },
  { key: "review" as const, label: "Review", color: "bg-amber-500" },
  { key: "done" as const, label: "Done", color: "bg-emerald-500" },
];

const typeColors: Record<string, string> = {
  logo: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
  web: "bg-blue-100 text-blue-700",
  brand: "bg-amber-100 text-amber-700",
  presentation: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
};

const typeGradients: Record<string, string> = {
  logo: "from-purple-300/60 to-purple-200/40",
  social: "from-pink-300/60 to-pink-200/40",
  web: "from-[#5a7a5a] to-[#c4b896]",
  brand: "from-[#6a7a5a] to-[#8a9a6a]",
  presentation: "from-emerald-300/60 to-emerald-200/40",
  other: "from-gray-300/60 to-gray-200/40",
};

function RequestCard({ request }: { request: Request }) {
  const timeSince = new Date(request.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const gradient = typeGradients[request.type] ?? typeGradients.other;

  return (
    <Link href={`/portal/requests/${request.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
        {/* Thumbnail area — shown on desktop */}
        <div
          className={`hidden md:flex h-24 bg-gradient-to-br ${gradient} items-center justify-center`}
        >
          <span className="text-white/50 text-xs font-medium italic">
            {request.title.split(" ").slice(0, 2).join(" ")}
          </span>
        </div>
        <CardContent className="p-3 md:p-4 space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-sm leading-tight">
              {request.title}
            </h3>
            {request.comments.length > 0 && (
              <div className="flex items-center gap-1 text-muted-foreground shrink-0 ml-2">
                <Comment01Icon size={14} />
                <span className="text-xs">{request.comments.length}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 ${typeColors[request.type] ?? typeColors.other}`}
            >
              {request.type.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Updated {timeSince}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ClientBoard({
  clientName,
  requests,
  requestCount,
}: ClientBoardProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {clientName}
            </h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hidden md:inline-flex">
              Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {requestCount} {requestCount === 1 ? "request" : "requests"} in
            progress
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Board / Gallery toggle — desktop only */}
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

          {/* New Request */}
          <Link href="/portal/requests/new">
            {/* Mobile: FAB */}
            <Button
              size="icon"
              className="md:hidden rounded-full h-12 w-12 bg-[#909af7] hover:bg-[#7b85e8] shadow-lg fixed bottom-20 right-4 z-40"
            >
              <PlusSignIcon size={20} color="white" />
            </Button>
            {/* Desktop: button */}
            <Button className="hidden md:flex gap-2 bg-[#909af7] hover:bg-[#7b85e8]">
              <PlusSignIcon size={16} color="white" />
              New Request
            </Button>
          </Link>
        </div>
      </div>

      {/* Mobile: Board/Gallery tabs */}
      <div className="flex gap-4 border-b md:hidden">
        <Link
          href="/portal"
          className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${
            pathname === "/portal"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Board
        </Link>
        <Link
          href="/portal/gallery"
          className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
            pathname === "/portal/gallery"
              ? "border-foreground text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Gallery
        </Link>
      </div>

      {/* Mobile: horizontal status filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide md:hidden">
        {statusColumns.map((col) => {
          const count = requests.filter((r) => r.status === col.key).length;
          return (
            <button
              key={col.key}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-sm whitespace-nowrap shrink-0 hover:bg-gray-50 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              {col.label}
              <span className="text-muted-foreground">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Desktop: 4-column kanban */}
      <div className="hidden md:grid grid-cols-4 gap-5 min-h-[50vh]">
        {statusColumns.map((col) => {
          const colRequests = requests.filter((r) => r.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center gap-2 pb-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-sm font-semibold text-muted-foreground">
                  {col.label}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {colRequests.length}
                </span>
              </div>
              <div className="space-y-3">
                {colRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
              {colRequests.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <p className="text-xs text-muted-foreground">No requests</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: stacked cards by status */}
      <div className="md:hidden space-y-3">
        {statusColumns.map((col) => {
          const colRequests = requests.filter((r) => r.status === col.key);
          if (colRequests.length === 0) return null;
          return (
            <div key={col.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <h2 className="text-sm font-medium text-muted-foreground">
                  {col.label}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {colRequests.length}
                </span>
              </div>
              {colRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          );
        })}

        {requests.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No requests yet. Start by submitting your first design request.
            </p>
            <Link href="/portal/requests/new">
              <Button className="gap-2 bg-[#909af7] hover:bg-[#7b85e8]">
                <PlusSignIcon size={16} color="white" />
                New Request
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
