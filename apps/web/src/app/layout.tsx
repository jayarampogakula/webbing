import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Webbing - Production AI Website Builder SaaS",
  description: "Generate complete responsive websites, visual editors, custom domains, and e-commerce stores instantly using AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif", backgroundColor: "#0b0f19", color: "#f3f4f6" }}>
        {children}
      </body>
    </html>
  );
}
