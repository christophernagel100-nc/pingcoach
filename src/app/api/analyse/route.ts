import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyseWithGemini } from "@/lib/gemini";

const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const formData = await req.formData();
    const videoFile = formData.get("video") as File | null;
    const strokeType = formData.get("strokeType") as string | null;
    const analysisType = (formData.get("analysisType") as string) || "einzelschlag";

    if (!videoFile) {
      return NextResponse.json({ error: "Kein Video hochgeladen" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(videoFile.type)) {
      return NextResponse.json({ error: "Ungültiges Video-Format" }, { status: 400 });
    }

    if (videoFile.size > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: "Video darf maximal 100 MB gross sein" }, { status: 400 });
    }

    // Get player profile for context
    const { data: profile } = await supabase
      .from("pc_profiles")
      .select("level, weaknesses, player_type")
      .eq("id", user.id)
      .single();

    // Convert File to Buffer for Gemini
    const arrayBuffer = await videoFile.arrayBuffer();
    const videoBuffer = Buffer.from(arrayBuffer);

    // Send to Gemini for analysis
    const aiResult = await analyseWithGemini({
      videoBuffer,
      videoMimeType: videoFile.type,
      strokeType: strokeType || undefined,
      playerLevel: profile?.level,
      playerWeaknesses: profile?.weaknesses,
      analysisType,
    });

    // Save to database
    const { data: analysis, error: dbError } = await supabase
      .from("pc_analyses")
      .insert({
        user_id: user.id,
        stroke_type: strokeType || null,
        pose_data: null,
        ai_feedback: aiResult.summary,
        ai_feedback_structured: aiResult,
        overall_score: aiResult.overall_score,
        improvement_areas: aiResult.weaknesses?.map((w: { area: string }) => w.area) || [],
        video_duration_seconds: null,
        analysis_type: analysisType,
      })
      .select()
      .single();

    if (dbError) {
      console.error("[Analyse DB Error]:", dbError);
      return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
    }

    return NextResponse.json({
      id: analysis.id,
      feedback: aiResult,
    });
  } catch (error) {
    console.error("[Analyse Error]:", error);
    return NextResponse.json({ error: "Analyse fehlgeschlagen" }, { status: 500 });
  }
}
