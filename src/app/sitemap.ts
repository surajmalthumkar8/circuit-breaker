import type { MetadataRoute } from "next";
import { NAV_LINKS } from "@/components/nav-links";

/**
 * Sitemap, generated from the same route list the navigation uses so it cannot go stale.
 * A fixed timestamp keeps builds reproducible.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://circuit-breaker.vercel.app";
const LAST_MODIFIED = new Date("2026-07-18T00:00:00.000Z");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: LAST_MODIFIED, changeFrequency: "monthly", priority: 1 },
    ...NAV_LINKS.map((link) => ({
      url: `${BASE_URL}${link.href}`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    {
      url: `${BASE_URL}/plans/new`,
      lastModified: LAST_MODIFIED,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
  ];
}
