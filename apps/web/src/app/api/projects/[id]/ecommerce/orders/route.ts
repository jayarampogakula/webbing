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

// 1. GET: Fetch orders (Admin gets all, Customer gets filtered by email)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const url = new URL(req.url);
    const customerEmail = url.searchParams.get("customerEmail");

    const store = await prisma.ecomStore.findUnique({ where: { projectId } });
    if (!store) {
      return NextResponse.json({ orders: [] });
    }

    // Check if the requester is the admin
    const isAdmin = await checkAdminAuth(projectId);

    if (isAdmin) {
      const orders = await prisma.order.findMany({
        where: { storeId: store.id },
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ orders });
    }

    // If not admin, we require customerEmail to fetch their orders
    if (!customerEmail) {
      return NextResponse.json({ error: "Access denied. Sign in as admin or provide customerEmail query parameter." }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      where: { storeId: store.id, customerEmail },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error("GET Orders Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 2. POST: Place a new order (public client checkout)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const store = await prisma.ecomStore.findUnique({
      where: { projectId },
      include: { products: true }
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const body = await req.json();
    const { customerEmail, customerName, items, total, paymentMethod } = body;

    if (!customerEmail || !customerName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing checkout parameters" }, { status: 400 });
    }

    // Start database transaction to create order and decrement stock
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify and update stock
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new Error(`Product not found: ${item.name}`);
        }

        if (product.inventory < item.quantity) {
          throw new Error(`Insufficient inventory for product: ${product.name}`);
        }

        // Decrement stock
        await tx.product.update({
          where: { id: item.productId },
          data: { inventory: { decrement: Number(item.quantity) } }
        });
      }

      // 2. Create the order
      const order = await tx.order.create({
        data: {
          storeId: store.id,
          customerEmail,
          customerName,
          items: items, // JSON format
          total: Number(total),
          status: "PENDING",
          paymentId: body.paymentId || `pay_${paymentMethod}_${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        }
      });

      return order;
    });

    return NextResponse.json({ success: true, order: result });
  } catch (error: any) {
    console.error("POST Order Exception:", error);
    return NextResponse.json({ error: error.message || "Checkout failed" }, { status: 400 });
  }
}

// 3. PUT: Update order details/status (gated to store admin)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const authUser = await checkAdminAuth(projectId);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, status, trackingNumber, paymentId } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Load existing order
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    let finalPaymentId = order.paymentId || "";
    if (paymentId) {
      finalPaymentId = paymentId;
    }

    // Encode tracking number inside paymentId if provided
    if (trackingNumber !== undefined) {
      const basePayId = finalPaymentId.split("|")[0];
      finalPaymentId = `${basePayId}|tracking:${trackingNumber}`;
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status || undefined,
        paymentId: finalPaymentId,
      }
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error("PUT Order Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
