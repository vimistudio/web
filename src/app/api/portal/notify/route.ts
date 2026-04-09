import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { CommentAddedEmail } from "@/lib/email/templates/comment";
import { StatusChangedEmail } from "@/lib/email/templates/status";
import { DeliverableUploadedEmail } from "@/lib/email/templates/deliverable";
import { InviteEmail } from "@/lib/email/templates/invite";
import { RequestCreatedEmail } from "@/lib/email/templates/request-created";
import { ClientSignedInEmail } from "@/lib/email/templates/client-signed-in";
import { NextResponse } from "next/server";

const VALID_TYPES = ["comment_added", "status_changed", "deliverable_uploaded", "invite", "request_created", "client_signed_in"];

const STATUS_LABELS: Record<string, string> = {
  queued: "Queued",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

const TYPE_LABELS: Record<string, string> = {
  logo: "Logo Design",
  social: "Social Media",
  web: "Website",
  brand: "Branding",
  presentation: "Presentation",
  other: "Other",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, request_id, new_status, old_status, invite_email, client_name, priority: reqPriority, description: reqDescription } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: "Invalid type" },
        { status: 400 }
      );
    }

    // Auth check (cookie-based, same as search/route.ts)
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, client_id, full_name")
      .eq("id", user.id)
      .single();

    if (!callerProfile) {
      return NextResponse.json({ error: "No profile" }, { status: 403 });
    }

    // Handle invite separately — no request_id needed
    if (type === "invite") {
      if (!invite_email || !client_name) {
        return NextResponse.json(
          { error: "invite_email and client_name required" },
          { status: 400 }
        );
      }
      const actorName = callerProfile.full_name || "Vimi Studio";
      const result = await sendEmail({
        to: invite_email,
        subject: `You're invited to your ${client_name} design portal`,
        react: InviteEmail({
          clientName: client_name,
          portalUrl: "https://vimistudio.com/portal/login",
          invitedByName: actorName,
        }),
      });
      return NextResponse.json({ success: result.success, sent: result.success ? 1 : 0 });
    }

    // Handle client_signed_in — notify admin(s) that a client just signed in
    if (type === "client_signed_in") {
      const { data: admins } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("role", "admin");

      const clientName = client_name || "a project";
      const callerName = callerProfile.full_name || "A client";
      let sent = 0;

      for (const admin of admins ?? []) {
        if (!admin.email) continue;
        const result = await sendEmail({
          to: admin.email,
          subject: `\u{1F44B} ${callerName} just signed in to ${clientName}'s portal`,
          react: ClientSignedInEmail({
            clientUserName: callerName,
            clientUserEmail: user.email || "",
            clientName,
            portalUrl: "https://vimistudio.com/portal/admin",
          }),
        });
        if (result.success) sent++;
      }
      return NextResponse.json({ success: true, sent });
    }

    if (!request_id) {
      return NextResponse.json(
        { error: "request_id required" },
        { status: 400 }
      );
    }

    // Load request with client info
    const { data: req } = await supabase
      .from("requests")
      .select("*, clients(name, slug)")
      .eq("id", request_id)
      .single();

    if (!req) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Ownership check: clients can only notify for their own client's requests
    const isCallerAdmin = callerProfile.role === "admin";
    if (!isCallerAdmin && req.client_id !== callerProfile.client_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine recipients (email from profiles table)
    interface Recipient {
      id: string;
      email: string | null;
    }
    let recipients: Recipient[] = [];

    if (isCallerAdmin) {
      // Admin action → notify client users for this request's client
      const { data } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("client_id", req.client_id);
      recipients = data ?? [];
    } else {
      // Client action → notify admin(s)
      const { data } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("role", "admin");
      recipients = data ?? [];
    }

    // Don't email the person who triggered the action, or people without emails
    const filtered = recipients.filter(
      (r) => r.id !== user.id && r.email
    );

    if (filtered.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const actorName = callerProfile.full_name || "Someone";
    const requestUrl = `https://vimistudio.com/portal/requests/${request_id}`;
    let sent = 0;

    for (const recipient of filtered) {
      let subject: string;
      let react: React.ReactElement;

      switch (type) {
        case "comment_added": {
          const { data: latestComment } = await supabase
            .from("comments")
            .select("body")
            .eq("request_id", request_id)
            .eq("author_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          subject = `\u{1F4AC} ${actorName} commented on "${req.title}"`;
          react = CommentAddedEmail({
            requestTitle: req.title,
            requestUrl,
            commenterName: actorName,
            commentBody: latestComment?.body || "New comment",
            requestType: TYPE_LABELS[req.type] || req.type,
          });
          break;
        }
        case "status_changed": {
          const newLabel = STATUS_LABELS[new_status] || new_status || "Unknown";
          subject = `\u{1F4CB} "${req.title}" moved to ${newLabel}`;
          react = StatusChangedEmail({
            requestTitle: req.title,
            requestUrl,
            oldStatus: old_status || req.status,
            newStatus: new_status || req.status,
            changedByName: actorName,
          });
          break;
        }
        case "deliverable_uploaded": {
          const { data: deliverables } = await supabase
            .from("deliverables")
            .select("file_name")
            .eq("request_id", request_id)
            .eq("uploaded_by", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

          const fileNames = deliverables?.map((d) => d.file_name) ?? [];
          subject = `\u{1F4CE} New files for "${req.title}"`;
          react = DeliverableUploadedEmail({
            requestTitle: req.title,
            requestUrl,
            uploaderName: actorName,
            fileNames,
            fileCount: fileNames.length || 1,
          });
          break;
        }
        case "request_created": {
          const clientName = (req as { clients?: { name?: string } | null }).clients?.name || "A client";
          const priorityLabels: Record<number, string> = { 1: "Whenever", 2: "This Week", 3: "Urgent" };
          subject = `\u{1F4CB} New request from ${clientName}: "${req.title}"`;
          react = RequestCreatedEmail({
            requestTitle: req.title,
            requestUrl,
            clientName,
            requestType: TYPE_LABELS[req.type] || req.type,
            priority: priorityLabels[reqPriority as number] || "Normal",
            description: (reqDescription as string) || undefined,
          });
          break;
        }
        default:
          continue;
      }

      const result = await sendEmail({
        to: recipient.email!,
        subject,
        react,
      });
      if (result.success) sent++;
    }

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error("[notify] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
