"use client";

import React, { useState, useEffect } from "react";
import { Check, X, Shield, Plus, Trash2, Edit2, Sparkles, DollarSign, Layers, Users, Key, ChevronLeft, ChevronRight, Home, MessageSquare, Mail, Sliders } from "lucide-react";
import PlanEditor from "./PlanEditor";
import UserEditor from "./UserEditor";
import LlmKeyManager from "../components/LlmKeyManager";
import AdminProjectEditor from "./AdminProjectEditor";

interface Plan {
  id: string;
  name: string;
  price: number;
  creditsLimit: number;
  features: string;
}

interface PaymentRequest {
  id: string;
  tenantId: string;
  planId: string;
  amount: number;
  utr: string;
  status: string;
  createdAt: string;
  tenant: {
    name: string;
  };
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenant: {
    name: string;
  };
}

interface AdminProject {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  selfHosted: boolean;
  theme: any;
  tenant: {
    name: string;
  };
  customDomain: {
    hostname: string;
    verified: boolean;
  } | null;
  user?: {
    name: string | null;
    email: string;
  } | null;
}

interface AdminSubscription {
  id: string;
  tenantId: string;
  planId: string;
  status: string;
  creditsUsed: number;
  creditsLimit: number;
  withLlm: boolean;
  hostingType: string;
  domainType: string;
  tenant: {
    name: string;
  };
}

interface AdminConsoleProps {
  user: { userId: string; email: string; role: string; tenantId: string };
  users: AdminUser[];
  projects: AdminProject[];
  subscriptions: AdminSubscription[];
  totalTenants: number;
  llmKeys: any[];
  initialPlans: Plan[];
  initialRequests: PaymentRequest[];
  initialFeedbacks?: any[];
  initialUpiId: string;
  initialPayouts?: any[];
  initialRefunds?: any[];
  baseDomain: string;
  protocol: string;
  initialSettings?: any;
  enableLicenseGenerator?: boolean;
}

const emailTemplates = {
  welcome: {
    title: "Welcome Email (on Signup)",
    description: "Sent automatically to users when they successfully create their account.",
    subject: (appName: string) => `Welcome to ${appName}! ✨`,
    getHtml: (appName: string, appEmail: string, appUrl: string) => `
<div style="background-color: #0a0e17; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #f3f4f6; text-align: center; height: 100%;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 40px; text-align: left; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">✨ ${appName}</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 20px;">Welcome to ${appName}, John Doe!</h1>
    <p style="font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px;">
      We're thrilled to have you join ${appName}. Your account has been successfully created. You can now build, manage, and launch modern AI-powered websites in seconds.
    </p>
    <p style="font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 30px;">
      Your registered email address is: <strong style="color: #ffffff;">johndoe@example.com</strong>
    </p>
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${appUrl}/signin" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Go to Dashboard</a>
    </div>
    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 30px 0;">
    <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0;">
      If you did not sign up for this account, please contact us at ${appEmail}.
    </p>
  </div>
</div>
`
  },
  payment_request: {
    title: "Payment Under Review (on UTR Submission)",
    description: "Sent to the user confirming their payment submission is received and is currently under review by admin.",
    subject: (appName: string) => `Payment Verification Request Received - ${appName} 💳`,
    getHtml: (appName: string, appEmail: string, appUrl: string) => `
<div style="background-color: #0a0e17; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #f3f4f6; text-align: center; height: 100%;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 40px; text-align: left; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">💳 ${appName} Payments</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 20px;">Payment Verification Under Review</h1>
    <p style="font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px;">
      Hello John Doe, we have received your payment submission. Our billing team is currently verifying the transaction. Once verified, your upgrade/credits will be activated immediately.
    </p>
    <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #374151;">
      <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #ffffff; border-bottom: 1px solid #374151; padding-bottom: 8px;">Transaction Summary</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #d1d5db;">
        <tr>
          <td style="padding: 6px 0; color: #9ca3af;">Item/Plan:</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #ffffff;">Pro Plan</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af;">Amount Paid:</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #ffffff;">INR 599</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af;">UTR Transaction ID:</td>
          <td style="padding: 6px 0; font-family: monospace; font-weight: 600; text-align: right; color: #f59e0b;">UTR-TEST-123456</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af;">Status:</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #f59e0b;">PENDING VERIFICATION</td>
        </tr>
      </table>
    </div>
    <p style="font-size: 14px; color: #9ca3af; line-height: 1.6;">
      This verification process typically takes from 15 minutes to a few hours depending on banking hours. We will email you immediately once your account is activated.
    </p>
    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 30px 0;">
    <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0;">
      If you have any questions or need urgent activation, email ${appEmail}.
    </p>
  </div>
</div>
`
  },
  activation: {
    title: "Account Activated (on Payment Approval)",
    description: "Sent to the user when the admin verifies their payment and activates their premium subscription.",
    subject: (appName: string) => `Your ${appName} Account Plan is Activated! 🚀`,
    getHtml: (appName: string, appEmail: string, appUrl: string) => `
<div style="background-color: #0a0e17; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #f3f4f6; text-align: center; height: 100%;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 40px; text-align: left; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">🚀 ${appName} Plan Activated</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #34d399; margin-bottom: 20px;">Your Account is Activated!</h1>
    <p style="font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px;">
      Hello John Doe, great news! Your payment has been verified, and your premium subscription has been successfully activated.
    </p>
    <div style="background-color: rgba(52, 211, 153, 0.05); border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid rgba(52, 211, 153, 0.2);">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 16px; color: #34d399;">Active Plan: Pro Plan</h3>
      <p style="margin: 0; font-size: 14px; color: #d1d5db; line-height: 1.5;">
        You now have access to all premium features corresponding to your plan, including custom domains, priority AI generations, and expanded limits.
      </p>
    </div>
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${appUrl}/signin" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Start Building Now</a>
    </div>
    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 30px 0;">
    <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0;">
      Thank you for choosing ${appName}. Let's make something amazing!
    </p>
  </div>
</div>
`
  },
  credits: {
    title: "Credits Purchased (on Credit Approval)",
    description: "Sent to the user when the admin approves their payment for extra credit packs.",
    subject: (appName: string) => `${appName} Credits Purchased Successfully! ⚡`,
    getHtml: (appName: string, appEmail: string, appUrl: string) => `
<div style="background-color: #0a0e17; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #f3f4f6; text-align: center; height: 100%;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 40px; text-align: left; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">⚡ ${appName} Credits</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #818cf8; margin-bottom: 20px;">Credits Added Successfully!</h1>
    <p style="font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px;">
      Hello John Doe, your payment for extra credits has been approved. We have credited your account with your purchase.
    </p>
    <div style="background-color: rgba(129, 140, 248, 0.05); border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid rgba(129, 140, 248, 0.2); text-align: center;">
      <div style="font-size: 36px; font-weight: 850; color: #ffffff; margin-bottom: 5px;">+50</div>
      <div style="font-size: 14px; color: #818cf8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Credits Added</div>
    </div>
    <p style="font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 30px;">
      These credits are now available for website generations, AI copy writes, or image updates inside your workspace.
    </p>
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="${appUrl}/signin" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Go to Workspace</a>
    </div>
    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 30px 0;">
    <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0;">
      If you have any questions or concerns, email ${appEmail}.
    </p>
  </div>
</div>
`
  }
};

const THEME_PRESETS = [
  {
    name: "Default Indigo",
    colors: {
      themeBgColor: "#060914",
      themeTextColor: "#f8fafc",
      themeMutedColor: "#9aa7bd",
      themePrimaryColor: "#4f7cff",
      themeSecondaryColor: "#20c7b5",
      themePanelColor: "#0d1323",
      themeBorderColor: "rgba(226, 232, 240, 0.12)"
    }
  },
  {
    name: "Cyberpunk Purple",
    colors: {
      themeBgColor: "#0c0714",
      themeTextColor: "#f3e8ff",
      themeMutedColor: "#a78bfa",
      themePrimaryColor: "#8b5cf6",
      themeSecondaryColor: "#ec4899",
      themePanelColor: "#120a1f",
      themeBorderColor: "rgba(139, 92, 246, 0.15)"
    }
  },
  {
    name: "Ocean Emerald",
    colors: {
      themeBgColor: "#022c22",
      themeTextColor: "#f0fdf4",
      themeMutedColor: "#86efac",
      themePrimaryColor: "#10b981",
      themeSecondaryColor: "#06b6d4",
      themePanelColor: "#064e3b",
      themeBorderColor: "rgba(16, 185, 129, 0.15)"
    }
  },
  {
    name: "Luxury Gold",
    colors: {
      themeBgColor: "#0a0a0a",
      themeTextColor: "#f5f5f5",
      themeMutedColor: "#a3a3a3",
      themePrimaryColor: "#fbbf24",
      themeSecondaryColor: "#d97706",
      themePanelColor: "#171717",
      themeBorderColor: "rgba(251, 191, 36, 0.15)"
    }
  },
  {
    name: "Vampire Crimson",
    colors: {
      themeBgColor: "#0f0507",
      themeTextColor: "#ffe4e6",
      themeMutedColor: "#fda4af",
      themePrimaryColor: "#e11d48",
      themeSecondaryColor: "#f43f5e",
      themePanelColor: "#1c0b0e",
      themeBorderColor: "rgba(225, 29, 72, 0.18)"
    }
  },
  {
    name: "Neon Sapphire",
    colors: {
      themeBgColor: "#030712",
      themeTextColor: "#f3f4f6",
      themeMutedColor: "#9ca3af",
      themePrimaryColor: "#2563eb",
      themeSecondaryColor: "#3b82f6",
      themePanelColor: "#111827",
      themeBorderColor: "rgba(37, 99, 235, 0.15)"
    }
  },
  {
    name: "Sunset Amber",
    colors: {
      themeBgColor: "#0f0b08",
      themeTextColor: "#fff7ed",
      themeMutedColor: "#ffedd5",
      themePrimaryColor: "#f97316",
      themeSecondaryColor: "#f59e0b",
      themePanelColor: "#1c140e",
      themeBorderColor: "rgba(249, 115, 22, 0.15)"
    }
  },
  {
    name: "Forest Moss",
    colors: {
      themeBgColor: "#0b0f0b",
      themeTextColor: "#f0fdf4",
      themeMutedColor: "#a7f3d0",
      themePrimaryColor: "#84cc16",
      themeSecondaryColor: "#22c55e",
      themePanelColor: "#141f14",
      themeBorderColor: "rgba(132, 204, 22, 0.15)"
    }
  },
  {
    name: "Arctic Frost",
    colors: {
      themeBgColor: "#0f172a",
      themeTextColor: "#f8fafc",
      themeMutedColor: "#cbd5e1",
      themePrimaryColor: "#38bdf8",
      themeSecondaryColor: "#0ea5e9",
      themePanelColor: "#1e293b",
      themeBorderColor: "rgba(56, 189, 248, 0.15)"
    }
  },
  {
    name: "Cherry Blossom",
    colors: {
      themeBgColor: "#180f12",
      themeTextColor: "#fff1f2",
      themeMutedColor: "#fecdd3",
      themePrimaryColor: "#ec4899",
      themeSecondaryColor: "#f472b6",
      themePanelColor: "#27191f",
      themeBorderColor: "rgba(236, 72, 153, 0.15)"
    }
  }
];

