import { GoogleAIFileManager } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import os from "os";
import path from "path";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY!);

const COACHING_SYSTEM_PROMPT = `Du bist PingCoach, ein erfahrener Tischtennis-Trainer und Biomechanik-Experte.
Du analysierst Videos von Tischtennis-Spielern und gibst konkretes, umsetzbares Coaching-Feedback auf Deutsch.

REGELN:
- Sei konkret und spezifisch, keine generischen Tipps
- Nenne exakte Koerperteile und Bewegungen die du im Video siehst
- Gib maximal 3 Hauptverbesserungen (Prioritaet: groesster Impact zuerst)
- Empfehle passende Uebungen fuer jede Schwaeche
- Lobe was gut ist — Spieler brauchen auch positive Bestaerkung
- Passe dein Feedback an das Spieler-Level an (Anfaenger vs. Vereinsspieler)
- Achte besonders auf: Schlaegerhaltung, Koerperhaltung, Beinarbeit, Ausschwung, Timing, Gewichtsverlagerung
- Antworte IMMER im folgenden JSON-Format

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

export interface AnalyseRequest {
  videoBuffer: Buffer;
  videoMimeType: string;
  strokeType?: string;
  playerLevel?: string;
  playerWeaknesses?: string[];
  analysisType?: string;
}

export async function analyseWithGemini(request: AnalyseRequest) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
    },
    systemInstruction: COACHING_SYSTEM_PROMPT,
  });

  const prompt = buildPrompt(request);

  // For videos > 15MB use File API, otherwise inline
  if (request.videoBuffer.length > 15 * 1024 * 1024) {
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
    return JSON.parse(result.response.text());
  }

  // Inline for smaller videos
  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        data: request.videoBuffer.toString("base64"),
        mimeType: request.videoMimeType,
      },
    },
  ]);

  return JSON.parse(result.response.text());
}

async function uploadVideoToFileAPI(buffer: Buffer, mimeType: string) {
  const tmpPath = path.join(os.tmpdir(), `pingcoach-${Date.now()}.mp4`);
  fs.writeFileSync(tmpPath, buffer);

  try {
    const uploadResult = await fileManager.uploadFile(tmpPath, {
      mimeType,
      displayName: `PingCoach Analyse ${new Date().toISOString()}`,
    });

    // Wait for processing
    let file = uploadResult.file;
    while (file.state === "PROCESSING") {
      await new Promise((r) => setTimeout(r, 1000));
      const check = await fileManager.getFile(file.name);
      file = check;
    }

    if (file.state === "FAILED") {
      throw new Error("Video-Verarbeitung bei Gemini fehlgeschlagen");
    }

    return { uri: file.uri, mimeType: file.mimeType };
  } finally {
    fs.unlinkSync(tmpPath);
  }
}

function buildPrompt(request: AnalyseRequest): string {
  const { strokeType, playerLevel, playerWeaknesses, analysisType } = request;

  let prompt = `Analysiere das folgende Tischtennis-Video:\n\n`;

  if (strokeType) prompt += `Schlagtyp: ${strokeType}\n`;
  if (playerLevel) prompt += `Spieler-Level: ${playerLevel}\n`;
  if (playerWeaknesses?.length) prompt += `Bekannte Schwaechen: ${playerWeaknesses.join(", ")}\n`;
  if (analysisType) prompt += `Analyse-Typ: ${analysisType}\n`;

  prompt += `\nBitte analysiere die Technik im Video und achte besonders auf Koerperhaltung, Schlagbewegung, Beinarbeit und Timing.`;

  return prompt;
}
