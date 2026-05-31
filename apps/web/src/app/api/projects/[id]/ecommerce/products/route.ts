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

// 1. GET: Fetch all products (public)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const store = await prisma.ecomStore.findUnique({
      where: { projectId },
      include: { products: { orderBy: { createdAt: "desc" } } }
    });

    if (!store) {
      return NextResponse.json({ products: [] });
    }

    return NextResponse.json({ products: store.products });
  } catch (error: any) {
    console.error("GET Products Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 2. POST: Create new product (gated to store admin)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const authUser = await checkAdminAuth(projectId);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const store = await prisma.ecomStore.findUnique({ where: { projectId } });
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, price, inventory, images } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        storeId: store.id,
        name,
        description: typeof description === "string" ? description : JSON.stringify(description || {}),
        price: Number(price),
        inventory: Number(inventory || 0),
        images: Array.isArray(images) ? images : [],
      }
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error("POST Product Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 3. PUT: Edit product (gated to store admin)
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const authUser = await checkAdminAuth(projectId);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const body = await req.json();
    const { productId, name, description, price, inventory, images } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description: typeof description === "string" ? description : JSON.stringify(description || {}),
        price: price !== undefined ? Number(price) : undefined,
        inventory: inventory !== undefined ? Number(inventory) : undefined,
        images: Array.isArray(images) ? images : undefined,
      }
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("PUT Product Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// 4. DELETE: Delete product (gated to store admin)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const authUser = await checkAdminAuth(projectId);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    const url = new URL(req.url);
    const productId = url.searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    await prisma.product.delete({
      where: { id: productId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Product Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
