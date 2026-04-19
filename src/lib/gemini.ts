import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { GenerateContentResult } from "@google/generative-ai";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

// Lazy initialization — crashes at import if GEMINI_API_KEY is missing
let _genAI: GoogleGenerativeAI | null = null;
let _fileManager: GoogleAIFileManager | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new GeminiConfigError("GEMINI_API_KEY ist nicht konfiguriert");
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
}

function getFileManager(): GoogleAIFileManager {
  if (!_fileManager) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new GeminiConfigError("GEMINI_API_KEY ist nicht konfiguriert");
    _fileManager = new GoogleAIFileManager(key);
  }
  return _fileManager;
}

// Error classes for specific failure modes
export class GeminiConfigError extends Error {
  constructor(msg: string) { super(msg); this.name = "GeminiConfigError"; }
}
export class GeminiTimeoutError extends Error {
  constructor(msg: string) { super(msg); this.name = "GeminiTimeoutError"; }
}
export class GeminiParseError extends Error {
  constructor(msg: string) { super(msg); this.name = "GeminiParseError"; }
}

// --- Prompts ---

const SINGLE_STROKE_PROMPT = `Du bist PingCoach, ein erfahrener Tischtennis-Trainer und Biomechanik-Experte.
Du analysierst ein kurzes Video eines einzelnen Schlags oder einer kurzen Uebungssequenz.

REGELN:
- Sei konkret und spezifisch, keine generischen Tipps
- Nenne exakte Koerperteile und Bewegungen die du im Video siehst
- Gib maximal 3 Hauptverbesserungen (Prioritaet: groesster Impact zuerst)
- Empfehle passende Uebungen fuer jede Schwaeche
- Lobe was gut ist — Spieler brauchen auch positive Bestaerkung
- Passe dein Feedback an das Spieler-Level an
- Achte besonders auf: Schlaegerhaltung, Koerperhaltung, Beinarbeit, Ausschwung, Timing, Gewichtsverlagerung

ANTWORT-FORMAT (valides JSON):
{
  "summary": "1-2 Saetze Gesamtbewertung",
  "overall_score": 0-100,
  "strengths": ["Staerke 1", "Staerke 2"],
  "weaknesses": [
    {
      "area": "z.B. Ellbogen-Position",
      "description": "Was genau falsch ist",
      "severity": "leicht|mittel|schwer",
      "fix_suggestion": "Konkrete Anleitung zur Verbesserung"
    }
  ],
  "drills": [
    {
      "name": "Name der Uebung",
      "reason": "Warum diese Uebung hilft"
    }
  ],
  "score_breakdown": {
    "koerperhaltung": 0-100,
    "schlagbewegung": 0-100,
    "beinarbeit": 0-100,
    "timing": 0-100
  }
}`;

