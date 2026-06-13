import { prisma } from "@webbing/db";

export interface SystemSettings {
  appName: string;
  appLogo: string;
  appEmail: string;
  upiId: string;
  landingHeroTitle: string;
  landingHeroSubtitle: string;
  landingAboutTitle: string;
  landingAboutText: string;
  landingContactTitle: string;
  landingContactText: string;
  landingContactEmail: string;
  landingFeatures: string;
  policyPrivacy: string;
  policyTerms: string;
  policyRefund: string;
  // Affiliate Partner configurations
  affiliateEnabled: string;
  affiliateTier1Max: string;
  affiliateTier1Rate: string;
  affiliateTier2Max: string;
  affiliateTier2Rate: string;
  affiliateTier3Rate: string;
  affiliateRecurringRate: string;
  licenseKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  smtpFromName: string;
  smtpFromEmail: string;
  // Theme Color Configurations
  themeBgColor: string;
  themeTextColor: string;
  themeMutedColor: string;
  themePrimaryColor: string;
  themeSecondaryColor: string;
  themePanelColor: string;
  themeBorderColor: string;
}

export async function getSystemSettings(host?: string): Promise<SystemSettings> {
  let resolvedHost = host;
  if (!resolvedHost) {
    try {
      const { headers } = await import("next/headers");
      const headersList = headers();
      resolvedHost = headersList.get("x-forwarded-host") || headersList.get("host") || "";
    } catch (e) {
      // Ignore if headers() is called outside request context
    }
  }

  const cleanHost = resolvedHost ? resolvedHost.toLowerCase().split(":")[0] : "";
  const isCursorWebs = cleanHost.includes("cursonwebs") || cleanHost.includes("cursorwebs");
  const defaultApp = isCursorWebs ? "CursorWebs" : "Webbing";
  const defaultEmail = isCursorWebs ? "support@cursonwebs.com" : "support@webbing.in";
  const defaultHeroSubtitle = isCursorWebs
    ? "Describe the business once and CursorWebs assembles a modern site with home, features, pricing, about, contact, hosting, and provider-aware AI routing."
    : "Describe the business once and Webbing assembles a modern site with home, features, pricing, about, contact, hosting, and provider-aware AI routing.";
  const defaultAboutTitle = isCursorWebs
    ? "CursorWebs is built for fast, useful site production."
    : "Webbing is built for fast, useful site production.";
  const defaultContactText = isCursorWebs
    ? "Reach the CursorWebs team for provider setup, agency plans, domain support, and enterprise onboarding."
    : "Reach the Webbing team for provider setup, agency plans, domain support, and enterprise onboarding.";

  try {
    const settings = await prisma.systemSetting.findMany();
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
 
    return {
      appName: map.appName || defaultApp,
      appLogo: map.appLogo || "",
      appEmail: map.appEmail || defaultEmail,
      upiId: map.upiId || "pogakula@ybl",
      landingHeroTitle: map.landingHeroTitle || "Build polished websites with AI in one flow.",
      landingHeroSubtitle: map.landingHeroSubtitle || defaultHeroSubtitle,
      landingAboutTitle: map.landingAboutTitle || defaultAboutTitle,
      landingAboutText: map.landingAboutText || "The platform combines prompt-driven generation, reusable page sections, publishing workflows, and admin-level provider controls so teams can build without wrestling with scattered tools.",
      landingContactTitle: map.landingContactTitle || "Need a custom workflow?",
      landingContactText: map.landingContactText || defaultContactText,
      landingContactEmail: map.landingContactEmail || defaultEmail,
      affiliateEnabled: map.affiliateEnabled || "true",
      affiliateTier1Max: map.affiliateTier1Max || "10",
      affiliateTier1Rate: map.affiliateTier1Rate || "20",
      affiliateTier2Max: map.affiliateTier2Max || "50",
      affiliateTier2Rate: map.affiliateTier2Rate || "25",
      affiliateTier3Rate: map.affiliateTier3Rate || "30",
      affiliateRecurringRate: map.affiliateRecurringRate || "10",
      licenseKey: map.licenseKey || "",
      smtpHost: map.smtpHost || "",
      smtpPort: map.smtpPort || "465",
      smtpUser: map.smtpUser || "",
      smtpPass: map.smtpPass || "",
      smtpFromName: map.smtpFromName || "",
      smtpFromEmail: map.smtpFromEmail || "",
      themeBgColor: map.themeBgColor || "#060914",
      themeTextColor: map.themeTextColor || "#f8fafc",
      themeMutedColor: map.themeMutedColor || "#9aa7bd",
      themePrimaryColor: map.themePrimaryColor || "#4f7cff",
      themeSecondaryColor: map.themeSecondaryColor || "#20c7b5",
      themePanelColor: map.themePanelColor || "#0d1323",
      themeBorderColor: map.themeBorderColor || "rgba(226, 232, 240, 0.12)",
    };
  } catch (error) {
    console.error("Error reading system settings from DB:", error);
    return {
      appName: defaultApp,
      appLogo: "",
      appEmail: defaultEmail,
      upiId: "pogakula@ybl",
      landingHeroTitle: "Build polished websites with AI in one flow.",
      landingHeroSubtitle: defaultHeroSubtitle,
      landingAboutTitle: defaultAboutTitle,
      landingAboutText: "The platform combines prompt-driven generation, reusable page sections, publishing workflows, and admin-level provider controls so teams can build without wrestling with scattered tools.",
      landingContactTitle: "Need a custom workflow?",
      landingContactText: defaultContactText,
      landingContactEmail: defaultEmail,
      landingFeatures: "",
      policyPrivacy: "",
      policyTerms: "",
      policyRefund: "",
      affiliateEnabled: "true",
      affiliateTier1Max: "10",
      affiliateTier1Rate: "20",
      affiliateTier2Max: "50",
      affiliateTier2Rate: "25",
      affiliateTier3Rate: "30",
      affiliateRecurringRate: "10",
      licenseKey: "",
      smtpHost: "",
      smtpPort: "465",
      smtpUser: "",
      smtpPass: "",
      smtpFromName: "",
      smtpFromEmail: "",
      themeBgColor: "#060914",
      themeTextColor: "#f8fafc",
      themeMutedColor: "#9aa7bd",
      themePrimaryColor: "#4f7cff",
      themeSecondaryColor: "#20c7b5",
      themePanelColor: "#0d1323",
      themeBorderColor: "rgba(226, 232, 240, 0.12)",
    };
  }
}
