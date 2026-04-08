"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusSignIcon } from "@/components/ui/icons";
import { Comment01Icon } from "@/components/ui/icons";
import Link from "next/link";

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

function RequestCard({ request }: { request: Request }) {
  const timeSince = new Date(request.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/portal/requests/${request.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-sm leading-tight">
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
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{clientName}</h1>
          <p className="text-sm text-muted-foreground">
            {requestCount} {requestCount === 1 ? "request" : "requests"} in
            progress
          </p>
        </div>
        <Link href="/portal/requests/new">
          <Button
            size="icon"
            className="rounded-full h-12 w-12 bg-[#909af7] hover:bg-[#7b85e8] shadow-lg"
          >
            <PlusSignIcon size={20} color="white" />
          </Button>
        </Link>
      </div>

      {/* Board / Gallery tabs */}
      <Tabs defaultValue="board">
        <TabsList className="bg-transparent gap-4 p-0 h-auto">
          <TabsTrigger
            value="board"
            className="px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold"
          >
            Board
          </TabsTrigger>
          <TabsTrigger
            value="gallery"
            className="px-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground"
          >
            Gallery
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Status filter chips (mobile horizontal scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
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

      {/* Request Cards */}
      <div className="space-y-3">
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
