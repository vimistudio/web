import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { CommentAddedEmail } from "@/lib/email/templates/comment";
import { StatusChangedEmail } from "@/lib/email/templates/status";
import { DeliverableUploadedEmail } from "@/lib/email/templates/deliverable";
import { InviteEmail } from "@/lib/email/templates/invite";
import { TeamInviteEmail } from "@/lib/email/templates/team-invite";
import { RequestCreatedEmail } from "@/lib/email/templates/request-created";
import { ClientSignedInEmail } from "@/lib/email/templates/client-signed-in";
import { DirectionVotedEmail } from "@/lib/email/templates/direction-voted";
import { MilestoneDoneEmail } from "@/lib/email/templates/milestone-done";
import type { Locale } from "@/lib/portal-strings";
import { NextResponse } from "next/server";

const VALID_TYPES = ["comment_added", "status_changed", "deliverable_uploaded", "invite", "team_invite", "request_created", "client_signed_in", "direction_voted", "milestone_done"];

const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    queued: "Queued",
    in_progress: "In Progress",
    review: "Review",
    done: "Done",
  },
  es: {
    queued: "En cola",
    in_progress: "En proceso",
    review: "En revisión",
    done: "Entregado",
  },
};

// Locale resolution: recipient's profiles.locale, else their clients.locale,
// else English. Client-facing emails only — admin-facing stay English.
const toLocale = (value: string | null | undefined): Locale =>
  value === "es" ? "es" : "en";

const TYPE_LABELS: Record<string, string> = {
  logo: "Logo Design",
  social: "Social Media",
  web: "Website",
  brand: "Branding",
  presentation: "Presentation",
  other: "Other",
};

// Resolve who receives a client-originated notification: the client's assigned
// designer when set (and still an admin), otherwise every admin. Keeps the
// null-designer path behaving exactly as before (fan out to all admins).
async function resolveClientNotifyAdmins(
  supabase: ReturnType<typeof createClient>,
  clientId: string | null | undefined
): Promise<{ id: string; email: string | null }[]> {
  if (clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("designer_id")
      .eq("id", clientId)
      .single();
    if (client?.designer_id) {
      const { data: designer } = await supabase
        .from("profiles")
        .select("id, email")
        .eq("id", client.designer_id)
        .eq("role", "admin")
        .maybeSingle();
      if (designer?.email) return [designer];
    }
  }
  const { data: admins } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("role", "admin");
  return admins ?? [];
}

