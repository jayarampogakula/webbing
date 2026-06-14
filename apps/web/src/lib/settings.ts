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
  const prefix = isCursorWebs ? "cursorwebs_" : "";

  const defaultApp = isCursorWebs ? "CursorWebs" : "Webbing";
  const defaultLogo = isCursorWebs ? "/logo.png" : "";
  const defaultEmail = isCursorWebs ? "support@cursorwebs.com" : "support@webbing.in";
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
      appName: map[prefix + "appName"] ?? defaultApp,
      appLogo: map[prefix + "appLogo"] ?? defaultLogo,
      appEmail: map[prefix + "appEmail"] ?? defaultEmail,
      upiId: map[prefix + "upiId"] ?? map.upiId ?? "pogakula@ybl",
      landingHeroTitle: map[prefix + "landingHeroTitle"] ?? map.landingHeroTitle ?? "Build polished websites with AI in one flow.",
      landingHeroSubtitle: map[prefix + "landingHeroSubtitle"] ?? defaultHeroSubtitle,
      landingAboutTitle: map[prefix + "landingAboutTitle"] ?? defaultAboutTitle,
      landingAboutText: map[prefix + "landingAboutText"] ?? map.landingAboutText ?? "The platform combines prompt-driven generation, reusable page sections, publishing workflows, and admin-level provider controls so teams can build without wrestling with scattered tools.",
      landingContactTitle: map[prefix + "landingContactTitle"] ?? map.landingContactTitle ?? "Need a custom workflow?",
      landingContactText: map[prefix + "landingContactText"] ?? defaultContactText,
      landingContactEmail: map[prefix + "landingContactEmail"] ?? defaultEmail,
      landingFeatures: map[prefix + "landingFeatures"] ?? map.landingFeatures ?? "",
      policyPrivacy: map[prefix + "policyPrivacy"] ?? map.policyPrivacy ?? "",
      policyTerms: map[prefix + "policyTerms"] ?? map.policyTerms ?? "",
      policyRefund: map[prefix + "policyRefund"] ?? map.policyRefund ?? "",
      affiliateEnabled: map[prefix + "affiliateEnabled"] ?? map.affiliateEnabled ?? "true",
      affiliateTier1Max: map[prefix + "affiliateTier1Max"] ?? map.affiliateTier1Max ?? "10",
      affiliateTier1Rate: map[prefix + "affiliateTier1Rate"] ?? map.affiliateTier1Rate ?? "20",
      affiliateTier2Max: map[prefix + "affiliateTier2Max"] ?? map.affiliateTier2Max ?? "50",
      affiliateTier2Rate: map[prefix + "affiliateTier2Rate"] ?? map.affiliateTier2Rate ?? "25",
      affiliateTier3Rate: map[prefix + "affiliateTier3Rate"] ?? map.affiliateTier3Rate ?? "30",
      affiliateRecurringRate: map[prefix + "affiliateRecurringRate"] ?? map.affiliateRecurringRate ?? "10",
      licenseKey: map[prefix + "licenseKey"] ?? map.licenseKey ?? "",
      smtpHost: map[prefix + "smtpHost"] ?? map.smtpHost ?? "",
      smtpPort: map[prefix + "smtpPort"] ?? map.smtpPort ?? "465",
      smtpUser: map[prefix + "smtpUser"] ?? map.smtpUser ?? "",
      smtpPass: map[prefix + "smtpPass"] ?? map.smtpPass ?? "",
      smtpFromName: map[prefix + "smtpFromName"] ?? map.smtpFromName ?? "",
      smtpFromEmail: map[prefix + "smtpFromEmail"] ?? map.smtpFromEmail ?? "",
      themeBgColor: map[prefix + "themeBgColor"] ?? map.themeBgColor ?? "#060914",
      themeTextColor: map[prefix + "themeTextColor"] ?? map.themeTextColor ?? "#f8fafc",
      themeMutedColor: map[prefix + "themeMutedColor"] ?? map.themeMutedColor ?? "#9aa7bd",
      themePrimaryColor: map[prefix + "themePrimaryColor"] ?? map.themePrimaryColor ?? "#4f7cff",
      themeSecondaryColor: map[prefix + "themeSecondaryColor"] ?? map.themeSecondaryColor ?? "#20c7b5",
      themePanelColor: map[prefix + "themePanelColor"] ?? map.themePanelColor ?? "#0d1323",
      themeBorderColor: map[prefix + "themeBorderColor"] ?? map.themeBorderColor ?? "rgba(226, 232, 240, 0.12)",
    };
  } catch (error) {
    console.error("Error reading system settings from DB:", error);
    return {
      appName: defaultApp,
      appLogo: defaultLogo,
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
