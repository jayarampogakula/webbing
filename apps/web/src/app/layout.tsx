import type { Metadata } from "next";
import "./globals.css";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkSetupAndLicense } from "@/lib/licensing";
import { getSystemSettings } from "@/lib/settings";

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
    const hostHeader = headers().get("x-forwarded-host") || headers().get("host") || "";
    const { setupRequired, licenseValid } = await checkSetupAndLicense(hostHeader);
    if (setupRequired || !licenseValid) {
      redirect("/setup");
    }
  }

  const settings = await getSystemSettings();

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            --bg: ${settings.themeBgColor};
            --text: ${settings.themeTextColor};
            --muted: ${settings.themeMutedColor};
            --blue: ${settings.themePrimaryColor};
            --teal: ${settings.themeSecondaryColor};
            --panel: ${settings.themePanelColor};
            --panel-2: ${settings.themePanelColor};
            --line: ${settings.themeBorderColor};
          }
        `}} />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "var(--bg)", color: "var(--text)" }}>
        {children}
      </body>
    </html>
  );
}

