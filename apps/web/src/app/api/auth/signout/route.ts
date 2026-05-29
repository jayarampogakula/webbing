import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  
  // Clear the session cookie
  cookieStore.set("webbing-session", "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0), // expire immediately
    maxAge: 0,
  });

  // Redirect to landing page
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
