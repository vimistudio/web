import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not add logic between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated users trying to access portal → redirect to login
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/portal") &&
    !request.nextUrl.pathname.startsWith("/portal/login") &&
    !request.nextUrl.pathname.startsWith("/portal/auth")
  ) {
    const url = request.nextUrl.clone();
    const currentPath = request.nextUrl.pathname;
    url.pathname = "/portal/login";
    // Deep-link: pass the original path so login redirects back after auth
    if (currentPath && currentPath !== "/portal") {
      url.searchParams.set("next", currentPath);
    }
    return NextResponse.redirect(url);
  }

  // Authenticated users on login page → redirect to portal (or deep-link target)
  if (user && request.nextUrl.pathname === "/portal/login") {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next");
    url.pathname = next && next.startsWith("/portal") ? next : "/portal";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
