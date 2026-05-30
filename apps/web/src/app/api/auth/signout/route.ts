import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = cookies();
  
  // Clear the session cookie
  cookieStore.set("webbing-session", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0), // expire immediately
    maxAge: 0,
  });

  // Redirect to landing page dynamically using request headers to avoid docker hostname redirect issues
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "webbing.in";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const baseUrl = `${proto}://${host}`;
  return NextResponse.redirect(new URL("/", baseUrl));
}
