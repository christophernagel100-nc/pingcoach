"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  Dumbbell,
} from "lucide-react";
import type { StructuredFeedback } from "@/lib/types";

interface AnalyseResultProps {
  feedback: StructuredFeedback;
  analysisId: string | null;
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color =
    score >= 75 ? "text-emerald" : score >= 50 ? "text-warning" : "text-destructive";
  const bgColor =
    score >= 75
      ? "bg-emerald/10"
      : score >= 50
        ? "bg-warning/10"
        : "bg-destructive/10";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-16 h-16 rounded-full ${bgColor} flex items-center justify-center`}
      >
        <span className={`text-xl font-bold ${color}`}>{score}</span>
      </div>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

export function AnalyseResult({ feedback, analysisId }: AnalyseResultProps) {
  return (
    <div className="space-y-5">
      {/* Overall Score */}
      <Card className="bg-surface-2 border-white/[0.06] glow-emerald">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-emerald/10 flex items-center justify-center border-2 border-emerald/30">
                <span className="text-3xl font-bold text-emerald">
                  {feedback.score_breakdown
                    ? Math.round(
                        Object.values(feedback.score_breakdown).reduce(
                          (a, b) => a + b, 0
                        ) / Object.values(feedback.score_breakdown).length
                      )
                    : "—"}
                </span>
              </div>
              <span className="text-sm text-text-muted mt-2">Gesamt</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Analyse-Ergebnis</h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                {feedback.summary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      {feedback.score_breakdown && (
        <Card className="bg-surface-2 border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan" />
              Detail-Bewertung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around">
              {Object.entries(feedback.score_breakdown).map(([key, value]) => (
                <ScoreCircle
                  key={key}
                  score={value}
                  label={formatLabel(key)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {feedback.strengths && feedback.strengths.length > 0 && (
        <Card className="bg-surface-2 border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald" />
              Das machst du gut
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {feedback.strengths.map((s, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-text-secondary"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald mt-1.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Weaknesses */}
      {feedback.weaknesses && feedback.weaknesses.length > 0 && (
        <Card className="bg-surface-2 border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Verbesserungspotenzial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedback.weaknesses.map((w, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{w.area}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      w.severity === "schwer"
                        ? "bg-destructive/10 text-destructive"
                        : w.severity === "mittel"
                          ? "bg-warning/10 text-warning"
                          : "bg-cyan/10 text-cyan"
                    }`}
                  >
                    {w.severity}
                  </span>
                </div>
                <p className="text-sm text-text-secondary mb-2">
                  {w.description}
                </p>
                <p className="text-sm text-emerald">
                  <Target className="w-3 h-3 inline mr-1" />
                  {w.fix_suggestion}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommended Drills */}
      {feedback.drills && feedback.drills.length > 0 && (
        <Card className="bg-surface-2 border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-emerald" />
              Empfohlene Uebungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {feedback.drills.map((d, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-emerald/5 border border-emerald/10"
                >
                  <span className="w-6 h-6 rounded-full bg-emerald/20 text-emerald flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <span className="font-medium text-sm">{d.name}</span>
                    <p className="text-sm text-text-secondary">{d.reason}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    koerperhaltung: "Haltung",
    schlagbewegung: "Schlag",
    beinarbeit: "Beine",
    timing: "Timing",
  };
  return labels[key] || key;
}