const RALLY_ANALYSIS_PROMPT = `Du bist PingCoach, ein erfahrener Tischtennis-Trainer und Biomechanik-Experte.
Du analysierst ein Tischtennis-Video und identifizierst JEDEN einzelnen Ballwechsel.

SCHRITT 1 — BALLWECHSEL ERKENNEN (WICHTIGSTE AUFGABE):
Schau dir das GESAMTE Video sehr genau an, Sekunde fuer Sekunde.
Ein Ballwechsel (Rally) ist definiert als:
- BEGINN: Der Moment in dem ein Spieler den Ball zum Aufschlag hochwirft ODER der Ball ins Spiel kommt
- ENDE: Der Moment in dem der Punkt vorbei ist (Ball im Netz, Ball neben dem Tisch, Ball wird nicht zurueckgespielt)
- ZWISCHEN den Rallys: Pausen wo Spieler Ball aufheben, sich vorbereiten, kurz warten — das ist KEINE Rally

HAEUFIGE FEHLER DIE DU VERMEIDEN MUSST:
- Ueberspringe KEINE Rallys — zaehle JEDEN Ballwechsel, auch kurze (1-2 Schlaege)
- Fasse NICHT mehrere Rallys zu einer zusammen
- Schneide Rallys NICHT zu kurz ab — der Zeitraum muss den GESAMTEN Ballwechsel abdecken
- Verwechsle Pausen/Ballaufheben NICHT mit Rallys
- Ein typisches Trainingsvideo von 1-2 Minuten enthaelt normalerweise 6-15 Ballwechsel

SCHRITT 2 — SCHLAGTYPEN KORREKT ERKENNEN:
Unterscheide genau zwischen diesen Schlaegen anhand der BEWEGUNG:
- TOPSPIN: Schnelle Vorwaerts-Aufwaerts-Bewegung, Schlaeger geht von unten-hinten nach oben-vorne, viel Armgeschwindigkeit, explosiv
- PUSH/SCHUPF: Kurze, kontrollierte Vorwaerts-Abwaerts-Bewegung, Schlaeger bleibt relativ offen, langsam, unter Tischhoehe
- BLOCK: Minimale Bewegung, Schlaeger wird fast nur hingehalten, Ball prallt ab, kein Schwung
- FLIP: Kurze Handgelenkbewegung ueber dem Tisch bei kurzem Ball
- AUFSCHLAG: Ballwurf + Schlag, immer am Anfang einer Rally
Wenn zwei Spieler sich Topspin-Baelle zuspielen, ist das "vorhand_topspin" oder "rueckhand_topspin" — NICHT Schupf/Push.

SCHRITT 3 — ANALYSE:
Fuer jeden Ballwechsel: konkretes Feedback zu Technik, Taktik oder Positionierung.
Markiere besonders gute oder lehrreiche Rallys als "highlight: true".
Passe dein Feedback an das Spieler-Level an.

ANTWORT-FORMAT (valides JSON):
{
  "match_summary": "Ueberblick ueber das Spiel/Training in 2-3 Saetzen",
  "summary": "1 Satz Kernaussage",
  "overall_score": 0-100,
  "rallies": [
    {
      "number": 1,
      "start_time": "00:05",
      "end_time": "00:12",
      "stroke_types": ["vorhand_topspin", "rueckhand_topspin"],
      "score": 0-100,
      "feedback": "Konkretes Feedback zu dieser Rally",
      "highlight": false
    }
  ],
  "strengths": ["Staerke 1", "Staerke 2"],
  "weaknesses": [
    {
      "area": "z.B. Rueckhand-Topspin",
      "description": "Was genau verbessert werden muss",
      "severity": "leicht|mittel|schwer",
      "fix_suggestion": "Konkrete Anleitung"
    }
  ],
  "drills": [
    {
      "name": "Name der Uebung",
      "reason": "Warum diese Uebung hilft"
    }
  ],
  "score_breakdown": {
    "koerperhaltung": 0-100,
    "schlagbewegung": 0-100,
    "beinarbeit": 0-100,
    "timing": 0-100
  }
}`;

// --- Main Analysis Function ---

export interface AnalyseRequest {
  videoBuffer: Buffer;
  videoMimeType: string;
  strokeType?: string;
  playerLevel?: string;
  playerWeaknesses?: string[];
  analysisType?: string;
  videoDurationSeconds?: number;
}

export async function analyseWithGemini(request: AnalyseRequest) {
  const isRallyAnalysis = (request.videoDurationSeconds ?? 0) > 30;

  const model = getGenAI().getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
    systemInstruction: isRallyAnalysis ? RALLY_ANALYSIS_PROMPT : SINGLE_STROKE_PROMPT,
  });

  const prompt = buildPrompt(request, isRallyAnalysis);

  // < 20MB: inline base64 (faster, no upload/polling overhead)
  // >= 20MB: File API (required for large files)
  const INLINE_THRESHOLD = 20 * 1024 * 1024;

  if (request.videoBuffer.length < INLINE_THRESHOLD) {
    console.log("[Gemini] Inline mode, size:", request.videoBuffer.length, "bytes");
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: request.videoBuffer.toString("base64"),
          mimeType: request.videoMimeType,
        },
      },
    ]);
    return safeParseGeminiResponse(result);
  }

  // Large files: use File API with upload + polling
  console.log("[Gemini] File API mode, size:", request.videoBuffer.length, "bytes");
  const uploadResult = await uploadVideoToFileAPI(request.videoBuffer, request.videoMimeType);

  const result = await model.generateContent([
    prompt,
    {
      fileData: {
        fileUri: uploadResult.uri,
        mimeType: uploadResult.mimeType,
      },
    },
  ]);

  return safeParseGeminiResponse(result);
}

// --- Safe JSON Parsing ---

function safeParseGeminiResponse(result: GenerateContentResult): Record<string, unknown> {
  let text: string;
  try {
    text = result.response.text();
  } catch (err) {
    throw new GeminiParseError(`Gemini hat keine Antwort geliefert: ${err}`);
  }

  if (!text || text.trim().length === 0) {
    throw new GeminiParseError("Gemini hat eine leere Antwort geliefert");
  }

  // Strip markdown fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    return validateFeedback(parsed);
  } catch {
    // Fallback: extract first JSON object
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return validateFeedback(parsed);
      } catch {
        // Fall through to error
      }
    }
    throw new GeminiParseError(
      `Gemini hat ungueltiges JSON geliefert. Anfang der Antwort: "${text.slice(0, 200)}"`
    );
  }
}

