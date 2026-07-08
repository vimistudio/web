"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  FireIcon,
  CalendarIcon,
  LeafIcon,
  Comment01Icon,
  Download01Icon,
} from "@/components/ui/icons";
import { formatDistanceToNow } from "date-fns";

// --- Types ---

interface QueueRequest {
  id: string;
  title: string;
  type: string;
  status: "queued" | "in_progress" | "review" | "done";
  priority: number;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  clients: { name: string; slug: string } | null;
  deliverables: { id: string }[];
  comments: { id: string; created_at: string; author_id: string }[];
}

interface AdminQueueViewProps {
  requests: QueueRequest[];
  adminId: string;
}

// --- Constants ---

type StatusTab = "all" | "queued" | "in_progress" | "review";

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "queued", label: "Up Next" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Ready for Review" },
];

type SortOption = "priority" | "newest" | "oldest" | "due_date";

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "priority", label: "Priority" },
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "due_date", label: "Due Date" },
];

const statusDotColor: Record<string, string> = {
  queued: "bg-gray-400",
  in_progress: "bg-blue-500",
  review: "bg-amber-500",
};

const statusLabel: Record<string, string> = {
  queued: "Up Next",
  in_progress: "In Progress",
  review: "Ready for Review",
};

const typeColors: Record<string, string> = {
  logo: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
  web: "bg-blue-100 text-blue-700",
  brand: "bg-amber-100 text-amber-700",
  presentation: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
};

// --- Helpers ---

function hasNewComment(request: QueueRequest, adminId: string): boolean {
  if (request.comments.length === 0) return false;
  const latest = request.comments.reduce((a, b) =>
    new Date(a.created_at) > new Date(b.created_at) ? a : b
  );
  return latest.author_id !== adminId;
}

function isDueSoon(dueDate: string): boolean {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  const twoDays = 2 * 24 * 60 * 60 * 1000;
  return diff >= 0 && diff <= twoDays;
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

// --- Component ---

export function AdminQueueView({ requests, adminId }: AdminQueueViewProps) {
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("priority");

  // Count per status
  const counts = useMemo(() => {
    const c = { all: requests.length, queued: 0, in_progress: 0, review: 0 };
    for (const r of requests) {
      if (r.status in c) {
        c[r.status as keyof typeof c]++;
      }
    }
    return c;
  }, [requests]);

  // Filter + sort
  const filteredRequests = useMemo(() => {
    let filtered =
      activeTab === "all"
        ? requests
        : requests.filter((r) => r.status === activeTab);

    const sorted = [...filtered];

    switch (sortBy) {
      case "priority":
        sorted.sort((a, b) => {
          if (b.priority !== a.priority) return b.priority - a.priority;
          return (
            new Date(b.updated_at).getTime() -
            new Date(a.updated_at).getTime()
          );
        });
        break;
      case "newest":
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
        break;
      case "due_date":
        sorted.sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return (
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          );
        });
        break;
    }

    return sorted;
  }, [requests, activeTab, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Queue</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All open requests across clients, sorted by what needs attention first.
        </p>
      </div>

      {/* Tabs + Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Status tabs */}
        <div className="flex gap-1.5 flex-wrap" role="tablist" aria-label="Filter by status">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${
                  activeTab === tab.key
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }
              `}
            >
              {tab.label}{" "}
              <span
                className={
                  activeTab === tab.key
                    ? "text-white/80"
                    : "text-gray-400"
                }
              >
                ({counts[tab.key]})
              </span>
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Request list */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">All clear</p>
          <p className="text-sm mt-1">No requests match this filter.</p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden divide-y divide-gray-100">
          {filteredRequests.map((request) => (
            <QueueRow
              key={request.id}
              request={request}
              adminId={adminId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- Row ---

function QueueRow({
  request,
  adminId,
}: {
  request: QueueRequest;
  adminId: string;
}) {
  const router = useRouter();
  const newComment = hasNewComment(request, adminId);
  const deliverableCount = request.deliverables.length;
  const commentCount = request.comments.length;

  return (
    <div
      onClick={() => router.push(`/portal/requests/${request.id}`)}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors group cursor-pointer"
    >
      {/* Status dot */}
      <span
        className={`shrink-0 w-2.5 h-2.5 rounded-full ${statusDotColor[request.status]}`}
        title={statusLabel[request.status]}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Desktop row */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Title */}
          <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {request.title}
          </span>

          {/* Type badge */}
          <Badge
            variant="secondary"
            className={`shrink-0 text-[10px] px-1.5 py-0 ${typeColors[request.type] ?? typeColors.other}`}
          >
            {request.type.toUpperCase()}
          </Badge>

          {/* Priority indicator */}
          <PriorityIndicator priority={request.priority} />

          {/* Spacer */}
          <span className="flex-1" />

          {/* Client */}
          {request.clients && (
            <span
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="shrink-0"
            >
              <Link
                href={`/portal/admin/clients/${request.clients.slug}`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                {request.clients.name}
              </Link>
            </span>
          )}

          {/* Deliverables */}
          {deliverableCount > 0 && (
            <span className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
              <Download01Icon size={13} />
              {deliverableCount}
            </span>
          )}

          {/* Comments */}
          {commentCount > 0 && (
            <span className="shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
              <Comment01Icon size={13} />
              {commentCount}
              {newComment && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </span>
          )}

          {/* Due date */}
          <DueDateLabel dueDate={request.due_date} />

          {/* Time since update */}
          <span className="shrink-0 text-xs text-muted-foreground w-20 text-right">
            {formatDistanceToNow(new Date(request.updated_at), {
              addSuffix: false,
            })}{" "}
            ago
          </span>
        </div>

        {/* Mobile card layout */}
        <div className="sm:hidden space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">
              {request.title}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 py-0 ${typeColors[request.type] ?? typeColors.other}`}
            >
              {request.type.toUpperCase()}
            </Badge>

            <PriorityIndicator priority={request.priority} />

            {request.clients && (
              <span className="text-xs text-muted-foreground">
                {request.clients.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {deliverableCount > 0 && (
              <span className="flex items-center gap-1">
                <Download01Icon size={12} />
                {deliverableCount}
              </span>
            )}
            {commentCount > 0 && (
              <span className="flex items-center gap-1">
                <Comment01Icon size={12} />
                {commentCount}
                {newComment && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </span>
            )}
            <DueDateLabel dueDate={request.due_date} />
            <span>
              {formatDistanceToNow(new Date(request.updated_at), {
                addSuffix: false,
              })}{" "}
              ago
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function PriorityIndicator({ priority }: { priority: number }) {
  if (priority >= 3) {
    return (
      <span className="shrink-0 flex items-center gap-0.5 text-red-500" title="Urgent">
        <FireIcon size={14} />
      </span>
    );
  }
  if (priority === 2) {
    return (
      <span className="shrink-0 flex items-center gap-0.5 text-amber-500" title="This week">
        <CalendarIcon size={14} />
      </span>
    );
  }
  return (
    <span className="shrink-0 flex items-center gap-0.5 text-emerald-500" title="Whenever">
      <LeafIcon size={14} />
    </span>
  );
}

function DueDateLabel({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null;

  const overdue = isOverdue(dueDate);
  const soon = !overdue && isDueSoon(dueDate);

  const colorClass = overdue
    ? "text-red-600 font-medium"
    : soon
      ? "text-amber-600 font-medium"
      : "text-muted-foreground";

  const formatted = new Date(dueDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <span className={`shrink-0 text-xs ${colorClass}`}>
      {overdue ? "Overdue: " : "Due "}
      {formatted}
    </span>
  );
}
