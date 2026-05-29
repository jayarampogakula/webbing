import React from "react";
import { Sparkles } from "lucide-react";

export default function MarketingHeader({ active }: { active?: "signin" | "signup" }) {
  return (
    <header className="site-nav">
      <a className="brand" href="/">
        <span className="brand-mark"><Sparkles size={18} /></span>
        Webbing
      </a>
      <nav className="nav-links">
        <a href="/#home">Home</a>
        <a href="/#features">Features</a>
        <a href="/#pricing">Pricing</a>
        <a href="/#about">About us</a>
        <a href="/#contact">Contact us</a>
      </nav>
      <div className="nav-actions">
        <a className={active === "signin" ? "primary-action" : "secondary-action"} href="/signin">Sign in</a>
        <a className={active === "signup" ? "primary-action" : "secondary-action"} href="/signup">Sign up</a>
      </div>
    </header>
  );
}