function validateFeedback(data: Record<string, unknown>): Record<string, unknown> {
  // Ensure required fields exist with sensible defaults
  if (!data.summary || typeof data.summary !== "string") {
    data.summary = "Analyse konnte nicht vollstaendig ausgewertet werden.";
  }
  if (typeof data.overall_score !== "number" || data.overall_score < 0 || data.overall_score > 100) {
    data.overall_score = 50;
  }
  if (!Array.isArray(data.strengths)) {
    data.strengths = [];
  }
  if (!Array.isArray(data.weaknesses)) {
    data.weaknesses = [];
  }
  if (!Array.isArray(data.drills)) {
    data.drills = [];
  }
  if (!data.score_breakdown || typeof data.score_breakdown !== "object") {
    data.score_breakdown = { koerperhaltung: 50, schlagbewegung: 50, beinarbeit: 50, timing: 50 };
  }
  return data;
}

// --- File API Upload with bounded polling ---

const MAX_POLL_ATTEMPTS = 40;

async function uploadVideoToFileAPI(buffer: Buffer, mimeType: string) {
  if (buffer.length > 50 * 1024 * 1024) {
    throw new Error("Video zu gross fuer die Analyse (max. 50 MB)");
  }

  const tmpPath = path.join(os.tmpdir(), `pingcoach-${crypto.randomUUID()}.mp4`);
  fs.writeFileSync(tmpPath, buffer);

  try {
    const uploadResult = await getFileManager().uploadFile(tmpPath, {
      mimeType,
      displayName: `PingCoach Analyse ${new Date().toISOString()}`,
    });

    // Poll for processing completion with max attempts
    let file = uploadResult.file;
    let attempts = 0;
    while (file.state === "PROCESSING") {
      if (++attempts > MAX_POLL_ATTEMPTS) {
        throw new GeminiTimeoutError("Video-Verarbeitung bei Gemini dauert zu lange. Bitte versuche es mit einem kuerzeren Video.");
      }
      await new Promise((r) => setTimeout(r, 1000));
      file = await getFileManager().getFile(file.name);
    }

    if (file.state === "FAILED") {
      throw new Error("Video-Verarbeitung bei Gemini fehlgeschlagen. Bitte versuche ein anderes Video-Format.");
    }

    return { uri: file.uri, mimeType: file.mimeType };
  } finally {
    // Always clean up temp file
    try { fs.unlinkSync(tmpPath); } catch { /* ignore cleanup errors */ }
  }
}

// --- Prompt Builder ---

function buildPrompt(request: AnalyseRequest, isRallyAnalysis: boolean): string {
  const { strokeType, playerLevel, playerWeaknesses, analysisType, videoDurationSeconds } = request;

  let prompt: string;

  if (isRallyAnalysis) {
    const expectedRallies = videoDurationSeconds
      ? `Bei ${Math.round(videoDurationSeconds)} Sekunden Video erwarte ich ca. ${Math.max(3, Math.round(videoDurationSeconds / 10))}-${Math.round(videoDurationSeconds / 6)} Ballwechsel.`
      : "";

    prompt = `Analysiere das folgende Tischtennis-Video und identifiziere JEDEN einzelnen Ballwechsel.
${expectedRallies}
Schau dir das Video Sekunde fuer Sekunde an. Ueberspringe NICHTS.\n\n`;
  } else {
    prompt = "Analysiere den folgenden Tischtennis-Schlag:\n\n";
  }

  if (strokeType && !isRallyAnalysis) prompt += `Schlagtyp: ${strokeType}\n`;
  if (playerLevel) prompt += `Spieler-Level: ${playerLevel}\n`;
  if (playerWeaknesses?.length) prompt += `Bekannte Schwaechen: ${playerWeaknesses.join(", ")}\n`;
  if (analysisType) prompt += `Analyse-Typ: ${analysisType}\n`;
  if (videoDurationSeconds) prompt += `Video-Laenge: ${Math.round(videoDurationSeconds)} Sekunden\n`;

  prompt += `\nBitte analysiere die Technik im Video und achte besonders auf Koerperhaltung, Schlagbewegung, Beinarbeit und Timing.`;

  return prompt;
}
