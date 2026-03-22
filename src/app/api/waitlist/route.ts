import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const waitlistSchema = z.object({
  email: z.string().email("Bitte gib eine gueltige E-Mail-Adresse ein"),
  player_level: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = waitlistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase
      .from("pc_waitlist")
      .insert({
        email: parsed.data.email.toLowerCase(),
        player_level: parsed.data.player_level || null,
        source: parsed.data.source || "landing_page",
      });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Diese E-Mail ist bereits auf der Warteliste" },
          { status: 409 }
        );
      }
      console.error("[Waitlist Error]:", error);
      return NextResponse.json(
        { error: "Interner Serverfehler" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Waitlist Error]:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler" },
      { status: 500 }
    );
  }
}
