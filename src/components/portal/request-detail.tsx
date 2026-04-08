"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { CheckmarkCircle01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { SentIcon } from "@hugeicons-pro/core-stroke-rounded";
import { Download01Icon } from "@hugeicons-pro/core-stroke-rounded";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

interface Deliverable {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

interface Request {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: "queued" | "in_progress" | "review" | "done";
  priority: number;
  created_at: string;
  updated_at: string;
  client_id: string;
  clients: { name: string; slug: string } | null;
  deliverables: Deliverable[];
  reference_images: Deliverable[];
  comments: Comment[];
}

interface RequestDetailProps {
  request: Request;
  currentUserId: string;
  isAdmin: boolean;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  queued: { label: "Queued", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  review: { label: "Review", color: "bg-amber-100 text-amber-700" },
  done: { label: "Done", color: "bg-emerald-100 text-emerald-700" },
};

const typeColors: Record<string, string> = {
  logo: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
  web: "bg-blue-100 text-blue-700",
  brand: "bg-amber-100 text-amber-700",
  presentation: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
};

export function RequestDetail({
  request,
  currentUserId,
  isAdmin,
}: RequestDetailProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const backHref = isAdmin
    ? `/portal/admin/clients/${request.clients?.slug ?? ""}`
    : "/portal";

  const handleSubmitComment = async () => {
    if (!comment.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const supabase = createClient();
    await supabase.from("comments").insert({
      request_id: request.id,
      author_id: currentUserId,
      body: comment.trim(),
    });

    setComment("");
    setIsSubmitting(false);
    router.refresh();
  };

  const handleStatusChange = async (
    newStatus: "queued" | "in_progress" | "review" | "done"
  ) => {
    setIsUpdatingStatus(true);
    const supabase = createClient();
    await supabase
      .from("requests")
      .update({ status: newStatus })
      .eq("id", request.id);
    setIsUpdatingStatus(false);
    router.refresh();
  };

  const status = statusConfig[request.status];
  const requestedDate = new Date(request.created_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft01Icon size={16} />
          Back to Board
        </Link>
        <Badge className={status.color}>{status.label}</Badge>
      </div>

      {/* Title + Meta */}
      <div>
        <h1 className="text-2xl font-semibold">{request.title}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge
            variant="secondary"
            className={`text-xs ${typeColors[request.type] ?? typeColors.other}`}
          >
            {request.type.toUpperCase()}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Requested {requestedDate}
          </span>
        </div>
      </div>

      {/* Description */}
      {request.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {request.description}
        </p>
      )}

      {/* Deliverables */}
      {request.deliverables.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">
            Deliverables ({request.deliverables.length})
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {request.deliverables.map((d) => (
              <Card key={d.id} className="overflow-hidden">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {d.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {d.file_size
                        ? `${(d.file_size / 1024 / 1024).toFixed(1)} MB`
                        : ""}
                    </p>
                  </div>
                  <Download01Icon
                    size={16}
                    className="text-muted-foreground shrink-0"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reference Images */}
      {request.reference_images.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium">
            References ({request.reference_images.length})
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {request.reference_images.map((ref) => (
              <div
                key={ref.id}
                className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center"
              >
                <span className="text-[10px] text-muted-foreground">
                  {ref.file_name.split(".").pop()?.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium">
          Comments ({request.comments.length})
        </h2>

        {request.comments.map((c) => {
          const isOwnComment = c.author_id === currentUserId;
          const initials = (
            c.profiles?.full_name ?? "?"
          )[0].toUpperCase();

          return (
            <div key={c.id} className="flex gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                <AvatarFallback
                  className={`text-xs ${
                    isOwnComment
                      ? "bg-[#909af7] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {c.profiles?.full_name ?? "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {c.body}
                </p>
              </div>
            </div>
          );
        })}

        {request.comments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Start the conversation.
          </p>
        )}
      </div>

      {/* Comment Input */}
      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[44px] max-h-32 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmitComment();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleSubmitComment}
          disabled={!comment.trim() || isSubmitting}
          className="shrink-0 bg-[#909af7] hover:bg-[#7b85e8] h-[44px] w-[44px]"
        >
          <SentIcon size={18} color="white" />
        </Button>
      </div>

      {/* Action Buttons */}
      {request.status === "review" && !isAdmin && (
        <div className="flex gap-3 pt-2">
          <Button
            onClick={() => handleStatusChange("done")}
            disabled={isUpdatingStatus}
            className="flex-1 bg-[#909af7] hover:bg-[#7b85e8] gap-2"
          >
            <CheckmarkCircle01Icon size={16} color="white" />
            Approve
          </Button>
          <Button
            variant="outline"
            onClick={() => handleStatusChange("in_progress")}
            disabled={isUpdatingStatus}
            className="flex-1"
          >
            Request Changes
          </Button>
        </div>
      )}

      {/* Admin status controls */}
      {isAdmin && request.status !== "done" && (
        <div className="flex gap-2 pt-2 flex-wrap">
          {request.status !== "in_progress" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("in_progress")}
              disabled={isUpdatingStatus}
            >
              Start Working
            </Button>
          )}
          {request.status === "in_progress" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("review")}
              disabled={isUpdatingStatus}
            >
              Submit for Review
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleStatusChange("done")}
            disabled={isUpdatingStatus}
          >
            Mark Done
          </Button>
        </div>
      )}
    </div>
  );
}
