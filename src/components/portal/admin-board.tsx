"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlusSignIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Comment01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { ArrowLeft01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { Upload01Icon } from "@hugeicons-pro/core-stroke-rounded";
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
  deliverables: { id: string; file_name: string; file_path: string; mime_type: string | null }[];
  comments: { id: string }[];
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

interface Client {
  id: string;
  name: string;
  slug: string;
  retainer_amount: number | null;
  is_active: boolean;
}

interface AdminBoardProps {
  client: Client;
  requests: Request[];
}

const columns = [
  { key: "queued" as const, label: "Queued", color: "bg-gray-400", dot: "text-gray-400" },
  { key: "in_progress" as const, label: "In Progress", color: "bg-blue-500", dot: "text-blue-500" },
  { key: "review" as const, label: "Review", color: "bg-amber-500", dot: "text-amber-500" },
  { key: "done" as const, label: "Done", color: "bg-emerald-500", dot: "text-emerald-500" },
];

const typeColors: Record<string, string> = {
  logo: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
  web: "bg-blue-100 text-blue-700",
  brand: "bg-amber-100 text-amber-700",
  presentation: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
};

const statusLabels: Record<string, string> = {
  queued: "QUEUED",
  in_progress: "IN PROGRESS",
  review: "AWAITING REVIEW",
  done: "DELIVERED",
};

function BoardCard({ request }: { request: Request }) {
  const timeSince = new Date(request.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/portal/requests/${request.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-medium text-sm leading-tight group-hover:text-[#909af7] transition-colors">
            {request.title}
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 ${typeColors[request.type] ?? typeColors.other}`}
            >
              {request.type.toUpperCase()}
            </Badge>
            {request.status === "review" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-50 text-amber-600">
                {statusLabels[request.status]}
              </Badge>
            )}
            {request.status === "done" && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-600">
                {statusLabels[request.status]}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{timeSince}</span>
            <div className="flex items-center gap-3">
              {request.deliverables.length > 0 && (
                <div className="flex items-center gap-1">
                  <Upload01Icon size={12} />
                  <span>{request.deliverables.length}</span>
                </div>
              )}
              {request.comments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Comment01Icon size={12} />
                  <span>{request.comments.length}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function AdminBoard({ client, requests }: AdminBoardProps) {
  const openCount = requests.filter((r) => r.status !== "done").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/admin/clients"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft01Icon size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{client.name}</h1>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200"
              >
                Active
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              ${client.retainer_amount ?? 0}/mo &middot; {openCount} open{" "}
              {openCount === 1 ? "request" : "requests"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <PlusSignIcon size={16} />
            Add Request
          </Button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-4 gap-4 min-h-[60vh]">
        {columns.map((col) => {
          const colRequests = requests.filter((r) => r.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              {/* Column header */}
              <div className="flex items-center gap-2 pb-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-sm font-medium text-muted-foreground">
                  {col.label}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {colRequests.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {colRequests.map((request) => (
                  <BoardCard key={request.id} request={request} />
                ))}
              </div>

              {/* Empty state */}
              {colRequests.length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">No requests</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
