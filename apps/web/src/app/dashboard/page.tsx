import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@webbing/db";
import { verifySession } from "@/lib/session";
import GeneratorForm from "../GeneratorForm";

export default async function DashboardPage() {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get("webbing-session")?.value;
  const user = sessionToken ? verifySession(sessionToken) : null;

  // Double check authentication (middleware handles this, but server component safety)
  if (!user) {
    redirect("/signin");
  }

  // Fetch tenant, projects, and subscription data
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    include: {
      subscription: true,
      projects: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!tenant) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#0b0f19" }}>
        <p style={{ color: "#f87171" }}>Workspace not found. Please contact support.</p>
      </div>
    );
  }

  const sub = tenant.subscription;
  const totalCredits = sub?.creditsLimit || 0;
  const usedCredits = sub?.creditsUsed || 0;
  const remainingCredits = Math.max(0, totalCredits - usedCredits);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "radial-gradient(circle at top left, #111827, #030712)", color: "#f3f4f6" }}>
      {/* Navbar */}
      <header className="glass-nav" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 3rem", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <a href="/" style={{ fontSize: "1.5rem", fontWeight: "bold", background: "linear-gradient(to right, #6366f1, #3b82f6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.03em" }}>Webbing</a>
          <span style={{ background: "rgba(255, 255, 255, 0.08)", padding: "0.25rem 0.75rem", borderRadius: "0.35rem", fontSize: "0.75rem", fontWeight: 600, color: "#a5b4fc" }}>Dashboard</span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <nav style={{ display: "flex", gap: "1.5rem", fontSize: "0.9rem" }}>
            <a href="/" className="nav-link" style={{ color: "#9ca3af" }}>Landing Page</a>
            {user.role === "ADMIN" && (
              <a href="/admin" className="nav-link" style={{ color: "#ec4899" }}>Admin Panel</a>
            )}
          </nav>
          <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            User: <strong style={{ color: "#f3f4f6" }}>{user.email}</strong>
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

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: "3rem", maxWidth: "1200px", margin: "0 auto", width: "100%" }}>
        
        {/* Workspace Title & Quota Cards */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>{tenant.name}</h1>
            <p style={{ color: "#9ca3af", margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>Manage and monitor your AI-generated websites</p>
          </div>
          
          {/* Quota Indicator */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <div className="glass-card" style={{ padding: "1rem 1.5rem", borderRadius: "0.75rem", display: "flex", flexDirection: "column", minWidth: "120px" }}>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}>CREDITS USED</span>
              <strong style={{ fontSize: "1.5rem", color: "#818cf8" }}>{usedCredits}</strong>
            </div>
            <div className="glass-card" style={{ padding: "1rem 1.5rem", borderRadius: "0.75rem", display: "flex", flexDirection: "column", minWidth: "120px" }}>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}>REMAINING</span>
              <strong style={{ fontSize: "1.5rem", color: "#10b981" }}>{remainingCredits} <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 400 }}>/ {totalCredits}</span></strong>
            </div>
          </div>
        </div>

        {/* Builder Panel */}
        <div style={{ marginBottom: "4rem" }}>
          <GeneratorForm user={user} />
        </div>

        {/* Websites List */}
        <section>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 1.5rem 0" }}>My Websites ({tenant.projects.length})</h2>
          
          {tenant.projects.length === 0 ? (
            <div className="glass-card" style={{ padding: "3rem", borderRadius: "1rem", textAlign: "center", color: "#9ca3af" }}>
              <p style={{ margin: 0, fontSize: "0.95rem" }}>You haven't generated any websites yet. Use the prompt box above to build your first site!</p>
            </div>
          ) : (
            <div className="glass-card" style={{ borderRadius: "1rem", overflow: "hidden", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.02)", borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                    <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Site Name</th>
                    <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Subdomain Slug</th>
                    <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600 }}>Created Date</th>
                    <th style={{ padding: "1rem 1.5rem", color: "#9ca3af", fontWeight: 600, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.projects.map((proj) => {
                    let statusColor = "#9ca3af";
                    let statusBg = "rgba(156, 163, 175, 0.1)";
                    if (proj.status === "PUBLISHED") {
                      statusColor = "#34d399";
                      statusBg = "rgba(16, 185, 129, 0.1)";
                    } else if (proj.status === "GENERATING") {
                      statusColor = "#60a5fa";
                      statusBg = "rgba(59, 130, 246, 0.1)";
                    } else if (proj.status === "FAILED") {
                      statusColor = "#f87171";
                      statusBg = "rgba(239, 68, 68, 0.1)";
                    }

                    return (
                      <tr key={proj.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.03)" }}>
                        <td style={{ padding: "1.25rem 1.5rem", fontWeight: 600 }}>{proj.name}</td>
                        <td style={{ padding: "1.25rem 1.5rem", color: "#cbd5e1" }}>
                          <code>{proj.subdomain}.localhost:3000</code>
                        </td>
                        <td style={{ padding: "1.25rem 1.5rem" }}>
                          <span style={{ color: statusColor, background: statusBg, padding: "0.25rem 0.6rem", borderRadius: "0.35rem", fontSize: "0.75rem", fontWeight: 700 }}>
                            {proj.status}
                          </span>
                        </td>
                        <td style={{ padding: "1.25rem 1.5rem", color: "#9ca3af" }}>
                          {new Date(proj.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </td>
                        <td style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
                          {proj.status === "PUBLISHED" && (
                            <a 
                              href={`http://${proj.subdomain}.localhost:3000`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="glow-btn"
                              style={{ background: "#4f46e5", color: "#ffffff", padding: "0.4rem 0.85rem", borderRadius: "0.35rem", fontSize: "0.8rem", textDecoration: "none", fontWeight: 600 }}
                            >
                              Visit Site ↗
                            </a>
                          )}
                          {proj.status === "GENERATING" && (
                            <span style={{ fontSize: "0.8rem", color: "#60a5fa" }}>Building pages...</span>
                          )}
                          {proj.status === "FAILED" && (
                            <span style={{ fontSize: "0.8rem", color: "#f87171" }}>Build failed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer style={{ padding: "3rem", textAlign: "center", color: "#4b5563", fontSize: "0.85rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}>
        © {new Date().getFullYear()} Webbing Platforms Inc. All rights reserved.
      </footer>
    </div>
  );
}
