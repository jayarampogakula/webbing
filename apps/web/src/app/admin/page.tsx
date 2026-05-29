import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import UpgradeButton from "./UpgradeButton";

export default async function AdminPage() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  // Verify administration credentials
  if (!user || user.role !== "ADMIN") {
    redirect("/signin");
  }

  // Fetch administrator tables
  const [users, projects, subscriptions, totalTenants] = await Promise.all([
    prisma.user.findMany({
      include: { tenant: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.project.findMany({
      include: { tenant: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findMany({
      include: { tenant: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tenant.count(),
  ]);

  const totalUsers = users.length;
  const totalSites = projects.length;
  const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE").length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "radial-gradient(circle at top left, #111827, #030712)", color: "#f3f4f6" }}>
      
      {/* Navbar */}
      <header className="glass-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 3rem", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a href="/" style={{ fontSize: "1.5rem", fontWeight: "bold", background: "linear-gradient(to right, #6366f1, #3b82f6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em" }}>Webbing</a>
          <span style={{ background: "rgba(236, 72, 153, 0.1)", border: "1px solid rgba(236, 72, 153, 0.2)", padding: "0.25rem 0.75rem", borderRadius: "0.35rem", fontSize: "0.75rem", fontWeight: 700, color: "#f472b6" }}>Admin Portal</span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <nav style={{ display: "flex", gap: "1.5rem", fontSize: "0.9rem" }}>
            <a href="/" className="nav-link" style={{ color: "#9ca3af" }}>Landing Page</a>
            <a href="/dashboard" className="nav-link" style={{ color: "#818cf8" }}>User Dashboard</a>
          </nav>
          <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            Admin: <strong style={{ color: "#f472b6" }}>{user.email}</strong>
          </span>
          <a 
            href="/api/auth/signout" 
            className="glow-btn"
            style={{ 
              background: "rgba(239, 68, 68, 0.1)", 
              border: "1px solid rgba(239, 68, 68, 0.2)", 
              color: "#f87171", 
              padding: "0.5rem 1.25rem", 
              borderRadius: "0.5rem", 
              fontWeight: 500,
              fontSize: "0.85rem"
            }}
          >
            Sign Out
          </a>
        </div>
      </header>

      {/* Content Container */}
      <main style={{ flexGrow: 1, padding: "3rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "2.5rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>System Overview</h1>
          <p style={{ color: "#9ca3af", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>Manage tenant accounts, generated websites, and subscription quotas.</p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
          <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "1rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}>TOTAL USERS</span>
            <strong style={{ display: "block", fontSize: "2.25rem", color: "#ffffff", marginTop: "0.5rem" }}>{totalUsers}</strong>
          </div>
          <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "1rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}>WEBSITES GENERATED</span>
            <strong style={{ display: "block", fontSize: "2.25rem", color: "#818cf8", marginTop: "0.5rem" }}>{totalSites}</strong>
          </div>
          <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "1rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}>TENANTS</span>
            <strong style={{ display: "block", fontSize: "2.25rem", color: "#3b82f6", marginTop: "0.5rem" }}>{totalTenants}</strong>
          </div>
          <div className="glass-card" style={{ padding: "1.5rem", borderRadius: "1rem" }}>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}>ACTIVE PLANS</span>
            <strong style={{ display: "block", fontSize: "2.25rem", color: "#10b981", marginTop: "0.5rem" }}>{activeSubs}</strong>
          </div>
        </div>

        {/* Users Table */}
        <section style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 1rem 0", color: "#ffffff" }}>User Management</h2>
          <div className="glass-card" style={{ borderRadius: "1rem", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Name</th>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Email</th>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Role</th>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Workspace</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.03)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600 }}>{u.name}</td>
                    <td style={{ padding: "1rem 1.5rem" }}>{u.email}</td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span style={{ 
                        color: u.role === "ADMIN" ? "#f472b6" : "#818cf8", 
                        background: u.role === "ADMIN" ? "rgba(236, 72, 153, 0.1)" : "rgba(99, 102, 241, 0.1)",
                        padding: "0.2rem 0.5rem", 
                        borderRadius: "0.25rem", 
                        fontSize: "0.75rem", 
                        fontWeight: 700 
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", color: "#9ca3af" }}>{u.tenant.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Websites Table */}
        <section style={{ marginBottom: "4rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 1rem 0", color: "#ffffff" }}>Generated Websites</h2>
          <div className="glass-card" style={{ borderRadius: "1rem", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Site Name</th>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Subdomain Link</th>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Workspace Owner</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  let statusColor = "#9ca3af";
                  if (p.status === "PUBLISHED") statusColor = "#34d399";
                  else if (p.status === "GENERATING") statusColor = "#60a5fa";
                  else if (p.status === "FAILED") statusColor = "#f87171";

                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.03)" }}>
                      <td style={{ padding: "1rem 1.5rem", fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <a 
                          href={`http://${p.subdomain}.localhost:3000`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: "#6366f1", textDecoration: "underline" }}
                        >
                          {p.subdomain}.localhost:3000
                        </a>
                      </td>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <span style={{ color: statusColor, fontWeight: 700, fontSize: "0.85rem" }}>{p.status}</span>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", color: "#9ca3af" }}>{p.tenant.name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Subscription Quotas Table */}
        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 1rem 0", color: "#ffffff" }}>Subscription Credits Quotas</h2>
          <div className="glass-card" style={{ borderRadius: "1rem", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Workspace</th>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Plan Type</th>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Credits Used</th>
                  <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600, textAlign: "right" }}>Credits Limit Management</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.03)" }}>
                    <td style={{ padding: "1rem 1.5rem", fontWeight: 600 }}>{s.tenant.name}</td>
                    <td style={{ padding: "1rem 1.5rem", textTransform: "capitalize" }}>{s.planId.replace("-", " ")}</td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span style={{ 
                        color: s.status === "ACTIVE" ? "#34d399" : "#f87171",
                        fontWeight: 700,
                        fontSize: "0.85rem"
                      }}>{s.status}</span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <strong>{s.creditsUsed}</strong> credits
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                      <UpgradeButton tenantId={s.tenantId} initialLimit={s.creditsLimit} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer style={{ padding: "3rem", textAlign: "center", color: "#4b5563", fontSize: "0.85rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
        © {new Date().getFullYear()} Webbing Platforms Inc. All rights reserved. Admin Administration Dashboard.
      </footer>
    </div>
  );
}
