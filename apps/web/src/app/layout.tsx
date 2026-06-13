import type { Metadata } from "next";
import "./globals.css";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkSetupAndLicense } from "@/lib/licensing";
import { getSystemSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSystemSettings();
  const appName = settings.appName || "Webbing";
  return {
    title: `${appName} - Production AI Website Builder SaaS`,
    description: `Generate complete responsive websites, visual editors, custom domains, and e-commerce stores instantly using ${appName}.`,
  };
}

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
  
  // Dynamically compute color-scheme based on background brightness
  let colorScheme = "dark";
  const bg = settings.themeBgColor || "#060914";
  if (bg.startsWith("#")) {
    const hex = bg.replace("#", "");
    let r = 6, g = 9, b = 20;
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    }
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    if (brightness > 150) {
      colorScheme = "light";
    }
  }

  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          :root {
            color-scheme: ${colorScheme};
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

