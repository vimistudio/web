"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  SentIcon,
  Download01Icon,
  Upload01Icon,
} from "@/components/ui/icons";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useRealtime } from "@/hooks/use-realtime";
import { ImageLightbox } from "@/components/portal/image-lightbox";

// --- Types ---

interface Comment {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    role?: string | null;
  } | null;
}

interface Deliverable {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  url: string | null;
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

interface ActivityEntry {
  id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  actor_id: string | null;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

interface RequestDetailProps {
  request: Request;
  clientName: string;
  currentUserId: string;
  isAdmin: boolean;
  isImpersonating: boolean;
  activityLog?: ActivityEntry[];
}

// --- Config ---

const statusSteps = [
  { key: "queued", label: "Queued" },
  { key: "in_progress", label: "In Progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
] as const;

const statusConfig: Record<string, { label: string; color: string }> = {
  queued: { label: "Queued", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  review: { label: "Review", color: "bg-amber-100 text-amber-700" },
  done: { label: "Done", color: "bg-emerald-100 text-emerald-700" },
};

const priorityLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Low", color: "text-gray-500" },
  2: { label: "Medium", color: "text-amber-600" },
  3: { label: "High", color: "text-red-600" },
};

const typeLabels: Record<string, string> = {
  logo: "Logo Design",
  social: "Social Media",
  web: "Website",
  brand: "Branding",
  presentation: "Presentation",
  other: "Other",
};

const typeColors: Record<string, string> = {
  logo: "bg-purple-100 text-purple-700",
  social: "bg-pink-100 text-pink-700",
  web: "bg-blue-100 text-blue-700",
  brand: "bg-amber-100 text-amber-700",
  presentation: "bg-emerald-100 text-emerald-700",
  other: "bg-gray-100 text-gray-700",
};

// --- Sub-components ---

function ProgressStepper({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statusSteps.findIndex((s) => s.key === currentStatus);

  return (
    <div className="flex items-center gap-1 py-2">
      {statusSteps.map((step, i) => (
        <Fragment key={step.key}>
          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                i < currentIndex
                  ? "bg-[#909af7] border-[#909af7] text-white"
                  : i === currentIndex
                    ? "border-[#909af7] text-[#909af7]"
                    : "border-muted-foreground/30 text-muted-foreground/40"
              }`}
            >
              {i < currentIndex ? (
                <CheckmarkCircle01Icon size={14} />
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                i <= currentIndex
                  ? "text-foreground"
                  : "text-muted-foreground/40"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < statusSteps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-1 transition-colors ${
                i < currentIndex ? "bg-[#909af7]" : "bg-muted-foreground/20"
              }`}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}

function CompletionBanner({ updatedAt }: { updatedAt: string }) {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
      <CheckmarkCircle01Icon
        size={24}
        className="text-emerald-600 shrink-0"
      />
      <div>
        <p className="text-sm font-semibold text-emerald-900">
          Request Complete
        </p>
        <p className="text-xs text-emerald-700">
          Delivered on{" "}
          {new Date(updatedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}

function DeliverableCard({
  d,
  onImageClick,
}: {
  d: Deliverable;
  onImageClick?: () => void;
}) {
  const isImage = d.mime_type?.startsWith("image/");

  if (isImage && d.url) {
    return (
      <button
        type="button"
        onClick={onImageClick}
        className="block w-full text-left"
      >
        <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
          <div className="aspect-[4/3] bg-gray-50 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={d.url}
              alt={d.file_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                <Download01Icon size={16} className="text-gray-700" />
              </div>
            </div>
          </div>
          <CardContent className="p-2">
            <p className="text-xs font-medium truncate">{d.file_name}</p>
          </CardContent>
        </Card>
      </button>
    );
  }

  return (
    <a
      href={d.url ?? "#"}
      download={d.file_name}
      target="_blank"
      rel="noopener noreferrer"
      className={d.url ? "block" : "block pointer-events-none opacity-50"}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{d.file_name}</p>
            <p className="text-xs text-muted-foreground">
              {d.file_size
                ? `${(d.file_size / 1024 / 1024).toFixed(1)} MB`
                : ""}
            </p>
          </div>
          <Download01Icon size={16} className="text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </a>
  );
}

const activityConfig: Record<string, { label: (oldVal: string | null, newVal: string | null, actor: string) => string; dot: string }> = {
  status_changed: {
    label: (oldVal, newVal, actor) => {
      const to = statusConfig[newVal ?? ""]?.label ?? newVal;
      return `${actor} moved to ${to}`;
    },
    dot: "bg-blue-500",
  },
  comment_added: {
    label: (_o, _n, actor) => `${actor} commented`,
    dot: "bg-[#909af7]",
  },
  deliverable_uploaded: {
    label: (_o, newVal, actor) => `${actor} uploaded ${newVal ?? "a file"}`,
    dot: "bg-emerald-500",
  },
};

function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium">Activity</h2>
      <div className="relative pl-5 space-y-3">
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-muted-foreground/15" />
        {entries.map((entry) => {
          const actor = entry.profiles?.full_name ?? "Someone";
          const config = activityConfig[entry.action];
          const label = config
            ? config.label(entry.old_value, entry.new_value, actor)
            : `${actor} ${entry.action}`;
          const dotColor = config?.dot ?? "bg-gray-400";

          return (
            <div key={entry.id} className="flex items-start gap-3 relative">
              <div className={`absolute left-[-14px] top-1.5 w-2 h-2 rounded-full ${dotColor}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground/60">
                  {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- Main component ---

export function RequestDetail({
  request,
  clientName,
  currentUserId,
  isAdmin,
  isImpersonating,
  activityLog = [],
}: RequestDetailProps) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(request.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const allComments = [...request.comments, ...optimisticComments];

  // Build image list for lightbox (only image deliverables with URLs)
  const lightboxImages = request.deliverables
    .filter((d) => d.mime_type?.startsWith("image/") && d.url)
    .map((d) => ({
      url: d.url!,
      fileName: d.file_name,
      fileSize: d.file_size,
      mimeType: d.mime_type,
    }));

  const backHref = isImpersonating
    ? `/portal/admin/clients/${request.clients?.slug ?? ""}`
    : isAdmin
      ? `/portal/admin/clients/${request.clients?.slug ?? ""}`
      : "/portal";

  const status = statusConfig[currentStatus];
  const priority = priorityLabels[request.priority];
  const requestedDate = new Date(request.created_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
  const updatedDate = formatDistanceToNow(new Date(request.updated_at), {
    addSuffix: true,
  });

  // Clear optimistic comments when server data updates
  useEffect(() => {
    setOptimisticComments([]);
  }, [request.comments.length]);

  const handleSubmitComment = useCallback(async () => {
    if (!comment.trim() || isSubmitting) return;
    setIsSubmitting(true);

    // Optimistic: show comment immediately
    const optimisticComment: Comment = {
      id: `optimistic-${Date.now()}`,
      body: comment.trim(),
      created_at: new Date().toISOString(),
      author_id: currentUserId,
      profiles: { full_name: "You", avatar_url: null, role: isAdmin ? "admin" : "client" },
    };
    setOptimisticComments((prev) => [...prev, optimisticComment]);
    const commentText = comment.trim();
    setComment("");
    if (commentInputRef.current) commentInputRef.current.style.height = "auto";

    const supabase = createClient();
    const { error } = await supabase.from("comments").insert({
      request_id: request.id,
      author_id: currentUserId,
      body: commentText,
    });

    if (error) {
      toast.error("Couldn't post your comment. Please try again.");
      setOptimisticComments((prev) =>
        prev.filter((c) => c.id !== optimisticComment.id)
      );
      setComment(commentText);
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();

    // Fire-and-forget email notification
    fetch("/api/portal/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "comment_added", request_id: request.id }),
    }).catch(() => {});
  }, [comment, isSubmitting, currentUserId, isAdmin, request.id, router]);

  const handleStatusChange = useCallback(
    async (newStatus: "queued" | "in_progress" | "review" | "done") => {
      setIsUpdatingStatus(true);
      const previousStatus = currentStatus;

      // Optimistic update
      setCurrentStatus(newStatus);

      const supabase = createClient();
      const { error } = await supabase
        .from("requests")
        .update({ status: newStatus })
        .eq("id", request.id);

      if (error) {
        setCurrentStatus(previousStatus);
        toast.error("Couldn't update status. Please try again.");
        setIsUpdatingStatus(false);
        return;
      }

      if (newStatus === "done") {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.7 },
          colors: ["#909af7", "#7b85e8", "#10b981", "#f59e0b"],
        });
        toast.success("Approved! Your designs are ready to download.", {
          duration: 5000,
        });
      } else {
        toast.success(`Status updated to ${statusConfig[newStatus].label}`);
      }

      setIsUpdatingStatus(false);
      router.refresh();

      // Fire-and-forget email notification
      fetch("/api/portal/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "status_changed",
          request_id: request.id,
          new_status: newStatus,
          old_status: previousStatus,
        }),
      }).catch(() => {});
    },
    [currentStatus, request.id, router]
  );

  const handleRequestChanges = useCallback(() => {
    if (!comment.trim()) {
      toast(
        "Add a comment explaining what you'd like changed, then tap Request Changes again.",
        { duration: 5000 }
      );
      const textarea = document.querySelector("textarea");
      textarea?.focus();
      return;
    }
    (async () => {
      setIsSubmitting(true);
      const commentText = comment.trim();

      const supabase = createClient();
      const { error } = await supabase.from("comments").insert({
        request_id: request.id,
        author_id: currentUserId,
        body: commentText,
      });

      if (error) {
        toast.error("Couldn't post your comment. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setComment("");
      setIsSubmitting(false);
      await handleStatusChange("in_progress");
    })();
  }, [comment, request.id, currentUserId, handleStatusChange]);

  const handleUploadFiles = useCallback(
    async (files: FileList) => {
      if (!files.length) return;
      setIsUploading(true);

      const supabase = createClient();
      let successCount = 0;

      for (const file of Array.from(files)) {
        const filePath = `${request.client_id}/${request.id}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("deliverables")
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { error: dbError } = await supabase
          .from("deliverables")
          .insert({
            request_id: request.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.type || null,
            uploaded_by: currentUserId,
          });

        if (dbError) {
          toast.error(`Failed to save ${file.name} record`);
          continue;
        }

        successCount++;
      }

      if (successCount > 0) {
        toast.success(
          `Uploaded ${successCount} ${successCount === 1 ? "file" : "files"}`
        );
        router.refresh();

        // Fire-and-forget email notification
        fetch("/api/portal/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "deliverable_uploaded",
            request_id: request.id,
          }),
        }).catch(() => {});
      }

      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [request.id, request.client_id, currentUserId, router]
  );

  // Realtime: live comment updates
  useRealtime({
    table: "comments",
    event: "INSERT",
    filter: `request_id=eq.${request.id}`,
    onEvent: () => router.refresh(),
  });

  // Scroll to bottom of comments after posting
  useEffect(() => {
    if (allComments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [allComments.length]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const downloadAllUrls = request.deliverables.filter((d) => d.url);

  return (
    <div
      className={`mx-auto space-y-6 pb-24 md:pb-6 ${
        isAdmin ? "max-w-3xl" : "max-w-2xl"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          <ArrowLeft01Icon size={16} />
          {isAdmin ? "Back to Client" : "My Requests"}
        </Link>
        <div className="flex items-center gap-2">
          {priority && (
            <span className={`text-xs font-medium ${priority.color}`}>
              {priority.label}
            </span>
          )}
          <Badge className={status.color}>{status.label}</Badge>
        </div>
      </div>

      {/* Progress Stepper */}
      <ProgressStepper currentStatus={currentStatus} />

      {/* Completion Banner */}
      {currentStatus === "done" && (
        <CompletionBanner updatedAt={request.updated_at} />
      )}

      {/* Queued status reassurance */}
      {currentStatus === "queued" && !isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            Your request is in the queue! Your designer will start working on it
            soon.
          </p>
        </div>
      )}

      {/* Title + Meta */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground font-medium">
            {clientName}
          </span>
        </div>
        <h1 className="text-2xl font-semibold">{request.title}</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge
            variant="secondary"
            className={`text-xs ${typeColors[request.type] ?? typeColors.other}`}
          >
            {typeLabels[request.type] ?? request.type}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Requested {requestedDate}
          </span>
          <span className="text-xs text-muted-foreground">
            · Updated {updatedDate}
          </span>
        </div>
      </div>

      {/* Description */}
      {request.description ? (
        <p className="text-sm text-muted-foreground leading-relaxed">
          {request.description}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground/60 italic">
          No description provided
        </p>
      )}

      {/* Deliverables */}
      {request.deliverables.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">
              {`Your Designs (${request.deliverables.length})`}
            </h2>
            {downloadAllUrls.length >= 2 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => {
                  downloadAllUrls.forEach((d, i) => {
                    setTimeout(() => {
                      const a = document.createElement("a");
                      a.href = d.url!;
                      a.download = d.file_name;
                      a.target = "_blank";
                      a.click();
                    }, i * 300);
                  });
                }}
              >
                <Download01Icon size={12} />
                Download All
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {request.deliverables.map((d) => {
              const isImage = d.mime_type?.startsWith("image/") && d.url;
              const imageIndex = isImage
                ? lightboxImages.findIndex((img) => img.url === d.url)
                : -1;

              return (
                <DeliverableCard
                  key={d.id}
                  d={d}
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
      ) : currentStatus === "queued" ? null : (
        <div className="border border-dashed border-muted-foreground/20 rounded-xl p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {currentStatus === "in_progress"
              ? "Your designs will show up here once they're ready."
              : "No deliverables for this request yet."}
          </p>
        </div>
      )}

      {/* Admin: Upload deliverables */}
      {isAdmin && currentStatus !== "done" && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.ai,.psd,.sketch,.fig,.svg,.zip"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleUploadFiles(e.target.files);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full border-2 border-dashed border-[#909af7]/30 hover:border-[#909af7]/60 rounded-xl p-4 flex items-center justify-center gap-2 text-sm text-[#909af7] hover:bg-[#909af7]/5 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <div className="h-4 w-4 border-2 border-[#909af7]/30 border-t-[#909af7] rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload01Icon size={16} />
                Upload Deliverables
              </>
            )}
          </button>
        </div>
      )}

      {/* Action Buttons — above comments when in review (the decision point) */}
      {currentStatus === "review" && !isAdmin && (
        <div className="flex gap-3">
          <Button
            onClick={() => handleStatusChange("done")}
            disabled={isUpdatingStatus}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2 h-11"
          >
            <CheckmarkCircle01Icon size={16} color="white" />
            {isUpdatingStatus ? "Approving..." : "Approve"}
          </Button>
          <Button
            variant="outline"
            onClick={handleRequestChanges}
            disabled={isUpdatingStatus || isSubmitting}
            className="flex-1 h-11"
          >
            Request Changes
          </Button>
        </div>
      )}

      {/* Admin status controls */}
      {isAdmin && currentStatus !== "done" && (
        <div className="flex gap-2 flex-wrap">
          {currentStatus !== "in_progress" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange("in_progress")}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? "Updating..." : "Start Working"}
            </Button>
          )}
          {currentStatus === "in_progress" && (
            <Button
              size="sm"
              onClick={() => handleStatusChange("review")}
              disabled={isUpdatingStatus}
              className="bg-[#909af7] hover:bg-[#7b85e8]"
            >
              {isUpdatingStatus ? "Updating..." : "Submit for Review"}
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isUpdatingStatus}
              >
                Mark Done
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Mark as done?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will skip the client review step and mark the request as
                  complete. The client will see it as delivered.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleStatusChange("done")}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Mark Done
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
              <a
                key={ref.id}
                href={ref.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                {ref.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ref.url}
                    alt={ref.file_name}
                    className="w-16 h-16 rounded-lg object-cover hover:ring-2 ring-[#909af7] transition-shadow"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                    <span className="text-[10px] text-muted-foreground">
                      {ref.file_name.split(".").pop()?.toUpperCase()}
                    </span>
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {activityLog.length > 0 && <ActivityTimeline entries={activityLog} />}

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium">
          Comments ({allComments.length})
        </h2>

        {allComments.map((c) => {
          const isOwnComment = c.author_id === currentUserId;
          const isOptimistic = c.id.startsWith("optimistic-");
          const authorInitials = getInitials(c.profiles?.full_name ?? "?");
          const isAdminComment = c.profiles?.role === "admin";

          return (
            <div
              key={c.id}
              className={`flex gap-3 ${isOptimistic ? "opacity-60" : ""}`}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={c.profiles?.avatar_url ?? undefined} />
                <AvatarFallback
                  className={`text-xs ${
                    isAdminComment
                      ? "bg-[#909af7] text-white"
                      : isOwnComment
                        ? "bg-[#909af7] text-white"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {c.profiles?.full_name ?? "Unknown"}
                  </span>
                  {isAdminComment && !isOwnComment && (
                    <span className="text-[10px] font-medium text-[#909af7] bg-[#909af7]/10 px-1.5 py-0.5 rounded">
                      Vimi Studio
                    </span>
                  )}
                  {!isAdminComment && isAdmin && !isOwnComment && (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Client
                    </span>
                  )}
                  <span
                    className="text-xs text-muted-foreground"
                    title={new Date(c.created_at).toLocaleString()}
                  >
                    {isOptimistic
                      ? "just now"
                      : formatDistanceToNow(new Date(c.created_at), {
                          addSuffix: true,
                        })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                  {c.body}
                </p>
              </div>
            </div>
          );
        })}

        {allComments.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No messages yet. Say hi, or we&apos;ll reach out when we have updates.
          </p>
        )}

        <div ref={commentsEndRef} />
      </div>

      {/* Comment Input — sticky on mobile */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t px-4 py-3 md:static md:border-t-0 md:px-0 md:py-0 z-30">
        <div
          className={`flex items-start gap-2 mx-auto ${
            isAdmin ? "max-w-3xl" : "max-w-2xl"
          }`}
        >
          <div className="flex-1 space-y-1">
            <Textarea
              ref={commentInputRef}
              aria-label="Add a comment"
              placeholder="Add a comment..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 200) + "px";
              }}
              maxLength={2000}
              className="min-h-[44px] max-h-[200px] resize-none overflow-y-auto"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment();
                }
              }}
            />
            <div className="hidden md:flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                Enter to send, Shift+Enter for new line
              </p>
              {comment.length > 1500 && (
                <p className="text-[10px] text-muted-foreground">
                  {comment.length}/2000
                </p>
              )}
            </div>
          </div>
          <Button
            size="icon"
            aria-label="Send comment"
            onClick={handleSubmitComment}
            disabled={!comment.trim() || isSubmitting}
            className="shrink-0 bg-[#909af7] hover:bg-[#7b85e8] h-[44px] w-[44px]"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <SentIcon size={18} color="white" />
            )}
          </Button>
        </div>
      </div>

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
