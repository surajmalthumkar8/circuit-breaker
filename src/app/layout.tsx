import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store/provider";
import { SiteNav, SiteFooter } from "@/components/site-nav";

/** Self-hosted at build time — no runtime request to a third-party font service. */
const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Circuit Breaker — break the habit loop, not your willpower",
    template: "%s · Circuit Breaker",
  },
  description:
    "A GenAI habit-change companion that senses when your self-control is weakest and adapts to " +
    "meet you there, with personalised plans, in-the-moment craving support, and honest tracking.",
  applicationName: "Circuit Breaker",
  keywords: [
    "habit change",
    "screen time",
    "addiction recovery",
    "generative AI",
    "behaviour change",
  ],
  openGraph: {
    title: "Circuit Breaker — break the habit loop, not your willpower",
    description:
      "Senses when your self-control is physiologically weakest, then adapts its interface and " +
      "its coaching to meet you there.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#070b0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={display.variable}>
      <body className="min-h-[100dvh]">
        <a href="#main" className="skip-link">
          Skip to main content
        </a>

        {/* Decorative depth layers. Fixed and inert so they never affect scroll performance. */}
        <div className="ambient-field" aria-hidden="true" />
        <div className="grain-overlay" aria-hidden="true" />

        <StoreProvider>
          <SiteNav />
          <main id="main" className="relative z-10 mx-auto max-w-6xl px-4 py-14 sm:py-20">
            {children}
          </main>
          <SiteFooter />
        </StoreProvider>
      </body>
    </html>
  );
}
