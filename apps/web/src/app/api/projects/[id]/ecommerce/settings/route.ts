import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";

async function checkAdminAuth(projectId: string) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  if (!user) return null;

  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId: user.tenantId },
  });

  if (!project) return null;
  if (user.role !== "ADMIN" && project.userId && project.userId !== user.userId) {
    return null;
  }

  return user;
}

const DEFAULT_SETTINGS = {
  gateways: {
    stripe: true,
    razorpay: true,
    paypal: false,
    phonepe: false,
    googlepay: true,
    upi: true,
    banktransfer: false,
    cod: true,
  },
  whatsapp: {
    enabled: true,
    phoneNumber: "919999999999",
    supportText: "Hi! I have a question about products in your store.",
    orderNotification: true,
    cartInquiry: true,
  },
  email: {
    orderConfirmTemplate: "Dear {name}, thank you for your order {orderId}. We are preparing it for shipment.",
    abandonedCartEnabled: true,
  },
  shipping: {
    zones: [
      { name: "Domestic", charge: 60, freeShippingMin: 999 },
      { name: "International", charge: 450, freeShippingMin: 5000 },
    ]
  },
  coupons: [
    { code: "WELCOME10", type: "PERCENTAGE", value: 10, minOrder: 499, active: true },
    { code: "FREESHIP", type: "FREE_SHIPPING", value: 0, minOrder: 999, active: true },
    { code: "FLAT100", type: "FIXED", value: 100, minOrder: 999, active: true },
  ]
};

// 1. GET: Retrieve settings (Public for client usage)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const themeObj = (project.theme as any) || {};
    const settings = themeObj.metadata?.ecommerceSettings || DEFAULT_SETTINGS;

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("GET Settings Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 2. POST: Update settings (Admin only)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const authUser = await checkAdminAuth(projectId);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { settings } = body;

    if (!settings) {
      return NextResponse.json({ error: "Settings object is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const themeObj = (project.theme as any) || {};
    const currentMetadata = themeObj.metadata || {};

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        theme: {
          ...themeObj,
          metadata: {
            ...currentMetadata,
            ecommerceSettings: settings
          }
        }
      }
    });

    return NextResponse.json({ success: true, settings: (updated.theme as any).metadata.ecommerceSettings });
  } catch (error: any) {
    console.error("POST Settings Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
