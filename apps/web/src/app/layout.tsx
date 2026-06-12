import type { Metadata } from "next";
import "./globals.css";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkSetupAndLicense } from "@/lib/licensing";

export const metadata: Metadata = {
  title: "Webbing - Production AI Website Builder SaaS",
  description: "Generate complete responsive websites, visual editors, custom domains, and e-commerce stores instantly using AI.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = headers().get("x-pathname") || "";

  // Bypass checks for setup wizard, api routes, static next assets, and file resources
  const shouldBypass = 
    pathname.startsWith("/setup") || 
    pathname.startsWith("/api") || 
    pathname.startsWith("/_next") || 
    pathname.includes(".");

  if (!shouldBypass) {
    const { setupRequired, licenseValid } = await checkSetupAndLicense();
    if (setupRequired || !licenseValid) {
      redirect("/setup");
    }
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#0b0f19", color: "#f3f4f6" }}>
        {children}
      </body>
    </html>
  );
}

