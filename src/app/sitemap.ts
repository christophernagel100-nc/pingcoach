import type { MetadataRoute } from "next";
import { getAllWissenArticles } from "@/lib/wissen";

const BASE_URL = "https://pingcoach.nailcrest.de";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllWissenArticles();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE_URL}/wissen`, changeFrequency: "weekly", priority: 0.8 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${BASE_URL}/wissen/${article.slug}`,
    lastModified: article.date,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...articleRoutes];
}