export default function AdminConsole({
  user,
  users,
  projects,
  subscriptions,
  totalTenants,
  llmKeys,
  initialPlans,
  initialRequests,
  initialFeedbacks = [],
  initialUpiId,
  initialPayouts = [],
  initialRefunds = [],
  baseDomain,
  protocol,
  initialSettings,
  enableLicenseGenerator = false,
}: AdminConsoleProps) {
  // States
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "keys" | "plans" | "payments" | "feedback" | "emails" | "payouts" | "refunds" | "branding" | "licensing">("dashboard");
  const [upiId, setUpiId] = useState(initialUpiId);
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [requests, setRequests] = useState<PaymentRequest[]>(initialRequests);
  const [feedbacks, setFeedbacks] = useState<any[]>(initialFeedbacks);
  const [payouts, setPayouts] = useState<any[]>(initialPayouts);
  const [refunds, setRefunds] = useState<any[]>(initialRefunds);

  // System branding states
  const defaultAppName = initialSettings?.appName || "Webbing";
  const [appName, setAppName] = useState(defaultAppName);
  const [appLogo, setAppLogo] = useState(initialSettings?.appLogo || "");
  const [appEmail, setAppEmail] = useState(initialSettings?.appEmail || `support@${baseDomain}`);
  const [landingHeroTitle, setLandingHeroTitle] = useState(initialSettings?.landingHeroTitle || "Build polished websites with AI in one flow.");
  const [landingHeroSubtitle, setLandingHeroSubtitle] = useState(initialSettings?.landingHeroSubtitle || `Describe the business once and ${defaultAppName} assembles a modern site with home, features, pricing, about, contact, hosting, and provider-aware AI routing.`);
  const [landingAboutTitle, setLandingAboutTitle] = useState(initialSettings?.landingAboutTitle || `${defaultAppName} is built for fast, useful site production.`);
  const [landingAboutText, setLandingAboutText] = useState(initialSettings?.landingAboutText || "The platform combines prompt-driven generation, reusable page sections, publishing workflows, and admin-level provider controls so teams can build without wrestling with scattered tools.");
  const [landingContactTitle, setLandingContactTitle] = useState(initialSettings?.landingContactTitle || "Need a custom workflow?");
  const [landingContactText, setLandingContactText] = useState(initialSettings?.landingContactText || `Reach the ${defaultAppName} team for provider setup, agency plans, domain support, and enterprise onboarding.`);
  const [landingContactEmail, setLandingContactEmail] = useState(initialSettings?.landingContactEmail || `support@${baseDomain}`);
  
  const defaultFeatures = [
    { "icon": "Sparkles", "title": "AI copy and layout", "text": "Generate structured pages, hero copy, pricing blocks, feature grids, and contact sections from one prompt." },
    { "icon": "Layers3", "title": "Modern component system", "text": "Every website is composed from reusable sections that are easier to edit, inspect, and expand." },
    { "icon": "Globe2", "title": "Subdomain publishing", "text": "Publish projects to instant subdomains with custom-domain workflows ready for paid plans." },
    { "icon": "ShieldCheck", "title": "Provider key controls", "text": "Admins can configure global LLM keys while users can bring their own provider credentials." },
    { "icon": "ShoppingCart", "title": "eCommerce Storefronts", "text": "Generate complete single-vendor stores with shopping carts, checkout logic, product variants, inventory, and payment setup." },
    { "icon": "DollarSign", "title": "Annual Subscriptions", "text": "Switch to annual cycles to save up to 15% on paid plan quotas, making client sites highly affordable." },
    { "icon": "Code", "title": "White-labeled ZIP Export", "text": "Download fully offline-ready HTML, CSS, and vanilla JS archives of your sites, free of engine tags or scripts." },
    { "icon": "MessageSquare", "title": "Integrated Feedback System", "text": "Submit suggestions or report bugs directly from the dashboard panel. View resolved support tickets instantly." }
  ];
  
  const [landingFeatures, setLandingFeatures] = useState(
    initialSettings?.landingFeatures || JSON.stringify(defaultFeatures, null, 2)
  );

  const [themeBgColor, setThemeBgColor] = useState(initialSettings?.themeBgColor || "#060914");
  const [themeTextColor, setThemeTextColor] = useState(initialSettings?.themeTextColor || "#f8fafc");
  const [themeMutedColor, setThemeMutedColor] = useState(initialSettings?.themeMutedColor || "#9aa7bd");
  const [themePrimaryColor, setThemePrimaryColor] = useState(initialSettings?.themePrimaryColor || "#4f7cff");
  const [themeSecondaryColor, setThemeSecondaryColor] = useState(initialSettings?.themeSecondaryColor || "#20c7b5");
  const [themePanelColor, setThemePanelColor] = useState(initialSettings?.themePanelColor || "#0d1323");
  const [themeBorderColor, setThemeBorderColor] = useState(initialSettings?.themeBorderColor || "rgba(226, 232, 240, 0.12)");

  const [policyPrivacy, setPolicyPrivacy] = useState(initialSettings?.policyPrivacy || "");
  const [policyTerms, setPolicyTerms] = useState(initialSettings?.policyTerms || "");
  const [policyRefund, setPolicyRefund] = useState(initialSettings?.policyRefund || "");

  const [affiliateEnabled, setAffiliateEnabled] = useState(initialSettings?.affiliateEnabled !== "false");
  const [affiliateTier1Max, setAffiliateTier1Max] = useState(initialSettings?.affiliateTier1Max || "10");
  const [affiliateTier1Rate, setAffiliateTier1Rate] = useState(initialSettings?.affiliateTier1Rate || "20");
  const [affiliateTier2Max, setAffiliateTier2Max] = useState(initialSettings?.affiliateTier2Max || "50");
  const [affiliateTier2Rate, setAffiliateTier2Rate] = useState(initialSettings?.affiliateTier2Rate || "25");
  const [affiliateTier3Rate, setAffiliateTier3Rate] = useState(initialSettings?.affiliateTier3Rate || "30");
  const [affiliateRecurringRate, setAffiliateRecurringRate] = useState(initialSettings?.affiliateRecurringRate || "10");
  const [licenseKey, setLicenseKey] = useState(initialSettings?.licenseKey || "");
  const [generatedLicense, setGeneratedLicense] = useState("");

  // SMTP form states
  const [smtpHost, setSmtpHost] = useState(initialSettings?.smtpHost || "");
  const [smtpPort, setSmtpPort] = useState(initialSettings?.smtpPort || "465");
  const [smtpUser, setSmtpUser] = useState(initialSettings?.smtpUser || "");
  const [smtpPass, setSmtpPass] = useState(initialSettings?.smtpPass || "");
  const [smtpFromName, setSmtpFromName] = useState(initialSettings?.smtpFromName || "");
  const [smtpFromEmail, setSmtpFromEmail] = useState(initialSettings?.smtpFromEmail || "");

  // Email subtab state
  const [emailsSubTab, setEmailsSubTab] = useState<"templates" | "smtp">("templates");

  const [selectedTemplateId, setSelectedTemplateId] = useState<"welcome" | "payment_request" | "activation" | "credits">("welcome");
  const [testEmailAddress, setTestEmailAddress] = useState(user.email);
  const [sendingTest, setSendingTest] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ success: false, message: "", error: "" });

  // Auto collapse sidebar on mobile screen widths
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  }, []);

  const totalUsers = users.length;
  const totalSites = projects.length;
  const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE").length;

  // Form states for adding/editing a Plan
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState(299);
  const [planCredits, setPlanCredits] = useState(100);
  const [planFeatures, setPlanFeatures] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Auto-clear notices
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const handleSaveTheme = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            themeBgColor,
            themeTextColor,
            themeMutedColor,
            themePrimaryColor,
            themeSecondaryColor,
            themePanelColor,
            themeBorderColor
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save theme settings.");
      setMessage("Theme settings saved successfully! Reloading to apply styling...");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update theme settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetTheme = () => {
    setThemeBgColor("#060914");
    setThemeTextColor("#f8fafc");
    setThemeMutedColor("#9aa7bd");
    setThemePrimaryColor("#4f7cff");
    setThemeSecondaryColor("#20c7b5");
    setThemePanelColor("#0d1323");
    setThemeBorderColor("rgba(226, 232, 240, 0.12)");
  };

  // Handle Save UPI ID
  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save UPI settings.");
      setMessage("Global UPI ID updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update UPI settings.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (landingFeatures.trim()) {
      try {
        const parsed = JSON.parse(landingFeatures);
        if (!Array.isArray(parsed)) {
          throw new Error("Features must be a JSON array of objects.");
        }
        for (const item of parsed) {
          if (typeof item !== "object" || !item.title || !item.text) {
            throw new Error("Each feature object must contain at least 'title' and 'text' fields.");
          }
        }
      } catch (err: any) {
        setError(`Invalid Features JSON: ${err.message}`);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            appName,
            appLogo,
            appEmail,
            upiId,
            landingHeroTitle,
            landingHeroSubtitle,
            landingAboutTitle,
            landingAboutText,
            landingContactTitle,
            landingContactText,
            landingContactEmail,
            landingFeatures,
            policyPrivacy,
            policyTerms,
            policyRefund,
            affiliateEnabled: String(affiliateEnabled),
            affiliateTier1Max,
            affiliateTier1Rate,
            affiliateTier2Max,
            affiliateTier2Rate,
            affiliateTier3Rate,
            affiliateRecurringRate,
            licenseKey,
            themeBgColor,
            themeTextColor,
            themeMutedColor,
            themePrimaryColor,
            themeSecondaryColor,
            themePanelColor,
            themeBorderColor
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings.");
      setMessage("Platform Settings saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Plan (Create/Update)
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPlanId,
          name: planName,
          price: planPrice,
          creditsLimit: planCredits,
          features: planFeatures,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save plan.");

      if (editingPlanId) {
        setPlans(prev => prev.map(p => (p.id === editingPlanId ? data.plan : p)));
        setMessage("Plan updated successfully!");
      } else {
        setPlans(prev => [...prev, data.plan]);
        setMessage("New plan created successfully!");
      }

      // Reset form
      setEditingPlanId(null);
      setPlanName("");
      setPlanPrice(299);
      setPlanCredits(100);
      setPlanFeatures("");
    } catch (err: any) {
      setError(err.message || "Failed to save plan.");
    } finally {
      setLoading(false);
    }
  };

  // Start Editing Plan
  const startEditPlan = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setPlanName(plan.name);
    setPlanPrice(plan.price);
    setPlanCredits(plan.creditsLimit);
    setPlanFeatures(plan.features);
  };

  // Delete Plan
  const handleDeletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      const res = await fetch(`/api/admin/plans?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete plan.");
      setPlans(prev => prev.filter(p => p.id !== id));
      setMessage("Plan deleted successfully.");
    } catch (err: any) {
      setError(err.message || "Failed to delete plan.");
    }
  };

  // Process Payment Request (Approve/Reject)
  const handleProcessPayment = async (requestId: string, action: "APPROVE" | "REJECT") => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this payment request?`)) return;
    try {
      const res = await fetch("/api/admin/payments/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action.toLowerCase()} payment.`);

      setRequests(prev =>
        prev.map(r => (r.id === requestId ? { ...r, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : r))
      );
      setMessage(data.message || `Payment successfully ${action === "APPROVE" ? "approved" : "rejected"}.`);
    } catch (err: any) {
      setError(err.message || `Failed to process payment request.`);
    }
  };

  const handleProcessPayout = async (requestId: string, action: "APPROVE" | "REJECT") => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this payout request?`)) return;
    try {
      const res = await fetch("/api/admin/payouts/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action.toLowerCase()} payout.`);

      setPayouts(prev =>
        prev.map(p => (p.id === requestId ? { ...p, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : p))
      );
      setMessage(data.message || `Payout request successfully ${action === "APPROVE" ? "approved" : "rejected"}.`);
    } catch (err: any) {
      setError(err.message || `Failed to process payout request.`);
    }
  };

  const handleProcessRefund = async (requestId: string, action: "APPROVE" | "REJECT") => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this refund request?`)) return;
    try {
      const res = await fetch("/api/admin/refunds/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action.toLowerCase()} refund.`);

      setRefunds(prev =>
        prev.map(r => (r.id === requestId ? { ...r, status: action === "APPROVE" ? "APPROVED" : "REJECTED" } : r))
      );
      setMessage(data.message || `Refund request successfully ${action === "APPROVE" ? "approved" : "rejected"}.`);
    } catch (err: any) {
      setError(err.message || `Failed to process refund request.`);
    }
  };

  const handleResolveFeedback = async (feedbackId: string, action: "RESOLVE" | "DELETE") => {
    if (!confirm(`Are you sure you want to ${action.toLowerCase()} this feedback ticket?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/feedback`, {
        method: action === "DELETE" ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update feedback status.");

      if (action === "DELETE") {
        setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
        setMessage("Feedback ticket deleted successfully.");
      } else {
        setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, status: "RESOLVED" } : f));
        setMessage("Feedback ticket marked as resolved.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update feedback ticket.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "calc(100vh - 70px)", background: "#070b13", overflow: "hidden" }}>
      
      {/* PERSISTENT LEFT SIDEBAR */}
      <div style={{
        width: sidebarCollapsed ? "64px" : "200px",
        minWidth: sidebarCollapsed ? "64px" : "200px",
        background: "rgba(10, 14, 23, 0.95)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "1.5rem 0.5rem 0.5rem 0.5rem",
        transition: "width 0.2s, min-width 0.2s",
        flexShrink: 0
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {/* Dashboard/Overview Item */}
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "dashboard" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "dashboard" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <Home size={16} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          {/* Users Item */}
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "users" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "users" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <Users size={16} />
            {!sidebarCollapsed && <span>Users</span>}
          </button>

          {/* API Keys Item */}
          <button
            type="button"
            onClick={() => setActiveTab("keys")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "keys" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "keys" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <Key size={16} />
            {!sidebarCollapsed && <span>API Keys</span>}
          </button>

          {/* Plans Item */}
          <button
            type="button"
            onClick={() => setActiveTab("plans")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "plans" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "plans" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <Layers size={16} />
            {!sidebarCollapsed && <span>Plans</span>}
          </button>

          {/* Payments Item */}
          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "payments" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "payments" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <DollarSign size={16} />
            {!sidebarCollapsed && <span>Payments</span>}
          </button>

          {/* Payouts Item */}
          <button
            type="button"
            onClick={() => setActiveTab("payouts")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "payouts" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "payouts" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <DollarSign size={16} />
            {!sidebarCollapsed && <span>Payout Requests</span>}
          </button>

          {/* Refunds Item */}
          <button
            type="button"
            onClick={() => setActiveTab("refunds")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "refunds" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "refunds" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <Layers size={16} />
            {!sidebarCollapsed && <span>Refund Requests</span>}
          </button>

          {/* Feedback & Bug Reports Menu */}
          <button
            type="button"
            onClick={() => setActiveTab("feedback")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "feedback" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "feedback" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <MessageSquare size={16} />
            {!sidebarCollapsed && <span>Feedbacks / Bugs</span>}
          </button>

          {/* Email Templates Item */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("emails");
              setEmailStatus({ success: false, message: "", error: "" });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "emails" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "emails" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <Mail size={16} />
            {!sidebarCollapsed && <span>Email Templates</span>}
          </button>

          {/* Platform Branding Settings Item */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("branding");
              setMessage("");
              setError("");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "branding" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "branding" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <Sliders size={16} />
            {!sidebarCollapsed && <span>Platform Settings</span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("licensing")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              background: activeTab === "licensing" ? "rgba(129, 140, 248, 0.08)" : "none",
              border: "none",
              color: activeTab === "licensing" ? "#818cf8" : "#9ca3af",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              textAlign: "left",
              transition: "all 0.2s"
            }}
          >
            <Shield size={16} />
            {!sidebarCollapsed && <span>SaaS Licensing</span>}
          </button>

          <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0.5rem 0" }} />

          {/* Go to App Link */}
          <a
            href="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              width: "100%",
              padding: "0.6rem 0.8rem",
              borderRadius: "0.375rem",
              color: "#9ca3af",
              fontSize: "0.85rem",
              fontWeight: 600,
              textDecoration: "none",
              transition: "all 0.2s"
            }}
          >
            <Sparkles size={16} />
            {!sidebarCollapsed && <span>User Console</span>}
          </a>
        </div>

        {/* Version Indicator */}
        {!sidebarCollapsed && (
          <div style={{ padding: "0.5rem 0.8rem", color: "#4b5563", fontSize: "0.75rem", fontWeight: 600, textAlign: "center", borderTop: "1px solid rgba(255, 255, 255, 0.03)", paddingTop: "0.5rem", marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.1rem" }}>
            <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>{appName} SaaS</span>
            <span style={{ color: "#818cf8" }}>v0.9.0</span>
          </div>
        )}

        {/* Sidebar Collapse Toggle */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            width: "100%",
            padding: "0.6rem 0.8rem",
            borderRadius: "0.375rem",
            background: "none",
            border: "none",
            color: "#6b7280",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: 600,
            transition: "all 0.2s"
          }}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!sidebarCollapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>

      {/* MAIN ADMIN WORKSPACE CONTENT VIEW */}
      <div style={{ flexGrow: 1, padding: "2.5rem", background: "#0a0e17", overflowY: "auto" }}>
        
        {/* Alert Notices */}
        {message && (
          <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
            <Check size={16} /> {message}
          </div>
        )}
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        {/* TAB 1: SYSTEM OVERVIEW DASHBOARD */}
        {activeTab === "dashboard" && (
          <>
            <div className="app-title" style={{ marginBottom: "2.5rem" }}>
              <div>
                <span className="eyebrow">Admin portal</span>
                <h1 style={{ color: "#fff", margin: "0.25rem 0 0.5rem 0", fontSize: "1.75rem", fontWeight: 850 }}>System Overview</h1>
                <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>Manage tenants, websites, subscription credits, and platform-level AI providers.</p>
              </div>
              <div className="metric-row" style={{ marginTop: "1.5rem" }}>
                <div className="stat-tile"><strong>{totalUsers}</strong><span>users</span></div>
                <div className="stat-tile"><strong>{totalSites}</strong><span>websites</span></div>
                <div className="stat-tile"><strong>{totalTenants}</strong><span>tenants</span></div>
                <div className="stat-tile"><strong>{activeSubs}</strong><span>active plans</span></div>
              </div>
            </div>

            <section className="surface-panel">
              <div className="section-heading-row" style={{ marginBottom: "1.2rem" }}>
                <div>
                  <span className="eyebrow">Websites</span>
                  <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>Generated Websites</h2>
                  <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>All generated projects and publishing status.</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Site</th><th>Subdomain</th><th>Owner & Client Logins</th><th>Status</th><th>Workspace</th><th style={{ textAlign: "right" }}>Actions</th></tr>
                  </thead>
                  <tbody>
                    {projects.map((p) => {
                      const subdomainUrl = `${protocol}://${p.subdomain}.${baseDomain}`;
                      const customDomain = p.customDomain;
                      const customDomainHostname = customDomain?.hostname;
                      const customDomainVerified = customDomain?.verified;
                      const hasCustomDomain = !!customDomainHostname;
                      const customDomainUrl = hasCustomDomain ? `${protocol}://${customDomainHostname}` : null;
                      const projectUrl = p.selfHosted
                        ? null
                        : (hasCustomDomain && customDomainVerified ? customDomainUrl : subdomainUrl);

                      return (
                        <tr key={p.id}>
                          <td><strong>{p.name}</strong></td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                              {p.selfHosted ? (
                                <span style={{ color: "#9aa7bd", fontSize: "0.85rem" }}>Self-Hosted / External</span>
                              ) : (
                                <>
                                  <a href={projectUrl || "#"} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8", textDecoration: "none" }}>
                                    {p.subdomain}.{baseDomain}
                                  </a>
                                  {hasCustomDomain && customDomain && (
                                    <span style={{ fontSize: "0.75rem", color: customDomainVerified ? "#34d399" : "#f87171" }}>
                                      Domain: {customDomainHostname} {customDomainVerified ? "(Verified)" : "(Unverified)"}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                              {p.user ? (
                                <div style={{ display: "flex", flexDirection: "column" }}>
                                  <span style={{ fontWeight: 600 }}>{p.user.name || "N/A"}</span>
                                  <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{p.user.email}</span>
                                </div>
                              ) : (
                                <span style={{ color: "#4b5563" }}>N/A</span>
                              )}

                              {/* Configured Client Logins list */}
                              {(() => {
                                const logins = (p.theme as any)?.metadata?.clientLogins || [];
                                if (logins.length > 0) {
                                  return (
                                    <div style={{ marginTop: "0.25rem", padding: "0.35rem 0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.3rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                                      <div style={{ fontSize: "0.65rem", color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.15rem" }}>Client Logins ({logins.length}):</div>
                                      {logins.map((login: any, idx: number) => (
                                        <div key={idx} style={{ fontSize: "0.7rem", color: "#cbd5e1" }}>
                                          <span style={{ color: "#818cf8" }}>{login.email}</span>: {login.password}
                                        </div>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                padding: "0.2rem 0.5rem",
                                borderRadius: "0.25rem",
                                color: p.status === "PUBLISHED" ? "#34d399" : p.status === "FAILED" ? "#f87171" : "#f59e0b",
                                background: p.status === "PUBLISHED" ? "rgba(52,211,153,0.1)" : p.status === "FAILED" ? "rgba(239, 68, 68, 0.1)" : "rgba(245,158,11,0.1)"
                              }}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td>{p.tenant.name}</td>
                          <td style={{ textAlign: "right" }}>
                            <AdminProjectEditor project={p} baseDomain={baseDomain} />
                          </td>
                        </tr>
                      );
                    })}
                    {projects.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>No generated websites on the platform.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* TAB 2: USERS AND SUBSCRIPTION CREDIT QUOTAS */}
        {activeTab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <section className="surface-panel">
              <div className="section-heading-row" style={{ marginBottom: "1.2rem" }}>
                <div>
                  <span className="eyebrow">Users</span>
                  <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>User Management</h2>
                  <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>Workspace ownership and roles across the platform.</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Name</th><th>Email</th><th>Role</th><th>Workspace</th><th style={{ textAlign: "right" }}>Actions</th></tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td><span className="status-pill" style={{ fontSize: "0.75rem", padding: "0.15rem 0.45rem", borderRadius: "0.25rem", fontWeight: 700, background: "rgba(99, 102, 241, 0.15)", color: "#a5b4fc" }}>{u.role}</span></td>
                        <td>{u.tenant.name}</td>
                        <td style={{ textAlign: "right" }}>
                          <UserEditor
                            userId={u.id}
                            initialName={u.name || ""}
                            initialEmail={u.email}
                            initialRole={u.role}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="surface-panel">
              <div className="section-heading-row" style={{ marginBottom: "1.2rem" }}>
                <div>
                  <span className="eyebrow">Plans</span>
                  <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>Subscription Credit Quotas</h2>
                  <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>Adjust tenant credit limits and subscription attributes without leaving the admin panel.</p>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Workspace</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Used</th>
                      <th>Limit</th>
                      <th>AI / LLM</th>
                      <th>Hosting</th>
                      <th>Domain</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s) => (
                      <tr key={s.id}>
                        <td><strong>{s.tenant.name}</strong></td>
                        <td style={{ textTransform: "capitalize" }}>{s.planId.replace("-", " ")}</td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              padding: "0.15rem 0.4rem",
                              borderRadius: "0.25rem",
                              fontWeight: 700,
                              background: s.status === "ACTIVE" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                              color: s.status === "ACTIVE" ? "#34d399" : "#f87171"
                            }}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td>{s.creditsUsed} credits</td>
                        <td><strong>{s.creditsLimit} credits</strong></td>
                        <td>
                          {s.withLlm ? (
                            <span style={{ color: "#34d399", fontWeight: 600 }}>Enabled</span>
                          ) : (
                            <span style={{ color: "#f87171", fontWeight: 600 }}>Disabled</span>
                          )}
                        </td>
                        <td>
                          {s.hostingType === "OURS" && "Our Hosting"}
                          {s.hostingType === "THEIRS" && "Own Hosting"}
                          {s.hostingType === "BOTH" && "Both"}
                        </td>
                        <td>
                          {s.domainType === "SUBDOMAIN" && "Subdomain Only"}
                          {s.domainType === "CUSTOM" && "Custom Domain"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <PlanEditor
                            tenantId={s.tenantId}
                            initialPlanId={s.planId}
                            initialLimit={s.creditsLimit}
                            initialWithLlm={s.withLlm}
                            initialHostingType={s.hostingType}
                            initialDomainType={s.domainType}
                            initialStatus={s.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: GLOBAL LLM API KEYS */}
        {activeTab === "keys" && (
          <LlmKeyManager
            initialKeys={llmKeys}
            canAddGlobal
            title="Admin LLM API keys"
            description="Add multiple global or user-owned keys for OpenAI, Gemini, Claude, custom providers, and more."
          />
        )}

        {/* TAB 4: SUBSCRIPTION PLANS MAKER */}
        {activeTab === "plans" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <section className="surface-panel">
              <div style={{ marginBottom: "1.5rem" }}>
                <span className="eyebrow">Plans Manager</span>
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>
                  {editingPlanId ? "Edit Subscription Plan" : "Create Subscription Plan"}
                </h2>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>Configure system plans matching SaaS hosting quotas and platform capacities.</p>
              </div>
              <form onSubmit={handleSavePlan} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>PLAN NAME</label>
                    <input
                      type="text"
                      className="premium-input"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      placeholder="e.g. Pro Premium"
                      required
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>PRICE (INR / MONTH)</label>
                    <input
                      type="number"
                      className="premium-input"
                      value={planPrice}
                      onChange={(e) => setPlanPrice(Math.max(0, parseInt(e.target.value) || 0))}
                      min="0"
                      required
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>MONTHLY AI CREDITS LIMIT</label>
                  <input
                    type="number"
                    className="premium-input"
                    value={planCredits}
                    onChange={(e) => setPlanCredits(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>FEATURES (COMMA SEPARATED)</label>
                  <textarea
                    className="premium-input"
                    value={planFeatures}
                    onChange={(e) => setPlanFeatures(e.target.value)}
                    placeholder="e.g. 10 Active Sites, Custom Domains, Premium templates"
                    rows={2}
                    style={{ width: "100%", resize: "none" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                  {editingPlanId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlanId(null);
                        setPlanName("");
                        setPlanPrice(299);
                        setPlanCredits(100);
                        setPlanFeatures("");
                      }}
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "0.5rem 1.2rem", borderRadius: "0.5rem", fontSize: "0.8rem", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="primary-action" style={{ background: "linear-gradient(to right, #818cf8, #c084fc)", color: "#fff", border: "none" }}>
                    {editingPlanId ? "Update Plan" : "Create Plan"}
                  </button>
                </div>
              </form>
            </section>

            <section className="surface-panel">
              <div style={{ marginBottom: "1.2rem" }}>
                <span className="eyebrow">Platform Plans</span>
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>Configured Platform Plans</h2>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Plan Name</th>
                      <th>Price (INR)</th>
                      <th>AI Credits</th>
                      <th>Features List</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td>₹{p.price}/mo</td>
                        <td>{p.creditsLimit} credits</td>
                        <td>
                          <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                            {p.features || "No features specified"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                            <button
                              onClick={() => startEditPlan(p)}
                              style={{ border: "none", background: "none", color: "#6366f1", cursor: "pointer", padding: "0.2rem" }}
                              title="Edit Plan"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(p.id)}
                              style={{ border: "none", background: "none", color: "#ef4444", cursor: "pointer", padding: "0.2rem" }}
                              title="Delete Plan"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {plans.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
                          No system plans found. Click create to seed.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 5: UPI GATEWAY SETUP AND PAYMENTS APPROVALS */}
        {activeTab === "payments" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <section className="surface-panel" style={{ height: "fit-content" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <span className="eyebrow">Gateway</span>
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>UPI Payment ID Setup</h2>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>Configure the platform merchant UPI ID. All user upgrades will generate dynamic payment QR codes using this address.</p>
              </div>
              <form onSubmit={handleSaveUpi} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>MERCHANT UPI ID</label>
                  <input
                    type="text"
                    className="premium-input"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.trim())}
                    placeholder="e.g. pogakula@ybl"
                    required
                    style={{ width: "100%" }}
                  />
                </div>
                <button type="submit" className="primary-action" style={{ background: "linear-gradient(to right, #6366f1, #a855f7)", color: "#fff", width: "100%", justifyContent: "center" }} disabled={loading}>
                  Save UPI Settings
                </button>
              </form>
            </section>

            <section className="surface-panel">
              <div style={{ marginBottom: "1.2rem" }}>
                <span className="eyebrow">Verification</span>
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>Incoming Upgrade Payments</h2>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>Review incoming user transaction references (UTR codes). Approve verified funds to automatically upgrade tenant accounts.</p>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Workspace</th>
                      <th>Requested Plan</th>
                      <th>Amount (INR)</th>
                      <th>UTR / Ref Number</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.tenant.name}</strong></td>
                        <td style={{ textTransform: "capitalize" }}>{r.planId}</td>
                        <td>₹{r.amount}</td>
                        <td><code style={{ color: "#a5b4fc", fontSize: "0.85rem" }}>{r.utr}</code></td>
                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              padding: "0.15rem 0.40rem",
                              borderRadius: "0.25rem",
                              fontWeight: 700,
                              background:
                                r.status === "APPROVED"
                                  ? "rgba(16, 185, 129, 0.1)"
                                  : r.status === "REJECTED"
                                  ? "rgba(239, 68, 68, 0.1)"
                                  : "rgba(245, 158, 11, 0.1)",
                              color:
                                r.status === "APPROVED"
                                  ? "#34d399"
                                  : r.status === "REJECTED"
                                  ? "#f87171"
                                  : "#f59e0b",
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {r.status === "PENDING" ? (
                            <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                              <button
                                onClick={() => handleProcessPayment(r.id, "APPROVE")}
                                className="glow-btn"
                                style={{ background: "#10b981", color: "#fff", border: "none", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleProcessPayment(r.id, "REJECT")}
                                style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {requests.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
                          No payment requests submitted.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 6: FEEDBACK & BUG REPORTS MANAGER */}
        {activeTab === "feedback" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <section className="surface-panel">
              <div style={{ marginBottom: "1.5rem" }}>
                <span className="eyebrow">Support Tickets</span>
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>User Feedbacks & Bug Reports</h2>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>Review bugs, features, and suggestions submitted by users from their workspace dashboards.</p>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Submitter</th>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Details / Message</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedbacks.map((f) => (
                      <tr key={f.id}>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <strong>{f.userEmail}</strong>
                            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Workspace ID: {f.tenantId}</span>
                          </div>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 800,
                              padding: "0.15rem 0.4rem",
                              borderRadius: "0.25rem",
                              background: f.type === "BUG" ? "rgba(239, 68, 68, 0.12)" : "rgba(59, 130, 246, 0.12)",
                              color: f.type === "BUG" ? "#f87171" : "#60a5fa",
                              textTransform: "uppercase"
                            }}
                          >
                            {f.type}
                          </span>
                        </td>
                        <td><strong>{f.title}</strong></td>
                        <td style={{ maxWidth: "250px", wordBreak: "break-word" }}>
                          <span style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>{f.message}</span>
                        </td>
                        <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              padding: "0.15rem 0.4rem",
                              borderRadius: "0.25rem",
                              fontWeight: 700,
                              background: f.status === "RESOLVED" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                              color: f.status === "RESOLVED" ? "#34d399" : "#f59e0b"
                            }}
                          >
                            {f.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                            {f.status === "OPEN" && (
                              <button
                                onClick={() => handleResolveFeedback(f.id, "RESOLVE")}
                                className="glow-btn"
                                style={{ background: "#10b981", color: "#fff", border: "none", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                                disabled={loading}
                              >
                                Resolve
                              </button>
                            )}
                            <button
                              onClick={() => handleResolveFeedback(f.id, "DELETE")}
                              style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", padding: "0.25rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                              disabled={loading}
                              title="Delete Ticket"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {feedbacks.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>
                          No feedbacks or bug reports submitted yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 7: EMAIL TEMPLATES PREVIEW & TESTING */}
        {activeTab === "emails" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className="app-title" style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", width: "100%" }}>
                <div>
                  <span className="eyebrow">Communications</span>
                  <h1 style={{ color: "#fff", margin: "0.25rem 0 0.5rem 0", fontSize: "1.75rem", fontWeight: 850 }}>
                    {emailsSubTab === "templates" ? "Email Templates" : "SMTP Configurations"}
                  </h1>
                  <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>
                    {emailsSubTab === "templates"
                      ? `Preview transactional system emails sent from ${appEmail} and dispatch test sends.`
                      : "Configure your custom SMTP host server details to authorize automatic transactional emails."}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", background: "rgba(255,255,255,0.03)", padding: "0.25rem", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <button
                    type="button"
                    onClick={() => setEmailsSubTab("templates")}
                    style={{
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.75rem",
                      borderRadius: "0.25rem",
                      background: emailsSubTab === "templates" ? "linear-gradient(to right, #6366f1, #a855f7)" : "transparent",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s"
                    }}
                  >
                    Templates
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailsSubTab("smtp")}
                    style={{
                      padding: "0.4rem 0.8rem",
                      fontSize: "0.75rem",
                      borderRadius: "0.25rem",
                      background: emailsSubTab === "smtp" ? "linear-gradient(to right, #6366f1, #a855f7)" : "transparent",
                      color: "#fff",
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s"
                    }}
                  >
                    SMTP Settings
                  </button>
                </div>
              </div>
            </div>

            {message && <div className="form-alert" style={{ background: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.2)", color: "#34d399" }}>{message}</div>}
            {error && <div className="form-alert">{error}</div>}

            {emailsSubTab === "templates" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem", minHeight: "600px" }}>
                {/* Left sidebar: list templates */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {Object.entries(emailTemplates).map(([id, t]) => (
                    <button
                      key={id}
                      onClick={() => {
                        setSelectedTemplateId(id as any);
                        setEmailStatus({ success: false, message: "", error: "" });
                      }}
                      style={{
                        padding: "1.25rem",
                        borderRadius: "0.75rem",
                        background: selectedTemplateId === id ? "rgba(129, 140, 248, 0.08)" : "#111827",
                        border: `1px solid ${selectedTemplateId === id ? "#6366f1" : "rgba(255,255,255,0.06)"}`,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ color: "#fff", fontWeight: 700, marginBottom: "0.4rem", fontSize: "0.95rem" }}>{t.title}</div>
                      <div style={{ color: "#9ca3af", fontSize: "0.8rem", lineHeight: "1.4" }}>{t.description}</div>
                    </button>
                  ))}
                </div>

                {/* Right column: live iframe preview & test panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <section className="surface-panel" style={{ padding: "1.5rem" }}>
                    <h3 style={{ margin: "0 0 1rem 0", color: "#fff", fontSize: "1.1rem" }}>Send a Test Email</h3>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!testEmailAddress) return;
                        setSendingTest(true);
                        setEmailStatus({ success: false, message: "", error: "" });
                        try {
                          const res = await fetch("/api/admin/emails/test", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ templateId: selectedTemplateId, testEmail: testEmailAddress }),
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Failed to dispatch email.");
                          setEmailStatus({ success: true, message: data.message, error: "" });
                        } catch (err: any) {
                          setEmailStatus({ success: false, message: "", error: err.message });
                        } finally {
                          setSendingTest(false);
                        }
                      }}
                      style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
                    >
                      <input
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        placeholder="recipient@example.com"
                        required
                        style={{
                          flexGrow: 1,
                          background: "#1f2937",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "0.375rem",
                          padding: "0.6rem 0.8rem",
                          color: "#fff",
                          fontSize: "0.85rem"
                        }}
                      />
                      <button
                        type="submit"
                        disabled={sendingTest}
                        style={{
                          background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                          color: "#fff",
                          border: "none",
                          borderRadius: "0.375rem",
                          padding: "0.6rem 1.25rem",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                          cursor: "pointer",
                          opacity: sendingTest ? 0.6 : 1
                        }}
                      >
                        {sendingTest ? "Sending..." : "Send Test"}
                      </button>
                    </form>
                    {emailStatus.message && (
                      <div style={{ color: "#34d399", fontSize: "0.8rem", marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Check size={14} /> {emailStatus.message}
                      </div>
                    )}
                    {emailStatus.error && (
                      <div style={{ color: "#f87171", fontSize: "0.8rem", marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <X size={14} /> {emailStatus.error}
                      </div>
                    )}
                  </section>

                  <div style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "0.75rem", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "0.75rem 1.25rem", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "#9ca3af", fontSize: "0.75rem" }}>
                        Subject: <strong style={{ color: "#fff" }}>{(emailTemplates as any)[selectedTemplateId].subject(appName)}</strong>
                      </div>
                      <span style={{ fontSize: "0.7rem", color: "#6b7280", background: "rgba(255,255,255,0.04)", padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>HTML PREVIEW</span>
                    </div>
                    <iframe
                      srcDoc={(emailTemplates as any)[selectedTemplateId].getHtml(appName, appEmail, `${protocol}://${baseDomain}`)}
                      title="Email Template Preview"
                      style={{ border: "none", width: "100%", height: "550px", background: "#0a0e17" }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
                <section className="surface-panel" style={{ maxWidth: "650px" }}>
                  <div style={{ marginBottom: "1.5rem" }}>
                    <span className="eyebrow">SMTP Config</span>
                    <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>SMTP Server Settings</h2>
                    <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>Configure your mail client server authentication to send transaction notifications dynamically.</p>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setLoading(true);
                      setMessage("");
                      setError("");
                      try {
                        const res = await fetch("/api/admin/settings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            settings: {
                              smtpHost,
                              smtpPort,
                              smtpUser,
                              smtpPass,
                              smtpFromName,
                              smtpFromEmail
                            }
                          })
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Failed to save SMTP settings.");
                        setMessage("SMTP Configurations saved successfully!");
                      } catch (err: any) {
                        setError(err.message || "Failed to save settings.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
                  >
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>SMTP HOST</label>
                        <input
                          type="text"
                          className="premium-input"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          placeholder="smtp.hostinger.com"
                          required
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>SMTP PORT</label>
                        <input
                          type="text"
                          className="premium-input"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(e.target.value)}
                          placeholder="e.g. 465 or 587"
                          required
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>SMTP USERNAME / EMAIL</label>
                        <input
                          type="email"
                          className="premium-input"
                          value={smtpUser}
                          onChange={(e) => setSmtpUser(e.target.value)}
                          placeholder="e.g. support@yourdomain.com"
                          required
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>SMTP PASSWORD</label>
                        <input
                          type="password"
                          className="premium-input"
                          value={smtpPass}
                          onChange={(e) => setSmtpPass(e.target.value)}
                          placeholder="••••••••••••"
                          required
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>SENDER DISPLAY NAME</label>
                        <input
                          type="text"
                          className="premium-input"
                          value={smtpFromName}
                          onChange={(e) => setSmtpFromName(e.target.value)}
                          placeholder={`e.g. ${appName} Support`}
                          required
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>SENDER EMAIL ADDRESS</label>
                        <input
                          type="email"
                          className="premium-input"
                          value={smtpFromEmail}
                          onChange={(e) => setSmtpFromEmail(e.target.value)}
                          placeholder="e.g. support@yourdomain.com"
                          required
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                      <button
                        type="submit"
                        className="primary-action"
                        style={{ padding: "0 2rem", fontWeight: 700, height: "40px" }}
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Config"}
                      </button>
                    </div>
                  </form>
                </section>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: PAYOUT REQUESTS REVIEW PANEL */}
        {activeTab === "payouts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className="app-title" style={{ marginBottom: "1rem" }}>
              <div>
                <span className="eyebrow">Affiliates</span>
                <h1 style={{ color: "#fff", margin: "0.25rem 0 0.5rem 0", fontSize: "1.75rem", fontWeight: 850 }}>Payout Requests</h1>
                <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>Review and approve affiliate withdrawal requests to UPI ID addresses.</p>
              </div>
            </div>

            <section className="surface-panel">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Requested At</th>
                      <th>Referrer Email</th>
                      <th>UPI Address</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((payout) => (
                      <tr key={payout.id}>
                        <td>{new Date(payout.createdAt).toLocaleString()}</td>
                        <td>
                          <strong>{payout.user?.name || "N/A"}</strong>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af" }}>{payout.user?.email}</span>
                        </td>
                        <td style={{ fontFamily: "monospace", color: "#818cf8" }}>{payout.upiId}</td>
                        <td style={{ fontWeight: 700, color: "#fff" }}>₹{payout.amount.toLocaleString()}</td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.25rem",
                              color: payout.status === "APPROVED" ? "#34d399" : payout.status === "REJECTED" ? "#f87171" : "#f59e0b",
                              background: payout.status === "APPROVED" ? "rgba(52,211,153,0.1)" : payout.status === "REJECTED" ? "rgba(239, 68, 68, 0.1)" : "rgba(245,158,11,0.1)"
                            }}
                          >
                            {payout.status}
                          </span>
                        </td>
                        <td>
                          {payout.status === "PENDING" ? (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                onClick={() => handleProcessPayout(payout.id, "APPROVE")}
                                style={{ background: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.2)", color: "#34d399", padding: "0.3rem 0.6rem", borderRadius: "0.25rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700 }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleProcessPayout(payout.id, "REJECT")}
                                style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "0.3rem 0.6rem", borderRadius: "0.25rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700 }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "#4b5563" }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {payouts.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>No payout requests found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 9: REFUND REQUESTS REVIEW PANEL */}
        {activeTab === "refunds" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div className="app-title" style={{ marginBottom: "1rem" }}>
              <div>
                <span className="eyebrow">Subscriptions</span>
                <h1 style={{ color: "#fff", margin: "0.25rem 0 0.5rem 0", fontSize: "1.75rem", fontWeight: 850 }}>Refund Requests</h1>
                <p style={{ color: "#9ca3af", fontSize: "0.9rem", margin: 0 }}>Review credits-deducted subscription cancellation and refund requests.</p>
              </div>
            </div>

            <section className="surface-panel">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Requested At</th>
                      <th>Workspace / Owner</th>
                      <th>Paid Amount</th>
                      <th>Credits Used</th>
                      <th>Refund Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refunds.map((ref) => (
                      <tr key={ref.id}>
                        <td>{new Date(ref.createdAt).toLocaleString()}</td>
                        <td>
                          <strong>{ref.tenant?.name || "N/A"}</strong>
                          <span style={{ display: "block", fontSize: "0.75rem", color: "#9ca3af" }}>Slug: {ref.tenant?.slug}</span>
                        </td>
                        <td>₹{ref.amountPaid.toLocaleString()}</td>
                        <td>{ref.creditsUsed} credits</td>
                        <td style={{ fontWeight: 700, color: "#fff" }}>₹{ref.refundAmount.toLocaleString()}</td>
                        <td>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "0.2rem 0.5rem",
                              borderRadius: "0.25rem",
                              color: ref.status === "APPROVED" ? "#34d399" : ref.status === "REJECTED" ? "#f87171" : "#f59e0b",
                              background: ref.status === "APPROVED" ? "rgba(52,211,153,0.1)" : ref.status === "REJECTED" ? "rgba(239, 68, 68, 0.1)" : "rgba(245,158,11,0.1)"
                            }}
                          >
                            {ref.status}
                          </span>
                        </td>
                        <td>
                          {ref.status === "PENDING" ? (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button
                                onClick={() => handleProcessRefund(ref.id, "APPROVE")}
                                style={{ background: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.2)", color: "#34d399", padding: "0.3rem 0.6rem", borderRadius: "0.25rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700 }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleProcessRefund(ref.id, "REJECT")}
                                style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", padding: "0.3rem 0.6rem", borderRadius: "0.25rem", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700 }}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "#4b5563" }}>Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {refunds.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>No refund requests found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* TAB 10: PLATFORM BRANDING AND POLICY SETTINGS */}
        {activeTab === "branding" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <section className="surface-panel" style={{ height: "fit-content" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <span className="eyebrow">White-Label</span>
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>Platform Branding Settings</h2>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>
                  Customize platform name, logo, and support emails. Changes propagate globally across headers, footers, auth panels, and automated emails.
                </p>
              </div>
              
              <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>APPLICATION NAME</label>
                    <input
                      type="text"
                      className="premium-input"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="e.g. Platform Name"
                      required
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>SUPPORT / SENDER EMAIL</label>
                    <input
                      type="email"
                      className="premium-input"
                      value={appEmail}
                      onChange={(e) => setAppEmail(e.target.value)}
                      placeholder="e.g. support@yourdomain.com"
                      required
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>PLATFORM LOGO (IMAGE URL OR BASE64 DATA URI)</label>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <input
                      type="text"
                      className="premium-input"
                      value={appLogo}
                      onChange={(e) => setAppLogo(e.target.value)}
                      placeholder="e.g. https://yoursite.com/logo.png or choose a local file"
                      style={{ flex: 1 }}
                    />
                    <div style={{ position: "relative" }}>
                      <button type="button" className="secondary-action" style={{ cursor: "pointer", height: "42px", margin: 0 }}>
                        Upload File
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setAppLogo(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          opacity: 0,
                          cursor: "pointer"
                        }}
                      />
                    </div>
                  </div>
                  <p style={{ color: "#6b7280", fontSize: "0.75rem", margin: "0.2rem 0 0 0" }}>
                    Recommended: Transparent PNG or SVG logo. Uploading a file will automatically convert it to a database-friendly Base64 Data URL.
                  </p>
                  {appLogo && (
                    <div style={{ marginTop: "0.5rem", padding: "0.5rem", background: "rgba(255,255,255,0.02)", borderRadius: "0.375rem", border: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "1rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Logo Preview:</span>
                      <img src={appLogo} alt="Logo preview" style={{ height: "32px", maxWidth: "120px", objectFit: "contain" }} />
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
                  <span className="eyebrow">Theme Customization</span>
                  <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.1rem", fontWeight: 700 }}>Platform Theme Colors</h3>
                  <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0 0 1.5rem 0" }}>
                    Configure the color palette of the entire SaaS platform (landing pages, authentication, dashboard, etc.). Each deployment can have a unique design aesthetic.
                  </p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, minHeight: "2.2rem", display: "flex", alignItems: "flex-end", marginBottom: "0.25rem" }}>BACKGROUND COLOR</label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="color"
                          value={themeBgColor}
                          onChange={(e) => setThemeBgColor(e.target.value)}
                          style={{ width: "42px", height: "42px", border: "1px solid rgba(226,232,240,0.16)", borderRadius: "0.5rem", cursor: "pointer", background: "none", padding: 0 }}
                        />
                        <input
                          type="text"
                          className="premium-input"
                          value={themeBgColor}
                          onChange={(e) => setThemeBgColor(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, minHeight: "2.2rem", display: "flex", alignItems: "flex-end", marginBottom: "0.25rem" }}>PRIMARY TEXT COLOR</label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="color"
                          value={themeTextColor}
                          onChange={(e) => setThemeTextColor(e.target.value)}
                          style={{ width: "42px", height: "42px", border: "1px solid rgba(226,232,240,0.16)", borderRadius: "0.5rem", cursor: "pointer", background: "none", padding: 0 }}
                        />
                        <input
                          type="text"
                          className="premium-input"
                          value={themeTextColor}
                          onChange={(e) => setThemeTextColor(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, minHeight: "2.2rem", display: "flex", alignItems: "flex-end", marginBottom: "0.25rem" }}>MUTED TEXT COLOR</label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="color"
                          value={themeMutedColor}
                          onChange={(e) => setThemeMutedColor(e.target.value)}
                          style={{ width: "42px", height: "42px", border: "1px solid rgba(226,232,240,0.16)", borderRadius: "0.5rem", cursor: "pointer", background: "none", padding: 0 }}
                        />
                        <input
                          type="text"
                          className="premium-input"
                          value={themeMutedColor}
                          onChange={(e) => setThemeMutedColor(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, minHeight: "2.2rem", display: "flex", alignItems: "flex-end", marginBottom: "0.25rem" }}>PRIMARY ACCENT / GRADIENT 1 (BLUE)</label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="color"
                          value={themePrimaryColor}
                          onChange={(e) => setThemePrimaryColor(e.target.value)}
                          style={{ width: "42px", height: "42px", border: "1px solid rgba(226,232,240,0.16)", borderRadius: "0.5rem", cursor: "pointer", background: "none", padding: 0 }}
                        />
                        <input
                          type="text"
                          className="premium-input"
                          value={themePrimaryColor}
                          onChange={(e) => setThemePrimaryColor(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, minHeight: "2.2rem", display: "flex", alignItems: "flex-end", marginBottom: "0.25rem" }}>SECONDARY ACCENT / GRADIENT 2 (TEAL)</label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="color"
                          value={themeSecondaryColor}
                          onChange={(e) => setThemeSecondaryColor(e.target.value)}
                          style={{ width: "42px", height: "42px", border: "1px solid rgba(226,232,240,0.16)", borderRadius: "0.5rem", cursor: "pointer", background: "none", padding: 0 }}
                        />
                        <input
                          type="text"
                          className="premium-input"
                          value={themeSecondaryColor}
                          onChange={(e) => setThemeSecondaryColor(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, minHeight: "2.2rem", display: "flex", alignItems: "flex-end", marginBottom: "0.25rem" }}>PANEL BACKGROUND</label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="color"
                          value={themePanelColor}
                          onChange={(e) => setThemePanelColor(e.target.value)}
                          style={{ width: "42px", height: "42px", border: "1px solid rgba(226,232,240,0.16)", borderRadius: "0.5rem", cursor: "pointer", background: "none", padding: 0 }}
                        />
                        <input
                          type="text"
                          className="premium-input"
                          value={themePanelColor}
                          onChange={(e) => setThemePanelColor(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700, minHeight: "2.2rem", display: "flex", alignItems: "flex-end", marginBottom: "0.25rem" }}>BORDER / GRID LINE COLOR</label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          type="color"
                          value={themeBorderColor}
                          onChange={(e) => setThemeBorderColor(e.target.value)}
                          style={{ width: "42px", height: "42px", border: "1px solid rgba(226,232,240,0.16)", borderRadius: "0.5rem", cursor: "pointer", background: "none", padding: 0 }}
                        />
                        <input
                          type="text"
                          className="premium-input"
                          value={themeBorderColor}
                          onChange={(e) => setThemeBorderColor(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => handleSaveTheme()}
                      className="primary-action"
                      disabled={loading}
                      style={{ minHeight: "2.4rem", padding: "0 1.25rem", fontSize: "0.85rem" }}
                    >
                      {loading ? "Saving Theme..." : "Save Theme Colors"}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetTheme}
                      className="secondary-action"
                      disabled={loading}
                      style={{ minHeight: "2.4rem", padding: "0 1.25rem", fontSize: "0.85rem" }}
                    >
                      Reset to Defaults
                    </button>
                  </div>

                  <div style={{ marginTop: "1.5rem", borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}>
                    <label style={{ fontSize: "0.72rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "0.75rem", letterSpacing: "0.5px" }}>Quick Preset Themes</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "0.75rem" }}>
                      {THEME_PRESETS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setThemeBgColor(preset.colors.themeBgColor);
                            setThemeTextColor(preset.colors.themeTextColor);
                            setThemeMutedColor(preset.colors.themeMutedColor);
                            setThemePrimaryColor(preset.colors.themePrimaryColor);
                            setThemeSecondaryColor(preset.colors.themeSecondaryColor);
                            setThemePanelColor(preset.colors.themePanelColor);
                            setThemeBorderColor(preset.colors.themeBorderColor);
                          }}
                          className="secondary-action"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                            padding: "0.65rem 0.8rem",
                            gap: "0.5rem",
                            borderRadius: "0.5rem",
                            background: "rgba(255, 255, 255, 0.02)",
                            borderColor: "rgba(255, 255, 255, 0.05)",
                            textAlign: "left",
                            height: "auto",
                            width: "100%",
                            cursor: "pointer",
                            margin: 0
                          }}
                        >
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>{preset.name}</span>
                          <div style={{ display: "flex", gap: "0.25rem" }}>
                            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: preset.colors.themeBgColor, border: "1px solid rgba(255,255,255,0.2)" }} title="BG" />
                            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: preset.colors.themePrimaryColor, border: "1px solid rgba(255,255,255,0.2)" }} title="Primary" />
                            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: preset.colors.themeSecondaryColor, border: "1px solid rgba(255,255,255,0.2)" }} title="Secondary" />
                            <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: preset.colors.themePanelColor, border: "1px solid rgba(255,255,255,0.2)" }} title="Panel" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
                  <span className="eyebrow">Homepage Sections</span>
                  <h3 style={{ margin: "0 0 1rem 0", color: "#fff", fontSize: "1.1rem", fontWeight: 700 }}>Landing Page Copy</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>HERO TITLE</label>
                        <input
                          type="text"
                          className="premium-input"
                          value={landingHeroTitle}
                          onChange={(e) => setLandingHeroTitle(e.target.value)}
                          placeholder="Build polished websites with AI in one flow."
                          required
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>HERO SUBTITLE / PARAGRAPH</label>
                        <textarea
                          className="premium-input"
                          value={landingHeroSubtitle}
                          onChange={(e) => setLandingHeroSubtitle(e.target.value)}
                          placeholder="Describe the business once and..."
                          style={{ minHeight: "80px", resize: "vertical", width: "100%" }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>ABOUT US TITLE</label>
                        <input
                          type="text"
                          className="premium-input"
                          value={landingAboutTitle}
                          onChange={(e) => setLandingAboutTitle(e.target.value)}
                          placeholder="Platform is built for fast..."
                          required
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>CONTACT US TITLE</label>
                        <input
                          type="text"
                          className="premium-input"
                          value={landingContactTitle}
                          onChange={(e) => setLandingContactTitle(e.target.value)}
                          placeholder="Need a custom workflow?"
                          required
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>ABOUT US TEXT</label>
                        <textarea
                          className="premium-input"
                          value={landingAboutText}
                          onChange={(e) => setLandingAboutText(e.target.value)}
                          style={{ minHeight: "80px", resize: "vertical", width: "100%" }}
                          required
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>CONTACT US TEXT</label>
                        <textarea
                          className="premium-input"
                          value={landingContactText}
                          onChange={(e) => setLandingContactText(e.target.value)}
                          style={{ minHeight: "80px", resize: "vertical", width: "100%" }}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>CONTACT EMAIL ADDRESS</label>
                        <input
                          type="email"
                          className="premium-input"
                          value={landingContactEmail}
                          onChange={(e) => setLandingContactEmail(e.target.value)}
                          placeholder="e.g. support@yourdomain.com"
                          required
                          style={{ width: "100%" }}
                        />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>GATEWAY MERCHANT UPI ID</label>
                        <input
                          type="text"
                          className="premium-input"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value.trim())}
                          placeholder="e.g. pogakula@ybl"
                          required
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>FEATURES LIST (JSON FORMAT)</label>
                      <textarea
                        className="premium-input"
                        value={landingFeatures}
                        onChange={(e) => setLandingFeatures(e.target.value)}
                        placeholder="[ { 'icon': 'Sparkles', 'title': '...', 'text': '...' } ]"
                        style={{ minHeight: "150px", fontFamily: "monospace", fontSize: "0.8rem", resize: "vertical", width: "100%" }}
                      />
                      <p style={{ color: "#6b7280", fontSize: "0.75rem", margin: "0.2rem 0 0 0" }}>
                        Must be a valid JSON array of feature cards. Allowed icon string keys include: Sparkles, Layers3, Globe2, ShieldCheck, ShoppingCart, DollarSign, Code, MessageSquare, etc.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem" }}>
                  <span className="eyebrow">Legal Pages</span>
                  <h3 style={{ margin: "0 0 1rem 0", color: "#fff", fontSize: "1.1rem", fontWeight: 700 }}>User Policies Content</h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>PRIVACY POLICY</label>
                      <textarea
                        className="premium-input"
                        value={policyPrivacy}
                        onChange={(e) => setPolicyPrivacy(e.target.value)}
                        placeholder="Leave blank to use system defaults..."
                        style={{ minHeight: "150px", resize: "vertical", width: "100%" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>TERMS & CONDITIONS</label>
                      <textarea
                        className="premium-input"
                        value={policyTerms}
                        onChange={(e) => setPolicyTerms(e.target.value)}
                        placeholder="Leave blank to use system defaults..."
                        style={{ minHeight: "150px", resize: "vertical", width: "100%" }}
                      />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>REFUND POLICY</label>
                      <textarea
                        className="premium-input"
                        value={policyRefund}
                        onChange={(e) => setPolicyRefund(e.target.value)}
                        placeholder="Leave blank to use system defaults..."
                        style={{ minHeight: "150px", resize: "vertical", width: "100%" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Affiliate Partner Program Settings */}
                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "1.5rem", marginTop: "0.5rem" }}>
                  <h3 style={{ margin: "0 0 0.5rem 0", color: "#fff", fontSize: "1.05rem", fontWeight: 700 }}>Affiliate Partner Program Settings</h3>
                  <p style={{ color: "#9ca3af", fontSize: "0.8rem", margin: "0 0 1rem 0" }}>
                    Configure the global partner rewards, tiers, and referral commission rules.
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(255,255,255,0.02)", padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "1.25rem" }}>
                    <input
                      type="checkbox"
                      id="affiliateEnabled"
                      checked={affiliateEnabled}
                      onChange={(e) => setAffiliateEnabled(e.target.checked)}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <label htmlFor="affiliateEnabled" style={{ fontSize: "0.85rem", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                      Enable Affiliate Partner Program & Referrals
                    </label>
                  </div>

                  {affiliateEnabled && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>TIER 1 MAX REFERRALS</label>
                          <input
                            type="number"
                            min="1"
                            className="premium-input"
                            value={affiliateTier1Max}
                            onChange={(e) => setAffiliateTier1Max(e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>TIER 1 RATE (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="premium-input"
                            value={affiliateTier1Rate}
                            onChange={(e) => setAffiliateTier1Rate(e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>RECURRING RATE (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="premium-input"
                            value={affiliateRecurringRate}
                            onChange={(e) => setAffiliateRecurringRate(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>TIER 2 MAX REFERRALS</label>
                          <input
                            type="number"
                            min={parseInt(affiliateTier1Max, 10) + 1}
                            className="premium-input"
                            value={affiliateTier2Max}
                            onChange={(e) => setAffiliateTier2Max(e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>TIER 2 RATE (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="premium-input"
                            value={affiliateTier2Rate}
                            onChange={(e) => setAffiliateTier2Rate(e.target.value)}
                            required
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                          <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>TIER 3 RATE (51+ REF) (%)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="premium-input"
                            value={affiliateTier3Rate}
                            onChange={(e) => setAffiliateTier3Rate(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {message && <div className="form-alert" style={{ background: "rgba(52, 211, 153, 0.1)", border: "1px solid rgba(52, 211, 153, 0.2)", color: "#34d399" }}>{message}</div>}
                {error && <div className="form-alert" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171" }}>{error}</div>}

                <button
                  type="submit"
                  className="primary-action"
                  style={{
                    background: "linear-gradient(to right, #6366f1, #a855f7)",
                    color: "#fff",
                    width: "100%",
                    justifyContent: "center",
                    fontWeight: 700,
                    height: "44px"
                  }}
                  disabled={loading}
                >
                  {loading ? "Saving Platform Settings..." : "Save Platform Settings"}
                </button>
              </form>
            </section>
          </div>
        )}

        {/* TAB 11: SAAS LICENSING MANAGEMENT */}
        {activeTab === "licensing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <section className="surface-panel" style={{ height: "fit-content" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <span className="eyebrow">Envato / CodeCanyon</span>
                <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>SaaS License Key</h2>
                <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>
                  Your CodeCanyon license verification status and license activation parameters. Keep this code secure as it registers your installation.
                </p>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "0.5rem", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Activation Status</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                      <span style={{ width: "0.6rem", height: "0.6rem", borderRadius: "50%", background: "#34d399" }} />
                      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#34d399" }}>Activated & Genuine</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>Product Version</span>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc", marginTop: "0.25rem" }}>v0.9.0</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 700 }}>ACTIVE PURCHASE CODE / LICENSE KEY</label>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <input
                      type="text"
                      className="premium-input"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value)}
                      placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      style={{ flexGrow: 1 }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        setLoading(true);
                        setMessage("");
                        setError("");
                        try {
                          const res = await fetch("/api/admin/settings", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              settings: { licenseKey }
                            })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || "Failed to update license key.");
                          setMessage("License Key saved successfully!");
                        } catch (err: any) {
                          setError(err.message || "Failed to save license key.");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="primary-action"
                      style={{ padding: "0 1.5rem", flexShrink: 0, fontWeight: 700, height: "40px" }}
                      disabled={loading}
                    >
                      Update
                    </button>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    Purchase code format is validated locally. Supported formats: CodeCanyon Purchase UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx) or direct proprietary activation keys.
                  </span>
                </div>
              </div>
            </section>

            {enableLicenseGenerator && (
              <section className="surface-panel" style={{ height: "fit-content" }}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <span className="eyebrow">Generator Tool</span>
                  <h2 style={{ margin: 0, color: "#fff", fontSize: "1.25rem", fontWeight: 800 }}>License Key Generator</h2>
                  <p style={{ color: "#9ca3af", fontSize: "0.85rem", margin: "0.2rem 0 0 0" }}>
                    Use this tool to generate direct proprietary license keys for external sales or manual customer support.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      setError("");
                      setMessage("");
                      try {
                        const res = await fetch("/api/admin/licensing", {
                          method: "POST"
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Failed to generate key on the database.");
                        setGeneratedLicense(data.licenseKey);
                        setMessage("License key generated and saved successfully!");
                      } catch (err: any) {
                        setError(err.message || "Failed to generate key.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="primary-action"
                    style={{ width: "fit-content", background: "rgba(129, 140, 248, 0.15)", border: "1px solid rgba(129, 140, 248, 0.3)", color: "#818cf8" }}
                    disabled={loading}
                  >
                    {loading ? "Generating..." : "Generate Key"}
                  </button>

                  {generatedLicense && (
                    <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 700 }}>GENERATED LICENSE KEY</label>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <code style={{ background: "rgba(52, 211, 153, 0.08)", border: "1px solid rgba(52, 211, 153, 0.2)", color: "#34d399", padding: "0.5rem 1rem", borderRadius: "0.25rem", fontSize: "1rem", letterSpacing: "0.05em", fontFamily: "monospace", flexGrow: 1, textAlign: "center" }}>
                          {generatedLicense}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedLicense);
                            setMessage("Generated license key copied to clipboard!");
                            setTimeout(() => setMessage(""), 3000);
                          }}
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", padding: "0.5rem 1rem", borderRadius: "0.25rem", color: "#cbd5e1", cursor: "pointer", fontSize: "0.85rem" }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

