import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store/provider";
import { SiteNav, SiteFooter } from "@/components/site-nav";

export const metadata: Metadata = {
  title: {
    default: "Circuit Breaker — break the habit loop, not your willpower",
    template: "%s · Circuit Breaker",
  },
  description:
    "A GenAI habit-change companion that senses when your self-control is weakest and adapts " +
    "to meet you there, with personalised plans, in-the-moment craving support, and honest tracking.",
  applicationName: "Circuit Breaker",
  authors: [{ name: "Circuit Breaker" }],
  keywords: [
    "habit change",
    "screen time",
    "addiction recovery",
    "generative AI",
    "behaviour change",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f766d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <StoreProvider>
          <SiteNav />
          <main id="main" className="mx-auto max-w-6xl px-4 py-10">
            {children}
          </main>
          <SiteFooter />
        </StoreProvider>
      </body>
    </html>
  );
}
