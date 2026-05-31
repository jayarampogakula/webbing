require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const http = require('http');

const prisma = new PrismaClient();

async function checkSubdomainRouting(subdomain, customDomain) {
  const result = {
    subdomain: "ROUTE_MISSING",
    customDomain: "ROUTE_MISSING"
  };
  try {
    const subResolved = await dns.resolve4(`${subdomain}.webbing.in`).catch(() => []);
    if (subResolved.length > 0) result.subdomain = "ROUTE_OK";
  } catch (err) {}

  if (customDomain) {
    try {
      const domResolved = await dns.resolve4(customDomain).catch(() => []);
      if (domResolved.length > 0) result.customDomain = "ROUTE_OK";
    } catch (err) {}
  }
  return result;
}

async function httpHealthCheck(subdomain) {
  return new Promise((resolve) => {
    const url = `http://${subdomain}.webbing.in/`;
    const req = http.get(url, { headers: { Host: `${subdomain}.webbing.in` } }, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', (e) => {
      resolve(502); // Bad gateway or connection refused
    });
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(504); // Timeout
    });
  });
}

async function main() {
  console.log("=== WEBBING INFRASTRUCTURE DEPLOYMENT DIAGNOSTICS ===");

  // STEP 1: Project Validation
  console.log("\n--- STEP 1: PROJECT VALIDATION ---");
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

  if (projects.length === 0) {
    console.log("PROJECT VALIDATION: FAIL (No projects found)");
    return;
  }
  console.log(`Found ${projects.length} project(s) in database.`);

  for (const p of projects) {
    console.log(`\n==================================================`);
    console.log(`Project: ${p.name} (ID: ${p.id})`);
    console.log(`==================================================`);
    console.log(`- Subdomain: ${p.subdomain}`);
    console.log(`- Status: ${p.status}`);
    console.log(`- Custom Domain: ${p.customDomain?.hostname || "None"} (Verified: ${p.customDomain?.verified ?? false})`);

    // STEP 2: Build Artifact Validation
    console.log("\n--- STEP 2: BUILD ARTIFACT VALIDATION ---");
    const nextDir = path.join(__dirname, 'apps', 'web', '.next');
    const outDir = path.join(__dirname, 'apps', 'web', 'out');
    const distDir = path.join(__dirname, 'apps', 'web', 'dist');
    
    const artifacts = {
      ".next": fs.existsSync(nextDir),
      "out": fs.existsSync(outDir),
      "dist": fs.existsSync(distDir),
    };
    console.log("Build Directories Status:", artifacts);
    if (!artifacts[".next"]) {
      console.log("BUILD_ARTIFACT_MISSING");
      console.log("Missing path:", nextDir);
    } else {
      console.log("BUILD_ARTIFACTS_VALIDATED");
    }

    // STEP 5: Deployment Validation
    console.log("\n--- STEP 5: DEPLOYMENT VALIDATION ---");
    console.log(`Project status in DB: ${p.status}`);
    if (p.status === "PUBLISHED") {
      console.log("DEPLOY_SUCCESS");
    } else if (p.status === "FAILED") {
      console.log("DEPLOY_FAILED");
    } else {
      console.log(`DEPLOY_STATUS: ${p.status}`);
    }

    // STEP 6: Subdomain Routing
    console.log("\n--- STEP 6: SUBDOMAIN ROUTING ---");
    const routing = await checkSubdomainRouting(p.subdomain, p.customDomain?.hostname);
    console.log(`Subdomain Routing (${p.subdomain}.webbing.in): ${routing.subdomain}`);
    if (p.customDomain) {
      console.log(`Custom Domain Routing (${p.customDomain.hostname}): ${routing.customDomain}`);
    }

    // STEP 7: HTTP Health Check
    console.log("\n--- STEP 7: HTTP HEALTH CHECK ---");
    const statusCode = await httpHealthCheck(p.subdomain);
    console.log(`HTTP GET / status: ${statusCode}`);
  }
}

main()
  .catch(e => {
    console.error("DIAGNOSTICS ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
