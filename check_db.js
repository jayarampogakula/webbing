const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all projects...");
  const projects = await prisma.project.findMany({
    include: {
      customDomain: true,
      pages: {
        include: {
          sections: true
        }
      }
    }
  });
  console.log("PROJECTS COUNT:", projects.length);
  for (const p of projects) {
    console.log(`- Project ID: ${p.id}, Name: ${p.name}, Subdomain: ${p.subdomain}, Status: ${p.status}`);
    if (p.customDomain) {
      console.log(`  Custom Domain: ${p.customDomain.hostname}, Verified: ${p.customDomain.verified}, SSL Status: ${p.customDomain.sslStatus}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
