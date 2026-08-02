import fs from "fs";
import path from "path";
import type { WissenArticleMetadata } from "./types";

const WISSEN_DIR = path.join(process.cwd(), "content/wissen");

export function getWissenSlugs(): string[] {
  return fs
    .readdirSync(WISSEN_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export async function getWissenArticleMetadata(
  slug: string
): Promise<WissenArticleMetadata> {
  const mod = await import(`@/../content/wissen/${slug}.mdx`);
  return mod.metadata as WissenArticleMetadata;
}

export async function getAllWissenArticles(): Promise<WissenArticleMetadata[]> {
  const slugs = getWissenSlugs();
  const articles = await Promise.all(
    slugs.map((slug) => getWissenArticleMetadata(slug))
  );
  return articles.sort((a, b) => (a.date < b.date ? 1 : -1));
}
