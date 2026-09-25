import type { Metadata } from "next";
import "./globals.css";
import "./contrast.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: { default: "Everyday AI", template: "%s | Everyday AI" },
  description: "Simple AI tips, useful prompts and tested tools for everyday people—not tech experts.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body className="antialiased"><SiteHeader/>{children}<SiteFooter/></body>
    </html>
  );
}
