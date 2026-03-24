import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickWinsWidget } from "@/components/dashboard/quick-wins-widget";
import { getQuickWins } from "@/lib/quick-wins";
import Link from "next/link";
import { Video, TrendingUp, Trophy, Dumbbell } from "lucide-react";
import type { Metadata } from "next";
import type { Profile, Drill } from "@/lib/types";

import drillsData from "@/../data/drills.json";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: profile },
    { count: analysisCount },
    { count: matchCount },
    { data: recentAnalyses },
  ] = await Promise.all([
    supabase.from("pc_profiles").select("*").eq("id", user!.id).single(),
    supabase.from("pc_analyses").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("pc_match_stats").select("*", { count: "exact", head: true }).eq("user_id", user!.id),
    supabase.from("pc_analyses").select("id, stroke_type, overall_score, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5),
  ]);

  const displayName = profile?.display_name || user!.email?.split("@")[0] || "Spieler";
  const typedProfile = profile ? {
    ...profile,
    weaknesses: profile.weaknesses ?? [],
    strengths: profile.strengths ?? [],
    goals: profile.goals ?? [],
  } as Profile : null;
  const drills = drillsData as Drill[];
  const quickWins = typedProfile ? getQuickWins(typedProfile, drills) : [];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">
          Hallo, {displayName}!
        </h1>
        <p className="text-text-secondary">
          Willkommen bei PingCoach. Hier siehst du deinen Fortschritt.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Analysen", value: analysisCount || 0, icon: Video, color: "text-emerald" },
          { label: "Spiele", value: matchCount || 0, icon: Trophy, color: "text-cyan" },
          { label: "Avg. Score", value: "—", icon: TrendingUp, color: "text-warning" },
          { label: "Trainings", value: "0", icon: Dumbbell, color: "text-violet-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-surface-2 border-white/[0.06]">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-text-muted">{stat.label}</span>
              </div>
              <span className="text-2xl font-bold">{stat.value}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/analyse">
          <Card className="bg-surface-2 border-white/[0.06] hover:border-emerald/20 transition-colors cursor-pointer group">
            <CardContent className="pt-6 pb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald/10 flex items-center justify-center group-hover:bg-emerald/20 transition-colors">
                <Video className="w-6 h-6 text-emerald" />
              </div>
              <div>
                <h3 className="font-semibold">Neue Analyse</h3>
                <p className="text-sm text-text-secondary">
                  Video aufnehmen und Technik analysieren
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/matches">
          <Card className="bg-surface-2 border-white/[0.06] hover:border-cyan/20 transition-colors cursor-pointer group">
            <CardContent className="pt-6 pb-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan/10 flex items-center justify-center group-hover:bg-cyan/20 transition-colors">
                <Trophy className="w-6 h-6 text-cyan" />
              </div>
              <div>
                <h3 className="font-semibold">Spiel eintragen</h3>
                <p className="text-sm text-text-secondary">
                  Match-Ergebnis und Statistiken erfassen
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Wins */}
      <QuickWinsWidget quickWins={quickWins} />

      {/* Recent Analyses */}
      {recentAnalyses && recentAnalyses.length > 0 && (
        <Card className="bg-surface-2 border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base">Letzte Analysen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAnalyses.map((a) => (
                <Link
                  key={a.id}
                  href={`/analyse/${a.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Video className="w-4 h-4 text-text-muted" />
                    <span className="text-sm font-medium">
                      {formatStrokeType(a.stroke_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {a.overall_score && (
                      <span className={`text-sm font-bold ${
                        a.overall_score >= 75 ? "text-emerald" :
                        a.overall_score >= 50 ? "text-warning" : "text-destructive"
                      }`}>
                        {a.overall_score}/100
                      </span>
                    )}
                    <span className="text-xs text-text-muted">
                      {new Date(a.created_at).toLocaleDateString("de-DE")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {(!recentAnalyses || recentAnalyses.length === 0) && (
        <Card className="bg-surface-2 border-white/[0.06]">
          <CardContent className="py-12 text-center">
            <Video className="w-10 h-10 text-text-muted mx-auto mb-4" />
            <h3 className="font-semibold mb-1">Noch keine Analysen</h3>
            <p className="text-sm text-text-secondary mb-4">
              Starte deine erste Video-Analyse und erhalte KI-Feedback zu deiner Technik.
            </p>
            <Link href="/analyse">
              <Button className="bg-emerald hover:bg-emerald-dark text-white cursor-pointer">
                Erste Analyse starten
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatStrokeType(type: string | null): string {
  const labels: Record<string, string> = {
    vorhand_topspin: "Vorhand Topspin",
    rueckhand_topspin: "Rueckhand Topspin",
    vorhand_push: "Vorhand Push",
    rueckhand_push: "Rueckhand Push",
    vorhand_block: "Vorhand Block",
    rueckhand_block: "Rueckhand Block",
    vorhand_flip: "Vorhand Flip",
    rueckhand_flip: "Rueckhand Flip",
    aufschlag: "Aufschlag",
    sonstiges: "Sonstiges",
  };
  return type ? labels[type] || type : "Analyse";
}
