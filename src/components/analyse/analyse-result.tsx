"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  Dumbbell,
  Play,
  Pause,
  Star,
} from "lucide-react";
import type { StructuredFeedback, RallyFeedback } from "@/lib/types";

interface AnalyseResultProps {
  feedback: StructuredFeedback;
  analysisId: string | null;
  videoUrl?: string | null;
}

function parseTimestamp(ts: string): number {
  const parts = ts.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color =
    score >= 75 ? "text-emerald" : score >= 50 ? "text-warning" : "text-destructive";
  const bgColor =
    score >= 75 ? "bg-emerald/10" : score >= 50 ? "bg-warning/10" : "bg-destructive/10";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-16 h-16 rounded-full ${bgColor} flex items-center justify-center`}>
        <span className={`text-xl font-bold ${color}`}>{score}</span>
      </div>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? "text-emerald bg-emerald/10"
      : score >= 50
        ? "text-warning bg-warning/10"
        : "text-destructive bg-destructive/10";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      {score}
    </span>
  );
}

// --- Rally Thumbnail Generator ---

function useRallyThumbnails(videoUrl: string | null | undefined, rallies: RallyFeedback[]) {
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!videoUrl || rallies.length === 0) return;

    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    let cancelled = false;

    video.onloadeddata = async () => {
      canvas.width = 160;
      canvas.height = 90;

      const newThumbnails: Record<number, string> = {};

      for (const rally of rallies) {
        if (cancelled) break;
        const seekTime = parseTimestamp(rally.start_time) + 1; // 1s into rally
        video.currentTime = Math.min(seekTime, video.duration - 0.5);

        await new Promise<void>((resolve) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            newThumbnails[rally.number] = canvas.toDataURL("image/jpeg", 0.6);
            resolve();
          };
        });
      }

      if (!cancelled) setThumbnails(newThumbnails);
    };

    video.src = videoUrl;

    return () => {
      cancelled = true;
      video.remove();
    };
  }, [videoUrl, rallies]);

  return thumbnails;
}

// --- Rally Player View (Liimba-style) ---

function RallyPlayerView({
  rallies,
  videoUrl,
  feedback,
}: {
  rallies: RallyFeedback[];
  videoUrl: string;
  feedback: StructuredFeedback;
}) {
  const [activeRally, setActiveRally] = useState<RallyFeedback | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnails = useRallyThumbnails(videoUrl, rallies);

  const playRally = useCallback((rally: RallyFeedback) => {
    const video = videoRef.current;
    if (!video) return;

    setActiveRally(rally);
    const startSec = parseTimestamp(rally.start_time);
    video.currentTime = startSec;
    video.play();
    setIsPlaying(true);
  }, []);

  // Stop at rally end
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeRally) return;

    const endSec = parseTimestamp(activeRally.end_time);

    const handleTimeUpdate = () => {
      if (video.currentTime >= endSec) {
        video.pause();
        setIsPlaying(false);
      }
    };

    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("pause", handlePause);
    video.addEventListener("play", handlePlay);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("play", handlePlay);
    };
  }, [activeRally]);

  const overallScore = feedback.overall_score
    ?? (feedback.score_breakdown
      ? Math.round(
          Object.values(feedback.score_breakdown).reduce((a, b) => a + b, 0) /
          Object.values(feedback.score_breakdown).length
        )
      : null);

  return (
    <div className="space-y-5">
      {/* Main Layout: Video + Rally Sidebar */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Video Player */}
        <div className="flex-1 min-w-0">
          <Card className="bg-surface-2 border-white/[0.06]">
            <CardContent className="pt-4 pb-4">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full aspect-video object-contain rounded-lg bg-black"
                controls
                playsInline
                preload="auto"
              />
              {/* Active rally feedback */}
              {activeRally && (
                <div className="mt-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      Rally {activeRally.number}
                    </span>
                    <ScoreBadge score={activeRally.score} />
                    {activeRally.highlight && (
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    )}
                    <div className="flex gap-1 ml-auto flex-wrap">
                      {activeRally.stroke_types.map((st, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-text-muted"
                        >
                          {formatStrokeType(st)}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary">
                    {activeRally.feedback}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Overall Score */}
          <Card className="bg-surface-2 border-white/[0.06] glow-emerald mt-4">
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full bg-emerald/10 flex items-center justify-center border-2 border-emerald/30">
                    <span className="text-2xl font-bold text-emerald">
                      {overallScore ?? "—"}
                    </span>
                  </div>
                  <span className="text-xs text-text-muted mt-1">Gesamt</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold mb-1">Spiel-Analyse</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {feedback.match_summary || feedback.summary}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {rallies.length} Ballwechsel
                    {rallies.filter((r) => r.highlight).length > 0 &&
                      ` · ${rallies.filter((r) => r.highlight).length} Highlights`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rally Sidebar */}
        <div className="lg:w-72 shrink-0">
          <Card className="bg-surface-2 border-white/[0.06] h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Play className="w-3.5 h-3.5 text-cyan" />
                Ballwechsel ({rallies.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 max-h-[600px] overflow-y-auto">
              {rallies.map((rally) => (
                <button
                  key={rally.number}
                  onClick={() => playRally(rally)}
                  className={`w-full flex items-center gap-2 p-1.5 rounded-lg transition-colors cursor-pointer ${
                    activeRally?.number === rally.number
                      ? "bg-emerald/10 border border-emerald/30"
                      : "hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-24 h-14 rounded bg-black shrink-0 relative overflow-hidden">
                    {thumbnails[rally.number] ? (
                      <img
                        src={thumbnails[rally.number]}
                        alt={`Rally ${rally.number}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/[0.03]">
                        <Play className="w-4 h-4 text-text-muted" />
                      </div>
                    )}
                    {/* Play/Active indicator */}
                    {activeRally?.number === rally.number && isPlaying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Pause className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {rally.highlight && (
                      <Star className="absolute top-0.5 right-0.5 w-3 h-3 text-amber-400 fill-amber-400" />
                    )}
                  </div>

                  {/* Rally info */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-text-primary">
                        #{rally.number}
                      </span>
                      <ScoreBadge score={rally.score} />
                    </div>
                    <span className="text-[10px] text-text-muted block">
                      {rally.start_time} – {rally.end_time}
                    </span>
                    <div className="flex gap-0.5 mt-0.5 flex-wrap">
                      {rally.stroke_types.slice(0, 2).map((st, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1 py-0 rounded bg-white/[0.06] text-text-muted"
                        >
                          {formatStrokeType(st)}
                        </span>
                      ))}
                      {rally.stroke_types.length > 2 && (
                        <span className="text-[9px] text-text-muted">
                          +{rally.stroke_types.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

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
                <ScoreCircle key={key} score={value} label={formatLabel(key)} />
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
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
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
              <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
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
                <p className="text-sm text-text-secondary mb-2">{w.description}</p>
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

// --- Main Component ---

export function AnalyseResult({ feedback, analysisId, videoUrl }: AnalyseResultProps) {
  const hasRallies = feedback.rallies && feedback.rallies.length > 0;

  // Rally view (Liimba-style with video player + sidebar)
  if (hasRallies && videoUrl) {
    return (
      <RallyPlayerView
        rallies={feedback.rallies!}
        videoUrl={videoUrl}
        feedback={feedback}
      />
    );
  }

  // Single clip view (no rallies)
  const overallScore = feedback.overall_score
    ?? (feedback.score_breakdown
      ? Math.round(
          Object.values(feedback.score_breakdown).reduce((a, b) => a + b, 0) /
          Object.values(feedback.score_breakdown).length
        )
      : null);

  return (
    <div className="space-y-5">
      {/* Overall Score + Summary */}
      <Card className="bg-surface-2 border-white/[0.06] glow-emerald">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-emerald/10 flex items-center justify-center border-2 border-emerald/30">
                <span className="text-3xl font-bold text-emerald">
                  {overallScore ?? "—"}
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
                <ScoreCircle key={key} score={value} label={formatLabel(key)} />
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
                <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
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
              <div key={i} className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
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
                <p className="text-sm text-text-secondary mb-2">{w.description}</p>
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

function formatStrokeType(st: string): string {
  const labels: Record<string, string> = {
    vorhand_topspin: "VH Topspin",
    rueckhand_topspin: "RH Topspin",
    vorhand_push: "VH Push",
    rueckhand_push: "RH Push",
    vorhand_block: "VH Block",
    rueckhand_block: "RH Block",
    vorhand_flip: "VH Flip",
    rueckhand_flip: "RH Flip",
    aufschlag: "Aufschlag",
    sonstiges: "Sonstiges",
  };
  return labels[st] || st;
}
