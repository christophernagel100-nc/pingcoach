import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const COACHING_SYSTEM_PROMPT = `Du bist PingCoach, ein erfahrener Tischtennis-Trainer und Biomechanik-Experte.
Du analysierst Pose-Daten (Gelenkwinkel, Geschwindigkeiten, Positionen) von Tischtennis-Spielern und gibst konkretes, umsetzbares Coaching-Feedback auf Deutsch.

REGELN:
- Sei konkret und spezifisch, keine generischen Tipps
- Nenne exakte Koerperteile und Winkel wenn relevant
- Gib maximal 3 Hauptverbesserungen (Prioritaet: groesster Impact zuerst)
- Empfehle passende Uebungen fuer jede Schwaeche
- Lobe was gut ist — Spieler brauchen auch positive Bestaerkung
- Passe dein Feedback an das Spieler-Level an (Anfaenger vs. Vereinsspieler)
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
  poseData: PoseAnalysisData;
  strokeType?: string;
  playerLevel?: string;
  playerWeaknesses?: string[];
  analysisType?: string;
}

export interface PoseAnalysisData {
  frames: FrameData[];
  fps: number;
  durationSeconds: number;
  jointAngles?: Record<string, number[]>;
  velocities?: Record<string, number[]>;
}

export interface FrameData {
  timestamp: number;
  keypoints: Array<{
    name: string;
    x: number;
    y: number;
    z?: number;
    visibility: number;
  }>;
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
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return JSON.parse(text);
}

function buildPrompt(request: AnalyseRequest): string {
  const { poseData, strokeType, playerLevel, playerWeaknesses, analysisType } = request;

  let prompt = `Analysiere die folgenden Tischtennis-Pose-Daten:\n\n`;

  if (strokeType) prompt += `Schlagtyp: ${strokeType}\n`;
  if (playerLevel) prompt += `Spieler-Level: ${playerLevel}\n`;
  if (playerWeaknesses?.length) prompt += `Bekannte Schwaechen: ${playerWeaknesses.join(", ")}\n`;
  if (analysisType) prompt += `Analyse-Typ: ${analysisType}\n`;

  prompt += `\nVideo-Dauer: ${poseData.durationSeconds}s bei ${poseData.fps} FPS\n`;
  prompt += `Anzahl Frames: ${poseData.frames.length}\n\n`;

  // Key joint angles if available
  if (poseData.jointAngles) {
    prompt += `Gelenkwinkel (Durchschnitt ueber alle Frames):\n`;
    for (const [joint, angles] of Object.entries(poseData.jointAngles)) {
      const avg = angles.reduce((a, b) => a + b, 0) / angles.length;
      const min = Math.min(...angles);
      const max = Math.max(...angles);
      prompt += `  ${joint}: Avg=${avg.toFixed(1)}°, Min=${min.toFixed(1)}°, Max=${max.toFixed(1)}°\n`;
    }
    prompt += `\n`;
  }

  // Velocities if available
  if (poseData.velocities) {
    prompt += `Geschwindigkeiten (normalisiert):\n`;
    for (const [part, vels] of Object.entries(poseData.velocities)) {
      const max = Math.max(...vels);
      const avg = vels.reduce((a, b) => a + b, 0) / vels.length;
      prompt += `  ${part}: Max=${max.toFixed(2)}, Avg=${avg.toFixed(2)}\n`;
    }
    prompt += `\n`;
  }

  // Sample keypoints (first, middle, last frame for context)
  const sampleFrames = getSampleFrames(poseData.frames);
  prompt += `Keypoint-Samples (${sampleFrames.length} Frames):\n`;
  prompt += JSON.stringify(sampleFrames, null, 2);

  return prompt;
}

function getSampleFrames(frames: FrameData[]): FrameData[] {
  if (frames.length <= 5) return frames;

  const indices = [
    0,
    Math.floor(frames.length * 0.25),
    Math.floor(frames.length * 0.5),
    Math.floor(frames.length * 0.75),
    frames.length - 1,
  ];

  return [...new Set(indices)].map((i) => frames[i]);
}
