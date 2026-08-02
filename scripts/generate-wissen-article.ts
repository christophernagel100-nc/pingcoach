#!/usr/bin/env -S npx tsx
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { MessageParam, TextBlockParam } from "@anthropic-ai/sdk/resources/messages";
import fs from "fs";
import path from "path";
import techniquesData from "../data/techniques.json";
import drillsData from "../data/drills.json";
import type { WissenArticleMetadata } from "../src/lib/types";

// Mirrors src/lib/gemini.ts: lazy client init, dedicated error classes.
// Uses Anthropic structured outputs (output_config.format) instead of manual
// JSON-in-prose parsing — the server enforces the schema, removing the
// malformed-JSON failure mode entirely instead of retrying around it.

const REPO_ROOT = path.join(__dirname, "..");
const FACT_SHEET_PATH = path.join(REPO_ROOT, "content/fact-sheet.md");
const WISSEN_DIR = path.join(REPO_ROOT, "content/wissen");

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new GenerationConfigError("ANTHROPIC_API_KEY ist nicht konfiguriert");
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}

export class GenerationConfigError extends Error {
  constructor(msg: string) { super(msg); this.name = "GenerationConfigError"; }
}
export class GenerationParseError extends Error {
  constructor(msg: string) { super(msg); this.name = "GenerationParseError"; }
}

const ArticleSchema = z.object({
  metadata: z.object({
    slug: z.string().describe("Kebab-case Slug, z.B. 'warum-dein-vorhand-topspin-abrutscht'"),
    title: z.string().describe("Artikel-Titel"),
    description: z.string().describe("150-160 Zeichen Meta-Description"),
    author: z.string().describe("Der persona_name aus dem Fakten-Sheet-Frontmatter, exakt übernommen"),
    relatedTechniqueIds: z.array(z.string()).describe("IDs aus den Grounding-Daten (techniques.json), die dieser Artikel behandelt"),
    seoKeywords: z.array(z.string()).describe("3-5 SEO-Keywords"),
    quickTip: z.string().describe(
      "EIN Satz: der schnellste, sofort umsetzbare Trick aus dem Artikel — das, was ein Leser " +
      "mitnimmt, selbst wenn er nur diesen einen Satz liest. Konkret und direkt umsetzbar, keine " +
      "Allgemeinplätze."
    ),
    faq: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).describe("2-4 häufig gestellte Fragen mit Antworten, für FAQPage-Schema"),
    howTo: z.object({
      name: z.string(),
      steps: z.array(z.string()),
    }).nullable().describe("Nur setzen, wenn der Artikel eine klare Schritt-für-Schritt-Anleitung enthält, sonst null"),
  }),
  body: z.string().describe(
    "Der vollständige Artikeltext als Markdown (H2/H3-Zwischenüberschriften, Absätze, Listen). " +
    "Beginnt DIREKT mit 2-3 Sätzen Direktantwort als Fließtext, OHNE Überschrift davor " +
    "(der Titel wird bereits separat als H1 angezeigt)."
  ),
});

type GeneratedArticle = z.infer<typeof ArticleSchema>;

const INSTRUCTIONS = `Du schreibst Artikel für den /wissen-Bereich von PingCoach, einer Tischtennis-App.

REGELN:
- Halte dich strikt an das Fakten-Sheet unten: Tonalität, Autoren-Persona, harte Grenzen (never_reveal, hard_no_topics).
- Technik-Details NUR aus den Grounding-Daten (techniques.json/drills.json) unten übernehmen — niemals eigene Technikbeschreibungen erfinden, die dort nicht stehen.
- Erwähne KEINE Ausrüstungs-/Material-/Belag-Details, wenn sie nicht explizit in den Grounding-Daten stehen — auch nicht beiläufig als Randbemerkung.
- Wenn ein Thema Technik-Details braucht, die NICHT in den Grounding-Daten stehen: als Lücke behandeln, nicht erfinden.
- Artikel-Struktur (wichtig für GEO/KI-Auffindbarkeit): fragenartige Zwischenüberschriften ("Warum...?"), jeder Abschnitt für sich verständlich (keine "wie oben erwähnt"-Verweise).
- quickTip ist Pflicht und wird prominent über dem Artikel angezeigt — er muss für sich allein stehen und sofort umsetzbar sein, auch ohne den restlichen Artikel zu lesen.
- relatedTechniqueIds MUSS auf existierende IDs aus den Grounding-Daten verweisen.
- Alle Texte auf Deutsch.`;

