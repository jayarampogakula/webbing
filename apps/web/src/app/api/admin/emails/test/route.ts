import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { 
  sendWelcomeEmail, 
  sendPaymentRequestEmail, 
  sendPlanActivationEmail, 
  sendCreditsPurchaseEmail 
} from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const sessionToken = cookieStore.get("webbing-session")?.value;
    const user = sessionToken ? verifySession(sessionToken) : null;

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 401 });
    }

    const { templateId, testEmail } = await req.json();

    if (!templateId || !testEmail) {
      return NextResponse.json({ error: "Template ID and test email address are required." }, { status: 400 });
    }

    let success = false;

    if (templateId === "welcome") {
      success = await sendWelcomeEmail(testEmail, "John Doe (Test)");
    } else if (templateId === "payment_request") {
      success = await sendPaymentRequestEmail(testEmail, "John Doe (Test)", "pro-plan", 599, "UTR-TEST-123456");
    } else if (templateId === "activation") {
      success = await sendPlanActivationEmail(testEmail, "John Doe (Test)", "Pro Plan");
    } else if (templateId === "credits") {
      success = await sendCreditsPurchaseEmail(testEmail, "John Doe (Test)", 50, 399);
    } else {
      return NextResponse.json({ error: "Invalid Template ID." }, { status: 400 });
    }

    if (!success) {
      return NextResponse.json({ error: "Failed to send email. Check your SMTP configuration in .env." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Test email dispatched successfully! 🎉" });
  } catch (error: any) {
    console.error("Test email API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
