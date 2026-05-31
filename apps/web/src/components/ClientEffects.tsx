"use client";

import { useEffect } from "react";

export default function ClientEffects({ designStyle }: { designStyle: string }) {
  useEffect(() => {
    // 1. Add js-enabled class to enable animations
    document.body.classList.add("js-enabled");

    // 2. Intersection Observer for Scroll Reveal
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.05 }
    );

    document.querySelectorAll(".reveal-on-scroll").forEach((el) => observer.observe(el));

    // 3. Broken Image Fixer
    const replaceImage = (img: HTMLImageElement) => {
      const isGaming =
        document.querySelector(".bg-grad-gaming") ||
        document.querySelector(".font-gaming") ||
        document.body.classList.contains("bg-grad-gaming");
      const isFitness =
        document.querySelector(".bg-grad-fitness") ||
        document.body.classList.contains("bg-grad-fitness");
      const isCreator =
        document.querySelector(".bg-grad-creator") ||
        document.body.classList.contains("bg-grad-creator");
      const isLuxury =
        document.querySelector(".bg-grad-luxury") ||
        document.querySelector(".font-serif-lux") ||
        document.body.classList.contains("bg-grad-luxury");

      let style = "SaaS";
      if (isGaming) style = "Gaming";
      else if (isFitness) style = "Fitness";
      else if (isCreator) style = "Creator";
      else if (isLuxury) style = "Luxury";

      const fallbacks: Record<string, string> = {
        Gaming: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80",
        Fitness: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80",
        Creator: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80",
        Luxury: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
        SaaS: "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80",
      };

      const fallbackUrl = fallbacks[style] || fallbacks.SaaS;
      if (img.src !== fallbackUrl) {
        img.src = fallbackUrl;
      }
    };

    const handleImgError = (e: Event) => {
      replaceImage(e.currentTarget as HTMLImageElement);
    };

    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      // Fix: Only replace if the image is actually complete AND broken (naturalWidth === 0)
      if (img.complete && img.naturalWidth === 0) {
        replaceImage(img);
      } else {
        img.addEventListener("error", handleImgError);
      }
    });

    // 4. Link Scroll Fixer
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      let targetId = "";
      if (href.startsWith("#")) {
        targetId = href.substring(1);
      } else if (href.includes("/preview/")) {
        const parts = href.split("/");
        targetId = parts[parts.length - 1];
      } else if (!href.startsWith("http") && !href.startsWith("mailto:") && !href.startsWith("tel:")) {
        targetId = href.replace(/^\//, "");
      }

      if (!targetId || targetId === "index" || targetId === "#") return;

      const cleanTargetId = targetId.toLowerCase().trim();
      const targetEl =
        document.getElementById(cleanTargetId) ||
        document.querySelector('[id*="' + cleanTargetId + '"]') ||
        document.querySelector("." + cleanTargetId);

      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        try {
          window.history.pushState(null, "", "#" + cleanTargetId);
        } catch (err) {}
      } else if (href.startsWith("#") || href.includes("/preview/")) {
        const contactSection = document.getElementById("contact");
        if (contactSection) {
          e.preventDefault();
          contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    document.body.addEventListener("click", handleLinkClick);

    // Clean up
    return () => {
      document.body.classList.remove("js-enabled");
      observer.disconnect();
      images.forEach((img) => {
        img.removeEventListener("error", handleImgError);
      });
      document.body.removeEventListener("click", handleLinkClick);
    };
  }, [designStyle]);

  return null;
}
