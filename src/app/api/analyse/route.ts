import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { analyseWithGemini } from "@/lib/gemini";

// Vercel Hobby: max 60s, brauchen wir fuer Storage-Download + Gemini
export const maxDuration = 60;

const analyseSchema = z.object({
  storagePath: z.string().min(1),
  mimeType: z.string().startsWith("video/"),
  strokeType: z.string().optional(),
  analysisType: z.enum(["einzelschlag", "sequenz", "match"]).default("einzelschlag"),
});

export async function POST(req: NextRequest) {
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

    // Verify the storage path belongs to this user
    if (!parsed.data.storagePath.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
    }

    // Get player profile for context
    const { data: profile } = await supabase
      .from("pc_profiles")
      .select("level, weaknesses, player_type")
      .eq("id", user.id)
      .single();

    // Download video from Supabase Storage
    console.log("[Analyse] Downloading from Storage:", parsed.data.storagePath);
    const { data: videoData, error: downloadError } = await supabase
      .storage
      .from("pc-videos")
      .download(parsed.data.storagePath);

    if (downloadError || !videoData) {
      console.error("[Storage Download Error]:", downloadError);
      return NextResponse.json({ error: "Video nicht gefunden" }, { status: 404 });
    }

    const videoBuffer = Buffer.from(await videoData.arrayBuffer());
    console.log("[Analyse] Video downloaded, size:", videoBuffer.length, "bytes. Sending to Gemini...");

    // Send to Gemini for analysis
    const aiResult = await analyseWithGemini({
      videoBuffer,
      videoMimeType: parsed.data.mimeType,
      strokeType: parsed.data.strokeType,
      playerLevel: profile?.level,
      playerWeaknesses: profile?.weaknesses,
      analysisType: parsed.data.analysisType,
    });

    // Save to database
    const { data: analysis, error: dbError } = await supabase
      .from("pc_analyses")
      .insert({
        user_id: user.id,
        stroke_type: parsed.data.strokeType || null,
        pose_data: null,
        ai_feedback: aiResult.summary,
        ai_feedback_structured: aiResult,
        overall_score: aiResult.overall_score,
        improvement_areas: aiResult.weaknesses?.map((w: { area: string }) => w.area) || [],
        video_duration_seconds: null,
        analysis_type: parsed.data.analysisType,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Analyse DB Error]:", dbError);
      return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
    }

    // Cleanup: delete video from storage
    await supabase.storage.from("pc-videos").remove([parsed.data.storagePath]);

    return NextResponse.json({
      id: analysis.id,
      feedback: aiResult,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Analyse Error]:", message);
    return NextResponse.json({ error: `Analyse fehlgeschlagen: ${message}` }, { status: 500 });
  }
}