function buildGroundingBlock(): string {
  const factSheet = fs.readFileSync(FACT_SHEET_PATH, "utf-8");
  const grounding = JSON.stringify({ techniques: techniquesData, drills: drillsData }, null, 2);
  return `FAKTEN-SHEET:\n${factSheet}\n\nGROUNDING-DATEN (techniques.json + drills.json):\n${grounding}`;
}

function getExistingSlugs(): string[] {
  if (!fs.existsSync(WISSEN_DIR)) return [];
  return fs.readdirSync(WISSEN_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

async function callModel(userMessage: string): Promise<GeneratedArticle> {
  const client = getClient();

  const systemBlocks: TextBlockParam[] = [
    { type: "text", text: INSTRUCTIONS },
    { type: "text", text: buildGroundingBlock(), cache_control: { type: "ephemeral" } },
  ];

  const messages: MessageParam[] = [{ role: "user", content: userMessage }];

  const response = await client.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 16000,
    system: systemBlocks,
    output_config: { effort: "high", format: zodOutputFormat(ArticleSchema) },
    messages,
  });

  if (response.stop_reason === "refusal") {
    throw new GenerationParseError("Claude hat die Anfrage abgelehnt (safety refusal)");
  }
  if (!response.parsed_output) {
    throw new GenerationParseError(
      `Structured Output konnte nicht geparst werden (stop_reason: ${response.stop_reason})`
    );
  }
  return response.parsed_output;
}

function finalizeArticle(article: GeneratedArticle): { metadata: WissenArticleMetadata; body: string } {
  const { metadata, body } = article;

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(metadata.slug)) {
    throw new GenerationParseError(`slug "${metadata.slug}" ist kein gueltiges kebab-case`);
  }
  if (body.trim().length < 200) {
    throw new GenerationParseError("body ist zu kurz");
  }

  return {
    metadata: {
      ...metadata,
      // Das Modell erfindet sonst ein Datum — die tatsächliche Generierungszeit ist die verlässliche Quelle.
      date: new Date().toISOString().slice(0, 10),
      howTo: metadata.howTo ?? undefined,
    },
    body,
  };
}

async function generateArticle(topic: string): Promise<{ metadata: WissenArticleMetadata; body: string }> {
  const existingSlugs = getExistingSlugs();
  const baseUserMessage = `Thema: ${topic}\n\nBereits vorhandene Artikel-Slugs (nicht duplizieren, ggf. anderen Blickwinkel wählen): ${
    existingSlugs.length > 0 ? existingSlugs.join(", ") : "keine"
  }\n\nSchreibe jetzt den Artikel.`;

  try {
    const article = await callModel(baseUserMessage);
    return finalizeArticle(article);
  } catch (err) {
    if (!(err instanceof GenerationParseError)) throw err;
    console.warn(`[generate-wissen-article] Erster Versuch fehlgeschlagen (${err.message}), retry...`);
    const retryMessage = `${baseUserMessage}\n\nWICHTIG: Der vorherige Versuch ist an diesem Fehler gescheitert: "${err.message}".`;
    const article = await callModel(retryMessage);
    return finalizeArticle(article);
  }
}

function writeArticleFile(article: { metadata: WissenArticleMetadata; body: string }): string {
  const { metadata, body } = article;
  const existingSlugs = new Set(getExistingSlugs());
  if (existingSlugs.has(metadata.slug)) {
    throw new Error(`Slug "${metadata.slug}" existiert bereits unter content/wissen/`);
  }

  fs.mkdirSync(WISSEN_DIR, { recursive: true });
  const filePath = path.join(WISSEN_DIR, `${metadata.slug}.mdx`);
  const fileContent = `export const metadata = ${JSON.stringify(metadata, null, 2)}\n\n${body}\n`;
  fs.writeFileSync(filePath, fileContent, "utf-8");
  return filePath;
}

function parseArgs(argv: string[]): { topic: string } {
  const topicIdx = argv.indexOf("--topic");
  if (topicIdx === -1 || !argv[topicIdx + 1]) {
    console.error('Verwendung: npx tsx scripts/generate-wissen-article.ts --topic "<Thema>"');
    process.exit(1);
  }
  return { topic: argv[topicIdx + 1] };
}

async function main() {
  const { topic } = parseArgs(process.argv.slice(2));
  console.log(`[generate-wissen-article] Generiere Artikel zum Thema: "${topic}"...`);
  const article = await generateArticle(topic);
  const filePath = writeArticleFile(article);
  console.log(`[generate-wissen-article] Fertig: ${filePath}`);
  console.log(`  Titel: ${article.metadata.title}`);
  console.log(`  Related Techniques: ${article.metadata.relatedTechniqueIds.join(", ")}`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("[generate-wissen-article] Fehlgeschlagen:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
