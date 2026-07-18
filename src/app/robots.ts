import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://circuit-breaker.vercel.app";

/**
 * Crawling is allowed everywhere except the generation endpoint, which costs quota and
 * has nothing useful to index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
