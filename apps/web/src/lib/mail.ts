import nodemailer from "nodemailer";
import { prisma } from "@webbing/db";

// Helper to retrieve all SMTP and email branding settings dynamically from the database
async function getSmtpSettings() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ["smtpHost", "smtpPort", "smtpUser", "smtpPass", "smtpFromName", "smtpFromEmail", "appName", "appEmail"] }
      }
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    
    // Resolve dynamic SMTP parameters
    const host = map.smtpHost || process.env.SMTP_HOST || "smtp.hostinger.com";
    const port = parseInt(map.smtpPort || process.env.SMTP_PORT || "465", 10);
    const secure = port === 465; // Use SSL for 465
    const user = map.smtpUser || process.env.SMTP_USER || "support@webbing.in";
    const pass = map.smtpPass || process.env.SMTP_PASS || "";
    
    // Resolve branding parameters
    const appName = map.appName || "Webbing";
    const appEmail = map.appEmail || user;
    
    // Resolve from address: if smtpFromName & smtpFromEmail are configured, construct format
    let defaultFrom = process.env.SMTP_FROM || `"${appName} Support" <${appEmail}>`;
    if (map.smtpFromName && map.smtpFromEmail) {
      defaultFrom = `"${map.smtpFromName}" <${map.smtpFromEmail}>`;
    } else if (map.smtpFromEmail) {
      defaultFrom = map.smtpFromEmail;
    }
    
    return { host, port, secure, user, pass, defaultFrom, appName, appEmail };
  } catch (err) {
    console.error("Error loading dynamic SMTP settings, falling back to environment config:", err);
    const host = process.env.SMTP_HOST || "smtp.hostinger.com";
    const port = parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = port === 465;
    const user = process.env.SMTP_USER || "support@webbing.in";
    const pass = process.env.SMTP_PASS || "";
    const defaultFrom = process.env.SMTP_FROM || `"Webbing Support" <support@webbing.in>`;
    return { host, port, secure, user, pass, defaultFrom, appName: "Webbing", appEmail: "support@webbing.in" };
  }
}

// Helper to query dynamic email branding settings
async function getEmailBranding() {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: ["appName", "appEmail", "smtpFromEmail", "smtpUser"] }
      }
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return {
      appName: map.appName || "Webbing",
      appEmail: map.appEmail || map.smtpFromEmail || map.smtpUser || "support@webbing.in"
    };
  } catch (err) {
    return {
      appName: "Webbing",
      appEmail: "support@webbing.in"
    };
  }
}

// Generic helper to send email safely using dynamic SMTP transporter
async function sendMailSafe(to: string, subject: string, html: string, customFrom?: string) {
  const smtp = await getSmtpSettings();
  
  if (!smtp.pass) {
    console.warn(`[Mail Service] SMTP is not configured (missing password). Email to ${to} was not sent. Subject: "${subject}"`);
    return false;
  }
  
  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    });

    const info = await transporter.sendMail({
      from: customFrom || smtp.defaultFrom,
      to,
      subject,
      html,
    });
    console.log(`[Mail Service] Email sent successfully to ${to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Mail Service] Error sending email to ${to}:`, error);
    return false;
  }
}

/**
 * Send Welcome Email on Signup
 */
export async function sendWelcomeEmail(toEmail: string, name: string) {
  const { appName, appEmail } = await getEmailBranding();
  const subject = `Welcome to ${appName}! ✨`;
  const customFrom = `"${appName} Support" <${appEmail}>`;
  const html = `
<div style="background-color: #0a0e17; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #f3f4f6; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 40px; text-align: left; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
     <div style="text-align: center; margin-bottom: 30px;">
       <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">✨ ${appName}</span>
     </div>
     <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 20px;">Welcome to ${appName}, ${name}!</h1>
     <p style="font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px;">
       We're thrilled to have you join ${appName}. Your account has been successfully created. You can now build, manage, and launch modern AI-powered websites in seconds.
     </p>
     <p style="font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 30px;">
       Your registered email address is: <strong style="color: #ffffff;">${toEmail}</strong>
     </p>
     <div style="text-align: center; margin-bottom: 30px;">
       <a href="https://${appName.toLowerCase() === 'webbing' ? 'webbing.in' : 'localhost:3000'}/signin" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Go to Dashboard</a>
     </div>
     <hr style="border: 0; border-top: 1px solid #1f2937; margin: 30px 0;">
     <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0;">
       If you did not sign up for this account, please contact us at ${appEmail}.
     </p>
  </div>
</div>
  `;
  return sendMailSafe(toEmail, subject, html, customFrom);
}

