import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  analyseWithGemini,
  GeminiConfigError,
  GeminiTimeoutError,
  GeminiParseError,
} from "@/lib/gemini";

// Vercel Hobby: max 60s
export const maxDuration = 60;

const rallyTimestampSchema = z.object({
  number: z.number(),
  startTime: z.string(),
  endTime: z.string(),
});

const analyseSchema = z.object({
  storagePath: z.string().min(1),
  mimeType: z.string().startsWith("video/"),
  strokeType: z.string().optional(),
  drillType: z.string().optional(),
  analysisType: z.enum(["einzelschlag", "sequenz", "match"]).default("einzelschlag"),
  videoDurationSeconds: z.number().optional(),
  detectedRallies: z.array(rallyTimestampSchema).optional(),
});

export async function POST(req: NextRequest) {
  let storagePath: string | null = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = analyseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ungueltige Daten", details: parsed.error.issues },
        { status: 400 }
      );
    }

    storagePath = parsed.data.storagePath;

    // Verify the storage path belongs to this user
    if (!storagePath.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
    }

    // Get player profile for context
    const { data: profile } = await supabase
      .from("pc_profiles")
      .select("level, weaknesses, player_type")
      .eq("id", user.id)
      .single();

    // Download video from Supabase Storage
    console.log("[Analyse] Downloading from Storage:", storagePath);
    const { data: videoData, error: downloadError } = await supabase
      .storage
      .from("pc-videos")
      .download(storagePath);

    if (downloadError || !videoData) {
      console.error("[Storage Download Error]:", downloadError);
      return NextResponse.json({ error: "Video nicht gefunden" }, { status: 404 });
    }

    const videoBuffer = Buffer.from(await videoData.arrayBuffer());
    console.log("[Analyse] Video downloaded, size:", videoBuffer.length, "bytes");

    // Server-side size check
    if (videoBuffer.length > 50 * 1024 * 1024) {
      cleanupStorage(supabase, storagePath);
      return NextResponse.json({ error: "Video zu gross (max. 50 MB)" }, { status: 413 });
    }

    console.log("[Analyse] Sending to Gemini...", {
      size: videoBuffer.length,
      mimeType: parsed.data.mimeType,
      duration: parsed.data.videoDurationSeconds,
      drillType: parsed.data.drillType,
      rallies: parsed.data.detectedRallies?.length ?? 0,
      mode: videoBuffer.length < 20 * 1024 * 1024 ? "inline" : "fileAPI",
    });

    // Send to Gemini for analysis
    const aiResult = await analyseWithGemini({
      videoBuffer,
      videoMimeType: parsed.data.mimeType,
      strokeType: parsed.data.strokeType,
      playerLevel: profile?.level,
      playerWeaknesses: profile?.weaknesses,
      drillType: parsed.data.drillType,
      analysisType: parsed.data.analysisType,
      videoDurationSeconds: parsed.data.videoDurationSeconds,
      detectedRallies: parsed.data.detectedRallies,
    });

    console.log("[Analyse] Gemini response received, saving to DB...");

    // Save to database
    const { data: analysis, error: dbError } = await supabase
      .from("pc_analyses")
      .insert({
        user_id: user.id,
        stroke_type: parsed.data.strokeType || null,
        pose_data: {},
        ai_feedback: (aiResult as { summary?: string }).summary || "",
        ai_feedback_structured: aiResult,
        overall_score: (aiResult as { overall_score?: number }).overall_score ?? null,
        improvement_areas: Array.isArray((aiResult as { weaknesses?: { area: string }[] }).weaknesses)
          ? (aiResult as { weaknesses: { area: string }[] }).weaknesses.map((w) => w.area)
          : [],
        video_duration_seconds: parsed.data.videoDurationSeconds ? Math.round(parsed.data.videoDurationSeconds) : null,
        analysis_type: parsed.data.analysisType,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Analyse DB Error]:", dbError);
      return NextResponse.json({ error: "Fehler beim Speichern der Analyse" }, { status: 500 });
    }

    // Cleanup video from storage (fire-and-forget)
    cleanupStorage(supabase, storagePath);

    console.log("[Analyse] Complete, id:", analysis.id);

    return NextResponse.json({
      id: analysis.id,
      feedback: aiResult,
    });
  } catch (error) {
    // Cleanup video on any failure
    if (storagePath) {
      try {
        const supabase = await createClient();
        cleanupStorage(supabase, storagePath);
      } catch { /* ignore cleanup errors */ }
    }

    if (error instanceof GeminiConfigError) {
      console.error("[Analyse Config Error]:", error.message);
      return NextResponse.json({ error: "Video-Analyse ist aktuell nicht verfuegbar" }, { status: 503 });
    }
    if (error instanceof GeminiTimeoutError) {
      console.error("[Analyse Timeout]:", error.message);
      return NextResponse.json({ error: "Die Analyse hat zu lange gedauert. Bitte versuche ein kuerzeres Video." }, { status: 504 });
    }
    if (error instanceof GeminiParseError) {
      console.error("[Analyse Parse Error]:", error.message);
      return NextResponse.json({ error: "Die KI-Antwort konnte nicht verarbeitet werden. Bitte versuche es erneut." }, { status: 502 });
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error("[Analyse Error]:", message);
    return NextResponse.json({ error: "Analyse fehlgeschlagen. Bitte versuche es erneut." }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cleanupStorage(supabase: any, storagePath: string) {
  supabase.storage.from("pc-videos").remove([storagePath]).catch((err: unknown) => {
    console.warn("[Analyse] Video-Cleanup fehlgeschlagen:", err);
  });
}
