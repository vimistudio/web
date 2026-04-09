import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { ClientSignedInEmail } from "@/lib/email/templates/client-signed-in";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/portal";
  // Prevent open redirect — only allow relative paths starting with /
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/portal";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if this is a client's first sign-in → notify admin
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, client_id, full_name, clients(name)")
          .eq("id", user.id)
          .single();

        if (profile?.role === "client" && profile.client_id) {
          const clientName =
            (profile as { clients?: { name?: string } | null }).clients?.name || "their project";

          // Fire-and-forget: notify admin of first sign-in
          // Entire block is non-blocking — don't delay the redirect
          const callerName = profile.full_name || "A client";
          const callerEmail = user.email || "";
          void (async () => {
            try {
              const { data: admins } = await supabase
                .from("profiles")
                .select("email")
                .eq("role", "admin");
              await Promise.allSettled(
                (admins ?? [])
                  .filter((a) => a.email)
                  .map((admin) =>
                    sendEmail({
                      to: admin.email!,
                      subject: `${callerName} just signed in to ${clientName}'s portal`,
                      react: ClientSignedInEmail({
                        clientUserName: callerName,
                        clientUserEmail: callerEmail,
                        clientName,
                        portalUrl: "https://vimistudio.com/portal/admin",
                      }),
                    })
                  )
              );
            } catch {}
          })();
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/portal/login?error=auth_failed`);
}
