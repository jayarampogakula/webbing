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

  // Redirect to landing page dynamically using request URL
  return NextResponse.redirect(new URL("/", request.url));
}
