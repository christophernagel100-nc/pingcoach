import type { Metadata } from "next";
import { notFound } from "next/navigation";
import techniquesData from "@/../data/techniques.json";
import drillsData from "@/../data/drills.json";
import type { TechniqueGuide, Drill, WissenArticleMetadata } from "@/lib/types";
import { getWissenSlugs } from "@/lib/wissen";
import { WissenHeader } from "@/components/wissen/wissen-header";
import { RelatedDrills } from "@/components/wissen/related-drills";
import { QuickTip } from "@/components/wissen/quick-tip";
import { WaitlistForm } from "@/components/waitlist-form";

export function generateStaticParams() {
  return getWissenSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

async function loadArticle(slug: string) {
  const slugs = getWissenSlugs();
  if (!slugs.includes(slug)) return null;
  const mod = await import(`@/../content/wissen/${slug}.mdx`);
  return {
    Article: mod.default,
    metadata: mod.metadata as WissenArticleMetadata,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadArticle(slug);
  if (!loaded) return {};
  const { metadata } = loaded;

  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.seoKeywords,
    alternates: { canonical: `/wissen/${metadata.slug}` },
    openGraph: {
      type: "article",
      title: metadata.title,
      description: metadata.description,
      publishedTime: metadata.date,
    },
  };
}

function buildJsonLd(metadata: WissenArticleMetadata) {
  const url = `https://pingcoach.nailcrest.de/wissen/${metadata.slug}`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "Article",
      headline: metadata.title,
      description: metadata.description,
      datePublished: metadata.date,
      dateModified: metadata.date,
      url,
      author: {
        "@type": "Person",
        name: metadata.author,
      },
      publisher: {
        "@type": "Organization",
        name: "PingCoach",
      },
    },
  ];

  if (metadata.faq && metadata.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: metadata.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  if (metadata.howTo) {
    graph.push({
      "@type": "HowTo",
      name: metadata.howTo.name,
      step: metadata.howTo.steps.map((step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        text: step,
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export default async function WissenArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const loaded = await loadArticle(slug);
  if (!loaded) notFound();
  const { Article, metadata } = loaded;

  const techniques = techniquesData as TechniqueGuide[];
  const drills = drillsData as Drill[];

  const relatedTechnique = techniques.find((t) =>
    metadata.relatedTechniqueIds.includes(t.id)
  );
  const relatedDrills = relatedTechnique
    ? drills.filter((d) => relatedTechnique.related_drill_ids.includes(d.id))
    : [];

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd(metadata)) }}
      />
      <WissenHeader />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <article>
          <time className="text-xs text-text-muted">
            {new Date(metadata.date).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            {" · "}
            {metadata.author}
          </time>
          <h1 className="text-3xl font-semibold text-text-primary mt-2 mb-6">
            {metadata.title}
          </h1>
          <QuickTip tip={metadata.quickTip} />
          <Article />
        </article>

        <RelatedDrills drills={relatedDrills} />

        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Bleib auf dem Laufenden
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            Trag dich für die Warteliste ein, sobald PingCoach startet.
          </p>
          <WaitlistForm source={`wissen:${metadata.slug}`} />
        </div>
      </main>
    </div>
  );
}
