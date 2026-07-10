import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// OWNER-ONLY permanent delete of an ARCHIVED request. This is real deletion —
// it removes the request row, every child row that references it, and the
// backing storage objects, so nothing is left orphaned. Only archived
// (soft-deleted) requests are purgeable; a live request is refused.
//
// Ownership mirrors the rest of the app: role='admin' AND is_owner. Ownership
// fails OPEN on the column being absent (pre-migration deploy window), so only
// an explicit is_owner === false demotes to staff → 403.
export async function POST(request: Request) {
  try {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_owner")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Fail OPEN: only an explicit false is staff.
    const isOwner = profile.is_owner !== false;
    if (!isOwner) {
      return NextResponse.json({ error: "Owner only" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const id: unknown = body?.id;
    if (typeof id !== "string" || id.length === 0) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // Load + gate: must exist AND be archived. Never hard-delete a live request.
    const { data: target, error: loadError } = await supabase
      .from("requests")
      .select("id, is_archived")
      .eq("id", id)
      .single();

    if (loadError || !target) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (!target.is_archived) {
      return NextResponse.json(
        { error: "Only archived requests can be permanently deleted" },
        { status: 409 }
      );
    }

    // --- Gather child rows + storage paths ---
    const [deliverablesRes, referencesRes, commentsRes, postsRes] =
      await Promise.all([
        supabase.from("deliverables").select("id, file_path").eq("request_id", id),
        supabase.from("reference_images").select("file_path").eq("request_id", id),
        supabase.from("comments").select("attachment_path").eq("request_id", id),
        supabase.from("social_posts").select("id").eq("request_id", id),
      ]);

    const deliverableIds = (deliverablesRes.data ?? []).map((d) => d.id);
    const postIds = (postsRes.data ?? []).map((p) => p.id);

    let slidePaths: string[] = [];
    if (postIds.length > 0) {
      const { data: slides } = await supabase
        .from("social_slides")
        .select("image_path")
        .in("post_id", postIds);
      slidePaths = (slides ?? [])
        .map((s) => s.image_path)
        .filter((p): p is string => !!p);
    }

    const deliverablePaths = (deliverablesRes.data ?? [])
      .map((d) => d.file_path)
      .filter((p): p is string => !!p);
    // reference_images and comment attachments both live in the "references" bucket.
    const referencePaths = [
      ...(referencesRes.data ?? []).map((r) => r.file_path),
      ...(commentsRes.data ?? []).map((c) => c.attachment_path),
    ].filter((p): p is string => !!p);

    // --- Remove storage objects first (retry-safe: removing a missing object
    // is a no-op in Supabase, so a later DB failure can be safely re-run). ---
    const removals: Promise<{ error: unknown }>[] = [];
    if (deliverablePaths.length > 0) {
      removals.push(
        supabase.storage.from("deliverables").remove(deliverablePaths)
      );
    }
    if (referencePaths.length > 0) {
      removals.push(supabase.storage.from("references").remove(referencePaths));
    }
    if (slidePaths.length > 0) {
      removals.push(
        supabase.storage.from("social-slides").remove(slidePaths)
      );
    }
    const storageResults = await Promise.all(removals);
    const storageErr = storageResults.find((r) => r.error);
    if (storageErr?.error) {
      const message =
        storageErr.error instanceof Error
          ? storageErr.error.message
          : "Failed to remove files";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // --- Delete DB rows leaf-first so nothing is orphaned regardless of whether
    // the FKs cascade. Each step is checked; a failure aborts with a clean 500. ---
    const steps: { label: string; error: unknown }[] = [];

    if (deliverableIds.length > 0) {
      const { error } = await supabase
        .from("deliverable_events")
        .delete()
        .in("deliverable_id", deliverableIds);
      steps.push({ label: "deliverable_events (deliverable)", error });
    }
    if (postIds.length > 0) {
      const { error: evErr } = await supabase
        .from("deliverable_events")
        .delete()
        .in("social_post_id", postIds);
      steps.push({ label: "deliverable_events (social_post)", error: evErr });

      const { error: slideErr } = await supabase
        .from("social_slides")
        .delete()
        .in("post_id", postIds);
      steps.push({ label: "social_slides", error: slideErr });
    }

    steps.push({
      label: "social_posts",
      error: (await supabase.from("social_posts").delete().eq("request_id", id))
        .error,
    });
    steps.push({
      label: "deliverables",
      error: (await supabase.from("deliverables").delete().eq("request_id", id))
        .error,
    });
    steps.push({
      label: "reference_images",
      error: (
        await supabase.from("reference_images").delete().eq("request_id", id)
      ).error,
    });
    steps.push({
      label: "comments",
      error: (await supabase.from("comments").delete().eq("request_id", id))
        .error,
    });
    steps.push({
      label: "activity_log",
      error: (await supabase.from("activity_log").delete().eq("request_id", id))
        .error,
    });
    steps.push({
      label: "notifications",
      error: (await supabase.from("notifications").delete().eq("request_id", id))
        .error,
    });

    // Preserve client plan items — just unlink them from the purged request.
    const { error: milestoneErr } = await supabase
      .from("client_milestones")
      .update({ request_id: null })
      .eq("request_id", id);
    steps.push({ label: "client_milestones (unlink)", error: milestoneErr });

    // Detach any other request that was reused from this one (studio memory).
    const { error: reuseErr } = await supabase
      .from("requests")
      .update({ reused_from_request_id: null })
      .eq("reused_from_request_id", id);
    steps.push({ label: "requests (reuse unlink)", error: reuseErr });

    const failed = steps.find((s) => s.error);
    if (failed?.error) {
      const message =
        failed.error instanceof Error
          ? failed.error.message
          : `Failed to clean ${failed.label}`;
      return NextResponse.json({ error: message }, { status: 500 });
    }

    // Finally, the request itself.
    const { error: deleteError } = await supabase
      .from("requests")
      .delete()
      .eq("id", id);
    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message ?? "Failed to delete request" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
