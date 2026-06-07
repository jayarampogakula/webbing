import { useState, useEffect } from "react";

export interface SystemSettings {
  appName: string;
  appLogo: string;
  appEmail: string;
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
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    appName: "Webbing",
    appLogo: "",
    appEmail: "support@webbing.in",
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error("Failed to fetch settings client-side:", err))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { settings, loading };
}
