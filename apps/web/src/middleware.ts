import { NextRequest, NextResponse } from "next/server";

// Edge-safe decoding helper to avoid Node.js crypto/Buffer in middleware
function decodeSession(token: string): { userId: string; email: string; role: string; tenantId: string } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [data] = parts;
  try {
    const jsonStr = atob(data);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

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

  // Strip port from hostname so subdomain detection works on any port (3000, 3001, etc.)
  const hostnameWithoutPort = hostname.split(":")[0].toLowerCase();

  // Local development fallback/handling
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://webbing.io";
  let appHost = appUrl.startsWith("http") ? new URL(appUrl).hostname : appUrl.split(":")[0];
  appHost = appHost.toLowerCase();

  // Auto-adapt base domain mapping to support webbing.in dynamically
  if (hostnameWithoutPort.endsWith("webbing.in")) {
    appHost = "webbing.in";
  } else if (hostnameWithoutPort.endsWith("webbing.io")) {
    appHost = "webbing.io";
  }
  
  // Extract subdomain dynamically regardless of port or environment
  let currentHost = "";
  if (hostnameWithoutPort.endsWith(appHost)) {
    currentHost = hostnameWithoutPort.replace(`.${appHost}`, "").replace(appHost, "");
  } else if (hostnameWithoutPort.endsWith("localhost")) {
    currentHost = hostnameWithoutPort.replace(".localhost", "").replace("localhost", "");
  } else {
    // Treat as custom domain (e.g. customerdomain.com)
    currentHost = hostnameWithoutPort;
  }

  currentHost = currentHost.replace(/^www\./, "");

  const hostClean = hostnameWithoutPort.replace("www.", "");

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
    const user = sessionToken ? decodeSession(sessionToken) : null;

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

  // 2. Subdomain & Custom Domain routing
  // Rewrites requests to the unified dynamic site renderer
  return NextResponse.rewrite(new URL(`/_sites/${currentHost}${path}`, req.url));
}
