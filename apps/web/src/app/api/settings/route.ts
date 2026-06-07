import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSystemSettings();
    
    // Return only necessary public-facing settings (hiding sensitive options if any are added in the future)
    return NextResponse.json({
      success: true,
      settings: {
        appName: settings.appName,
        appLogo: settings.appLogo,
        appEmail: settings.appEmail,
        landingHeroTitle: settings.landingHeroTitle,
        landingHeroSubtitle: settings.landingHeroSubtitle,
        landingAboutTitle: settings.landingAboutTitle,
        landingAboutText: settings.landingAboutText,
        landingContactTitle: settings.landingContactTitle,
        landingContactText: settings.landingContactText,
        landingContactEmail: settings.landingContactEmail,
        landingFeatures: settings.landingFeatures,
        policyPrivacy: settings.policyPrivacy,
        policyTerms: settings.policyTerms,
        policyRefund: settings.policyRefund,
      },
    });
  } catch (error: any) {
    console.error("GET Public Settings Exception:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