/**
 * Send Bill Payment / Payment verification request received email
 */
export async function sendPaymentRequestEmail(
  toEmail: string,
  name: string,
  planId: string,
  amount: number,
  utr: string
) {
  const { appName, appEmail } = await getEmailBranding();
  const subject = `Payment Verification Request Received - ${appName} 💳`;
  const customFrom = `"${appName} Payments" <${appEmail}>`;
  const displayPlanName = planId.startsWith("credits-")
    ? `Extra Credits (${planId.split("-")[1]} credits)`
    : planId === "pro-plan"
    ? "Pro Plan"
    : planId === "agency"
    ? "Agency Plan"
    : planId.replace("-annual", " (Annual)");

  const html = `
<div style="background-color: #0a0e17; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #f3f4f6; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 40px; text-align: left; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">💳 ${appName} Payments</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 20px;">Payment Verification Under Review</h1>
    <p style="font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px;">
      Hello ${name}, we have received your payment submission. Our billing team is currently verifying the transaction. Once verified, your upgrade/credits will be activated immediately.
    </p>
    <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #374151;">
      <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px; color: #ffffff; border-bottom: 1px solid #374151; padding-bottom: 8px;">Transaction Summary</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #d1d5db;">
        <tr>
          <td style="padding: 6px 0; color: #9ca3af;">Item/Plan:</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #ffffff;">${displayPlanName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af;">Amount Paid:</td>
          <td style="padding: 6px 0; font-weight: 600; text-align: right; color: #ffffff;">INR ${amount}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af;">UTR Transaction ID:</td>
          <td style="padding: 6px 0; font-family: monospace; font-weight: 600; text-align: right; color: #f59e0b;">${utr}</td>
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
  `;
  return sendMailSafe(toEmail, subject, html, customFrom);
}

/**
 * Send Account Activation / Plan Upgrade Confirmation Email
 */
export async function sendPlanActivationEmail(toEmail: string, name: string, planName: string) {
  const { appName, appEmail } = await getEmailBranding();
  const subject = `Your ${appName} Account Plan is Activated! 🚀`;
  const customFrom = `"${appName} Support" <${appEmail}>`;
  const html = `
<div style="background-color: #0a0e17; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #f3f4f6; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 40px; text-align: left; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">🚀 ${appName} Plan Activated</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #34d399; margin-bottom: 20px;">Your Account is Activated!</h1>
    <p style="font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px;">
      Hello ${name}, great news! Your payment has been verified, and your premium subscription has been successfully activated.
    </p>
    <div style="background-color: rgba(52, 211, 153, 0.05); border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid rgba(52, 211, 153, 0.2);">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 16px; color: #34d399;">Active Plan: ${planName}</h3>
      <p style="margin: 0; font-size: 14px; color: #d1d5db; line-height: 1.5;">
        You now have access to all premium features corresponding to your plan, including custom domains, priority AI generations, and expanded limits.
      </p>
    </div>
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://${appName.toLowerCase() === 'webbing' ? 'webbing.in' : 'localhost:3000'}/signin" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Start Building Now</a>
    </div>
    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 30px 0;">
    <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0;">
      Thank you for choosing ${appName}. Let's make something amazing!
    </p>
  </div>
</div>
  `;
  return sendMailSafe(toEmail, subject, html, customFrom);
}

