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
}

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const settings = await prisma.systemSetting.findMany();
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return {
      appName: map.appName || "Webbing",
      appLogo: map.appLogo || "",
      appEmail: map.appEmail || "support@webbing.in",
      upiId: map.upiId || "pogakula@ybl",
      landingHeroTitle: map.landingHeroTitle || "Build polished websites with AI in one flow.",
      landingHeroSubtitle: map.landingHeroSubtitle || "Describe the business once and Webbing assembles a modern site with home, features, pricing, about, contact, hosting, and provider-aware AI routing.",
      landingAboutTitle: map.landingAboutTitle || "Webbing is built for fast, useful site production.",
      landingAboutText: map.landingAboutText || "The platform combines prompt-driven generation, reusable page sections, publishing workflows, and admin-level provider controls so teams can build without wrestling with scattered tools.",
      landingContactTitle: map.landingContactTitle || "Need a custom workflow?",
      landingContactText: map.landingContactText || "Reach the Webbing team for provider setup, agency plans, domain support, and enterprise onboarding.",
      landingContactEmail: map.landingContactEmail || "support@webbing.in",
      landingFeatures: map.landingFeatures || "",
      policyPrivacy: map.policyPrivacy || "",
      policyTerms: map.policyTerms || "",
      policyRefund: map.policyRefund || "",
      affiliateEnabled: map.affiliateEnabled || "true",
      affiliateTier1Max: map.affiliateTier1Max || "10",
      affiliateTier1Rate: map.affiliateTier1Rate || "20",
      affiliateTier2Max: map.affiliateTier2Max || "50",
      affiliateTier2Rate: map.affiliateTier2Rate || "25",
      affiliateTier3Rate: map.affiliateTier3Rate || "30",
      affiliateRecurringRate: map.affiliateRecurringRate || "10",
      licenseKey: map.licenseKey || "",
    };
  } catch (error) {
    console.error("Error reading system settings from DB:", error);
    return {
      appName: "Webbing",
      appLogo: "",
      appEmail: "support@webbing.in",
      upiId: "pogakula@ybl",
      landingHeroTitle: "Build polished websites with AI in one flow.",
      landingHeroSubtitle: "Describe the business once and Webbing assembles a modern site with home, features, pricing, about, contact, hosting, and provider-aware AI routing.",
      landingAboutTitle: "Webbing is built for fast, useful site production.",
      landingAboutText: "The platform combines prompt-driven generation, reusable page sections, publishing workflows, and admin-level provider controls so teams can build without wrestling with scattered tools.",
      landingContactTitle: "Need a custom workflow?",
      landingContactText: "Reach the Webbing team for provider setup, agency plans, domain support, and enterprise onboarding.",
      landingContactEmail: "support@webbing.in",
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
    };
  }
}
