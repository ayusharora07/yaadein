import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yaadein — यादें | Memories with Friends",
  description: "A friendship memory platform — share Moments, fill Slam Books, and seal Time Capsules together. Powered by open-source AI.",
  keywords: ["friendship", "memories", "slam book", "time capsule", "moments", "friends"],
  openGraph: {
    title: "Yaadein — Memories with Friends",
    description: "Share Moments, fill Slam Books, and seal Time Capsules together.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-navy-900 text-white/90 antialiased">
        {/* Ambient background glows */}
        <div className="ambient-glow bg-amber-500/20 top-[-200px] left-[-200px]" />
        <div className="ambient-glow bg-violet-500/15 bottom-[-200px] right-[-200px]" />
        <div className="ambient-glow bg-rose-500/10 top-[40%] right-[-300px]" />

        {/* Children handle their own layout (Navbar included per-page) */}
        {children}
      </body>
    </html>
  );
}
