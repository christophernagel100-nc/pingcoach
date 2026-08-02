import type { MetadataRoute } from "next";

const BASE_URL = "https://pingcoach.nailcrest.de";

// Protected app routes shouldn't be crawled — only landing + /wissen content is public.
const disallow = ["/dashboard", "/analyse", "/training", "/profil", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Explicitly allow AI/answer-engine crawlers (GEO) — some default robots.txt
      // templates block these; we want /wissen indexed by generative search engines.
      { userAgent: "GPTBot", allow: "/", disallow },
      { userAgent: "ClaudeBot", allow: "/", disallow },
      { userAgent: "anthropic-ai", allow: "/", disallow },
      { userAgent: "PerplexityBot", allow: "/", disallow },
      { userAgent: "Google-Extended", allow: "/", disallow },
      { userAgent: "OAI-SearchBot", allow: "/", disallow },
      { userAgent: "CCBot", allow: "/", disallow },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
