import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Lightbulb } from "lucide-react";
import { getAllWissenArticles } from "@/lib/wissen";
import { WissenHeader } from "@/components/wissen/wissen-header";

export const metadata: Metadata = {
  title: "Wissen",
  description:
    "Technik-Fehler verstehen und korrigieren, Taktik-Guides und Trainingswissen für Vereins- und Freizeitspieler — von einem erfahrenen Wettkampfspieler.",
  alternates: { canonical: "/wissen" },
};

export default async function WissenIndexPage() {
  const articles = await getAllWissenArticles();

  return (
    <div className="min-h-screen">
      <WissenHeader />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold text-text-primary mb-3">Wissen</h1>
        <p className="text-text-secondary mb-12">
          Technik-Fehler, Taktik und Trainingswissen für Vereins- und Freizeitspieler —
          konkret statt generisch.
        </p>

        <div className="space-y-6">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/wissen/${article.slug}`}
              className="block card-glass p-6 rounded-xl border border-white/[0.06] hover:border-emerald/20 transition-colors group"
            >
              <time className="text-xs text-text-muted">
                {new Date(article.date).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <h2 className="text-lg font-semibold text-text-primary mt-1 mb-2 group-hover:text-emerald transition-colors">
                {article.title}
              </h2>
              <p className="text-sm text-text-secondary mb-3">{article.description}</p>
              <div className="flex items-start gap-2 mb-3 text-xs text-emerald/90">
                <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span className="line-clamp-2">{article.quickTip}</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald">
                Lesen
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
