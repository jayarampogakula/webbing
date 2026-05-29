const { PrismaClient, Role, SubscriptionStatus } = require("@prisma/client");
const { hashPassword } = require("../dist/auth");

const prisma = new PrismaClient();

async function main() {
  console.log("Checking and initializing default accounts via upsert...");

  // 1. Create or get Admin Tenant
  const adminTenant = await prisma.tenant.upsert({
    where: { slug: "admin" },
    update: { name: "Admin Team" },
    create: {
      name: "Admin Team",
      slug: "admin",
    },
  });

  // 2. Create or update Admin User
  const adminPasswordHash = hashPassword("AdminPassword123");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@webbing.in" },
    update: {
      name: "SaaS Admin Manager",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      tenantId: adminTenant.id,
    },
    create: {
      email: "admin@webbing.in",
      name: "SaaS Admin Manager",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      tenantId: adminTenant.id,
    },
  });

  // 3. Create or update Admin Subscription
  await prisma.subscription.upsert({
    where: { tenantId: adminTenant.id },
    update: {
      planId: "agency-plan",
      status: SubscriptionStatus.ACTIVE,
      creditsLimit: 500,
    },
    create: {
      tenantId: adminTenant.id,
      planId: "agency-plan",
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      creditsLimit: 500,
      creditsUsed: 0,
    },
  });

  console.log(`Ensured Admin User: ${adminUser.email} (Password: AdminPassword123)`);

  // 4. Create or get Standard User Tenant
  const standardTenant = await prisma.tenant.upsert({
    where: { slug: "user" },
    update: { name: "User Workspace" },
    create: {
      name: "User Workspace",
      slug: "user",
    },
  });

  // 5. Create or update Standard User
  const userPasswordHash = hashPassword("UserPassword123");
  const standardUser = await prisma.user.upsert({
    where: { email: "user@webbing.in" },
    update: {
      name: "John Doe User",
      passwordHash: userPasswordHash,
      role: Role.USER,
      tenantId: standardTenant.id,
    },
    create: {
      email: "user@webbing.in",
      name: "John Doe User",
      passwordHash: userPasswordHash,
      role: Role.USER,
      tenantId: standardTenant.id,
    },
  });

  // 6. Create or update Standard User Subscription
  await prisma.subscription.upsert({
    where: { tenantId: standardTenant.id },
    update: {
      planId: "pro-plan",
      status: SubscriptionStatus.ACTIVE,
      creditsLimit: 100,
    },
    create: {
      tenantId: standardTenant.id,
      planId: "pro-plan",
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      creditsLimit: 100,
      creditsUsed: 0,
    },
  });

  console.log(`Ensured Standard User: ${standardUser.email} (Password: UserPassword123)`);
  console.log("Database seeding/upsert completed successfully! 🎉");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
