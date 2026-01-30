/**
 * Root Layout
 * Defines the HTML structure and loads global styles
 */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CS2 Case Opener",
  description: "Open CS2 cases and collect skins!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
