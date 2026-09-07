import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import PolicyStatusProvider from "@/components/policy/PolicyStatusProvider";

export const metadata: Metadata = {
  title: "Eema — Instant quotes for filming & event spaces",
  description:
    "Describe your shoot or event. Eema replies in seconds with a real itemised quote and lets you reserve the space live.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink font-sans antialiased">
        <AuthProvider><PolicyStatusProvider>{children}</PolicyStatusProvider></AuthProvider>
      </body>
    </html>
  );
}
