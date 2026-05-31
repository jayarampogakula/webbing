import { NextResponse } from "next/server";
import { prisma } from "@webbing/db";

// POST: Signup or Signin
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const body = await req.json();
    const { action, email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const themeObj = (project.theme as any) || {};
    const metadata = themeObj.metadata || {};
    const settings = metadata.ecommerceSettings || {};
    const customers = settings.customers || [];

    const cleanEmail = email.toLowerCase().trim();

    if (action === "signup") {
      if (!name) {
        return NextResponse.json({ error: "Name is required for registration" }, { status: 400 });
      }

      if (customers.find((c: any) => c.email.toLowerCase() === cleanEmail)) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }

      const newCustomer = {
        name,
        email: cleanEmail,
        password, // Simple local verification
        addresses: [],
        wishlist: [],
        createdAt: new Date().toISOString()
      };

      customers.push(newCustomer);

      await prisma.project.update({
        where: { id: projectId },
        data: {
          theme: {
            ...themeObj,
            metadata: {
              ...metadata,
              ecommerceSettings: {
                ...settings,
                customers
              }
            }
          }
        }
      });

      // Exclude password in response
      const { password: _, ...customerResponse } = newCustomer;
      return NextResponse.json({ success: true, customer: customerResponse });
    } 
    
    if (action === "signin") {
      const customer = customers.find((c: any) => c.email.toLowerCase() === cleanEmail && c.password === password);
      if (!customer) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      const { password: _, ...customerResponse } = customer;
      return NextResponse.json({ success: true, customer: customerResponse });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Customer Auth Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT: Update profile details, wishlist, or address list
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id;
    const body = await req.json();
    const { email, addresses, wishlist, name } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const themeObj = (project.theme as any) || {};
    const metadata = themeObj.metadata || {};
    const settings = metadata.ecommerceSettings || {};
    const customers = settings.customers || [];

    const cleanEmail = email.toLowerCase().trim();
    const customerIdx = customers.findIndex((c: any) => c.email.toLowerCase() === cleanEmail);

    if (customerIdx === -1) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    // Merge changes
    if (name) customers[customerIdx].name = name;
    if (addresses) customers[customerIdx].addresses = addresses;
    if (wishlist) customers[customerIdx].wishlist = wishlist;

    await prisma.project.update({
      where: { id: projectId },
      data: {
        theme: {
          ...themeObj,
          metadata: {
            ...metadata,
            ecommerceSettings: {
              ...settings,
              customers
            }
          }
        }
      }
    });

    const { password: _, ...customerResponse } = customers[customerIdx];
    return NextResponse.json({ success: true, customer: customerResponse });
  } catch (error: any) {
    console.error("Customer PUT Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
