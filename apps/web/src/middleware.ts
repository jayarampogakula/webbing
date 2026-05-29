import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (static files)
     * 4. All file extensions (e.g. favicon.ico, images)
     */
    "/((?!api|_next|_static|[\\w-]+\\.\\w+).*)",
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "webbing.io";
  const path = url.pathname;

  // Local development fallback/handling
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://webbing.io";
  const appHost = appUrl.startsWith("http") ? new URL(appUrl).host : appUrl;
  
  let currentHost = "";
  if (process.env.NODE_ENV === "production") {
    currentHost = hostname.replace(`.${appHost}`, "").replace(appHost, "");
  } else {
    currentHost = hostname.replace(".localhost:3000", "").replace("localhost:3000", "");
  }

  const hostClean = hostname.replace("www.", "");

  // 1. Root and standard app/dashboard pages
  if (
    currentHost === "" ||
    hostClean === "webbing.io" ||
    hostClean === "webbing.in" ||
    hostClean === "app.webbing.io" ||
    hostClean === "app.webbing.in" ||
    currentHost === "app"
  ) {
    const sessionToken = req.cookies.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    // Guard /dashboard
    if (path.startsWith("/dashboard")) {
      if (!user) {
        return NextResponse.redirect(new URL("/signin", req.url));
      }
    }

    // Guard /admin
    if (path.startsWith("/admin")) {
      if (!user) {
        return NextResponse.redirect(new URL("/signin", req.url));
      }
      if (user.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Redirect logged-in users away from /signin
    if (path === "/signin") {
      if (user) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Standard app dashboard routing
    return NextResponse.next();
  }

  // 2. Subdomain routing (e.g., customer.webbing.io or customer.localhost:3000)
  // If it's a subdomain, rewrite to /_sites/subdomain/[path]
  if (!currentHost.includes(".")) {
    return NextResponse.rewrite(new URL(`/_sites/${currentHost}${path}`, req.url));
  }

  // 3. Custom domain routing (e.g., customdomain.com)
  // Rewrite to /_sites/custom/[domain]/[path]
  return NextResponse.rewrite(
    new URL(`/_sites/custom/${currentHost}${path}`, req.url)
  );
}
