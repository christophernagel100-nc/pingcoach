import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { analyseWithGemini } from "@/lib/gemini";

const analyseSchema = z.object({
  poseData: z.object({
    frames: z.array(z.object({
      timestamp: z.number(),
      keypoints: z.array(z.object({
        name: z.string(),
        x: z.number(),
        y: z.number(),
        z: z.number().optional(),
        visibility: z.number(),
      })),
    })),
    fps: z.number(),
    durationSeconds: z.number(),
    jointAngles: z.record(z.string(), z.array(z.number())).optional(),
    velocities: z.record(z.string(), z.array(z.number())).optional(),
  }),
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

    // Get player profile for context
    const { data: profile } = await supabase
      .from("pc_profiles")
      .select("level, weaknesses, player_type")
      .eq("id", user.id)
      .single();

    // Send to Gemini for analysis
    const aiResult = await analyseWithGemini({
      poseData: parsed.data.poseData,
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
        pose_data: parsed.data.poseData,
        ai_feedback: aiResult.summary,
        ai_feedback_structured: aiResult,
        overall_score: aiResult.overall_score,
        improvement_areas: aiResult.weaknesses?.map((w: { area: string }) => w.area) || [],
        video_duration_seconds: Math.round(parsed.data.poseData.durationSeconds),
        analysis_type: parsed.data.analysisType,
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