// Resolve who receives a request-scoped client notification. Precedence:
//   1. the request's assignee (re-verified as an admin AT SEND TIME, so a
//      demoted or deleted assignee cleanly falls through), then
//   2. the client's designer, then
//   3. every admin.
// Steps 2–3 reuse resolveClientNotifyAdmins so the null-assignee path behaves
// exactly as before. No PostgREST embed for the assignee — plain id lookup.
async function resolveRequestNotifyAdmins(
  supabase: ReturnType<typeof createClient>,
  assigneeId: string | null | undefined,
  clientId: string | null | undefined
): Promise<{ id: string; email: string | null }[]> {
  if (assigneeId) {
    const { data: assignee } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", assigneeId)
      .eq("role", "admin")
      .maybeSingle();
    if (assignee?.email) return [assignee];
  }
  return resolveClientNotifyAdmins(supabase, clientId);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, request_id, new_status, old_status, invite_email, client_name, priority: reqPriority, description: reqDescription, direction_label, vote_comment, milestone_id } = body;

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
      // No profile exists yet for an invitee — use the invited client's locale.
      const { data: inviteRow } = await supabase
        .from("invited_emails")
        .select("clients(locale)")
        .eq("email", invite_email.toLowerCase())
        .maybeSingle();
      const inviteLocale = toLocale(
        (inviteRow as { clients?: { locale?: string } | null } | null)?.clients
          ?.locale
      );
      const result = await sendEmail({
        to: invite_email,
        subject:
          inviteLocale === "es"
            ? `Te invitamos a tu portal de diseño de ${client_name}`
            : `You're invited to your ${client_name} design portal`,
        react: InviteEmail({
          clientName: client_name,
          portalUrl: "https://vimistudio.com/portal/login",
          invitedByName: actorName,
          locale: inviteLocale,
        }),
      });
      return NextResponse.json({ success: result.success, sent: result.success ? 1 : 0 });
    }

    // Handle team_invite — a client invited a teammate to their own client.
    // Email the invited person (same InviteEmail as admin invites) AND send a
    // heads-up to admins so the studio knows a client grew their team.
    if (type === "team_invite") {
      if (!invite_email || !client_name) {
        return NextResponse.json(
          { error: "invite_email and client_name required" },
          { status: 400 }
        );
      }
      // Only clients trigger this; admins use the "invite" flow.
      if (callerProfile.role === "admin") {
        return NextResponse.json({ success: true, sent: 0 });
      }
      const inviterName = callerProfile.full_name || "A teammate";

      // 1. Invite the teammate (client-facing → localized by the invited
      // client's locale, since no profile exists yet).
      const { data: teamInviteRow } = await supabase
        .from("invited_emails")
        .select("clients(locale)")
        .eq("email", invite_email.toLowerCase())
        .maybeSingle();
      const teamInviteLocale = toLocale(
        (teamInviteRow as { clients?: { locale?: string } | null } | null)
          ?.clients?.locale
      );
      const inviteResult = await sendEmail({
        to: invite_email,
        subject:
          teamInviteLocale === "es"
            ? `Te invitamos a tu portal de diseño de ${client_name}`
            : `You're invited to your ${client_name} design portal`,
        react: InviteEmail({
          clientName: client_name,
          portalUrl: "https://vimistudio.com/portal/login",
          invitedByName: inviterName,
          locale: teamInviteLocale,
        }),
      });

      // 2. Heads-up to the client's designer (or all admins if unassigned).
      const admins = await resolveClientNotifyAdmins(
        supabase,
        callerProfile.client_id
      );
      const eligibleAdmins = admins.filter(
        (a) => a.email && a.id !== user.id
      );
      const adminResults = await Promise.allSettled(
        eligibleAdmins.map((admin) =>
          sendEmail({
            to: admin.email!,
            subject: `${inviterName} invited a teammate to ${client_name}`,
            react: TeamInviteEmail({
              inviterName,
              inviterEmail: user.email || "",
              invitedEmail: invite_email,
              clientName: client_name,
              portalUrl: "https://vimistudio.com/portal/admin",
            }),
          })
        )
      );
      const adminsSent = adminResults.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      return NextResponse.json({
        success: inviteResult.success,
        sent: (inviteResult.success ? 1 : 0) + adminsSent,
      });
    }

    // Handle client_signed_in — notify admin(s) that a client just signed in
    if (type === "client_signed_in") {
      // Only clients should trigger this, not admins
      if (callerProfile.role === "admin") {
        return NextResponse.json({ success: true, sent: 0 });
      }

      const admins = await resolveClientNotifyAdmins(
        supabase,
        callerProfile.client_id
      );

      const clientName = client_name || "a project";
      const callerName = callerProfile.full_name || "A client";
      const eligible = admins.filter(
        (a) => a.email && a.id !== user.id
      );
      const results = await Promise.allSettled(
        eligible.map((admin) =>
          sendEmail({
            to: admin.email!,
            subject: `${callerName} just signed in to ${clientName}'s portal`,
            react: ClientSignedInEmail({
              clientUserName: callerName,
              clientUserEmail: user.email || "",
              clientName,
              portalUrl: "https://vimistudio.com/portal/admin",
            }),
          })
        )
      );
      const sent = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
      return NextResponse.json({ success: true, sent });
    }

    // Handle milestone_done — a client ticked a "what we need from you" item.
    // Emails the studio admins so they know the plan can keep moving.
    if (type === "milestone_done") {
      if (callerProfile.role === "admin") {
        return NextResponse.json({ success: true, sent: 0 });
      }
      if (!milestone_id) {
        return NextResponse.json({ error: "milestone_id required" }, { status: 400 });
      }

      const { data: milestone } = await supabase
        .from("client_milestones")
        .select("title, request_id, clients(name)")
        .eq("id", milestone_id)
        .single();

      if (!milestone) {
        return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
      }

      const clientLabel =
        (milestone as { clients?: { name?: string } | null }).clients?.name ||
        client_name ||
        "a client";
      const callerName = callerProfile.full_name || "A client";

      // Route to the linked request's assignee when the milestone points at a
      // request; otherwise fall back to client designer → all admins.
      let milestoneAssigneeId: string | null = null;
      if (milestone.request_id) {
        const { data: linkedReq } = await supabase
          .from("requests")
          .select("assignee_id")
          .eq("id", milestone.request_id)
          .maybeSingle();
        milestoneAssigneeId = linkedReq?.assignee_id ?? null;
      }

      const admins = await resolveRequestNotifyAdmins(
        supabase,
        milestoneAssigneeId,
        callerProfile.client_id
      );
      const eligible = admins.filter((a) => a.email && a.id !== user.id);
      const results = await Promise.allSettled(
        eligible.map((admin) =>
          sendEmail({
            to: admin.email!,
            subject: `${callerName} completed a plan item for ${clientLabel}`,
            react: MilestoneDoneEmail({
              clientUserName: callerName,
              clientUserEmail: user.email || "",
              clientName: clientLabel,
              milestoneTitle: milestone.title,
              portalUrl: "https://vimistudio.com/portal/admin",
            }),
          })
        )
      );
      const sent = results.filter(
        (r) => r.status === "fulfilled" && r.value.success
      ).length;
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
      .select("*, clients(name, slug, locale)")
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
      locale?: string | null;
    }
    let recipients: Recipient[] = [];

    if (isCallerAdmin) {
      // Admin action → notify client users for this request's client
      const { data } = await supabase
        .from("profiles")
        .select("id, email, locale")
        .eq("client_id", req.client_id);
      recipients = data ?? [];
    } else {
      // Client action → notify the request's assignee (or client designer, or
      // all admins). Covers comment/status/deliverable/request_created/
      // direction_voted — every client-originated request-scoped notification.
      recipients = await resolveRequestNotifyAdmins(
        supabase,
        (req as { assignee_id?: string | null }).assignee_id,
        req.client_id
      );
    }

    // Client-facing sends (admin → clients) localize per recipient; admin-facing
    // sends (client → admins) stay English.
    const clientLocaleFallback = toLocale(
      (req as { clients?: { locale?: string } | null }).clients?.locale
    );
    const resolveRecipientLocale = (recipient: Recipient): Locale =>
      isCallerAdmin
        ? toLocale(recipient.locale ?? clientLocaleFallback)
        : "en";

    // Don't email the person who triggered the action, or people without emails
    const filtered = recipients.filter(
      (r) => r.id !== user.id && r.email
    );

    if (filtered.length === 0) {
      return NextResponse.json({ success: true, sent: 0 });
    }

    const actorName = callerProfile.full_name || "Someone";
    const requestUrl = `https://vimistudio.com/portal/requests/${request_id}`;

    // Pre-fetch data needed for templates (avoid N+1 queries per recipient),
    // then build the email per recipient locale in the send loop below.
    let buildEmail: (locale: Locale) => {
      subject: string;
      react: React.ReactElement;
    };

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

        buildEmail = (locale) => ({
          subject:
            locale === "es"
              ? `${actorName} comentó en «${req.title}»`
              : `${actorName} commented on "${req.title}"`,
          react: CommentAddedEmail({
            requestTitle: req.title,
            requestUrl,
            commenterName: actorName,
            commentBody: latestComment?.body || "New comment",
            requestType: TYPE_LABELS[req.type] || req.type,
            locale,
          }),
        });
        break;
      }
      case "status_changed": {
        const resolvedNew = new_status || req.status;
        buildEmail = (locale) => {
          const newLabel =
            STATUS_LABELS[locale][resolvedNew] || resolvedNew || "Unknown";
          return {
            subject:
              locale === "es"
                ? `«${req.title}» pasó a ${newLabel}`
                : `"${req.title}" moved to ${newLabel}`,
            react: StatusChangedEmail({
              requestTitle: req.title,
              requestUrl,
              oldStatus: old_status || req.status,
              newStatus: resolvedNew,
              changedByName: actorName,
              locale,
            }),
          };
        };
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
        buildEmail = (locale) => ({
          subject:
            locale === "es"
              ? `Nuevos archivos para «${req.title}»`
              : `New files for "${req.title}"`,
          react: DeliverableUploadedEmail({
            requestTitle: req.title,
            requestUrl,
            uploaderName: actorName,
            fileNames,
            fileCount: fileNames.length || 1,
            locale,
          }),
        });
        break;
      }
      case "request_created": {
        // Admin-facing (client → admins) → English only.
        const clientName = (req as { clients?: { name?: string } | null }).clients?.name || "A client";
        const priorityLabels: Record<number, string> = { 1: "Whenever", 2: "This Week", 3: "Urgent" };
        buildEmail = () => ({
          subject: `New request from ${clientName}: "${req.title}"`,
          react: RequestCreatedEmail({
            requestTitle: req.title,
            requestUrl,
            clientName,
            requestType: TYPE_LABELS[req.type] || req.type,
            priority: priorityLabels[reqPriority as number] || priorityLabels[req.priority] || "Normal",
            description: (reqDescription as string) || undefined,
          }),
        });
        break;
      }
      case "direction_voted": {
        // Admin-facing (client → admins) → English only.
        buildEmail = () => ({
          subject: `${actorName} picked a direction for "${req.title}"`,
          react: DirectionVotedEmail({
            requestTitle: req.title,
            requestUrl,
            voterName: actorName,
            directionLabel: (direction_label as string) || "a direction",
            comment: (vote_comment as string) || undefined,
          }),
        });
        break;
      }
      default:
        return NextResponse.json({ success: true, sent: 0 });
    }

    const results = await Promise.allSettled(
      filtered.map((recipient) => {
        const { subject, react } = buildEmail(resolveRecipientLocale(recipient));
        return sendEmail({
          to: recipient.email!,
          subject,
          react,
        });
      })
    );
    const sent = results.filter(
      (r) => r.status === "fulfilled" && r.value.success
    ).length;

    return NextResponse.json({ success: true, sent });
  } catch (err) {
    console.error("[notify] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