/**
 * Send Credits Purchase Confirmation Email
 */
export async function sendCreditsPurchaseEmail(
  toEmail: string,
  name: string,
  creditCount: number,
  amount: number
) {
  const { appName, appEmail } = await getEmailBranding();
  const subject = `${appName} Credits Purchased Successfully! ⚡`;
  const customFrom = `"${appName} Support" <${appEmail}>`;
  const html = `
<div style="background-color: #0a0e17; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #f3f4f6; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 40px; text-align: left; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">⚡ ${appName} Credits</span>
    </div>
    <h1 style="font-size: 22px; font-weight: 700; color: #818cf8; margin-bottom: 20px;">Credits Added Successfully!</h1>
    <p style="font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 20px;">
      Hello ${name}, your payment for extra credits has been approved. We have credited your account with your purchase.
    </p>
    <div style="background-color: rgba(129, 140, 248, 0.05); border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid rgba(129, 140, 248, 0.2); text-align: center;">
      <div style="font-size: 36px; font-weight: 850; color: #ffffff; margin-bottom: 5px;">+${creditCount}</div>
      <div style="font-size: 14px; color: #818cf8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Credits Added</div>
    </div>
    <p style="font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 30px;">
      These credits are now available for website generations, AI copy writes, or image updates inside your workspace.
    </p>
    <div style="text-align: center; margin-bottom: 30px;">
      <a href="https://${appName.toLowerCase() === 'webbing' ? 'webbing.in' : 'localhost:3000'}/signin" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block;">Go to Workspace</a>
    </div>
    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 30px 0;">
    <p style="font-size: 13px; color: #6b7280; text-align: center; margin: 0;">
      If you have any questions or concerns, email ${appEmail}.
    </p>
  </div>
</div>
  `;
  return sendMailSafe(toEmail, subject, html, customFrom);
}

/**
 * Send Contact Form Submission Email
 */
export async function sendContactFormEmail(
  toEmail: string,
  projectName: string,
  senderName: string,
  senderEmail: string,
  message: string
) {
  const { appName } = await getEmailBranding();
  const subject = `New message from ${senderName} via ${projectName} ✉️`;
  const html = `
<div style="background-color: #0a0e17; padding: 40px 20px; font-family: 'Inter', Helvetica, Arial, sans-serif; color: #f3f4f6; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 40px; text-align: left; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);">
    <div style="text-align: center; margin-bottom: 30px;">
      <span style="font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">✉️ Contact Submission</span>
    </div>
    <h1 style="font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 20px;">New Message Received</h1>
    <p style="font-size: 15px; color: #9ca3af; line-height: 1.6; margin-bottom: 25px;">
      Someone has filled out the contact form on your website <strong style="color: #ffffff;">${projectName}</strong>. Here are the details:
    </p>
    <div style="background-color: #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 30px; border: 1px solid #374151;">
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #d1d5db;">
        <tr>
          <td style="padding: 6px 0; color: #9ca3af; width: 80px;">Name:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;">${senderName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #9ca3af;">Email:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #ffffff;"><a href="mailto:${senderEmail}" style="color: #818cf8; text-decoration: none;">${senderEmail}</a></td>
        </tr>
        <tr>
          <td style="padding: 12px 0 6px 0; color: #9ca3af; vertical-align: top;" colspan="2">Message:</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; background: rgba(0,0,0,0.2); border-radius: 4px; color: #e5e7eb; line-height: 1.6;" colspan="2">
            ${message.replace(/\n/g, "<br/>")}
          </td>
        </tr>
      </table>
    </div>
    <hr style="border: 0; border-top: 1px solid #1f2937; margin: 30px 0;">
    <p style="font-size: 11px; color: #6b7280; text-align: center; margin: 0;">
      This email was sent dynamically by ${appName} AI on behalf of your hosted website.
    </p>
  </div>
</div>
  `;
  return sendMailSafe(toEmail, subject, html);
}
