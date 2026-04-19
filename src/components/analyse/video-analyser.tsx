"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Video, Loader2, Camera, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { StructuredFeedback } from "@/lib/types";
import { AnalyseResult } from "./analyse-result";

const STROKE_TYPES = [
  { value: "vorhand_topspin", label: "Vorhand Topspin" },
  { value: "rueckhand_topspin", label: "Rueckhand Topspin" },
  { value: "vorhand_push", label: "Vorhand Push" },
  { value: "rueckhand_push", label: "Rueckhand Push" },
  { value: "aufschlag", label: "Aufschlag" },
  { value: "vorhand_block", label: "Vorhand Block" },
  { value: "rueckhand_block", label: "Rueckhand Block" },
  { value: "vorhand_flip", label: "Vorhand Flip" },
  { value: "rueckhand_flip", label: "Rueckhand Flip" },
  { value: "sonstiges", label: "Sonstiges / Ganzes Spiel" },
];

const MAX_FILE_SIZE_MB = 50;
const MAX_DURATION_SECONDS = 300; // 5 Minuten
const MAX_RETRIES = 2;
const CLIENT_TIMEOUT_MS = 55_000; // 55s, knapp unter Vercel 60s

type AnalyseStep = "upload" | "uploading" | "analysing" | "error" | "result";

export function VideoAnalyser() {
  const [step, setStep] = useState<AnalyseStep>("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [strokeType, setStrokeType] = useState("vorhand_topspin");
  const [result, setResult] = useState<StructuredFeedback | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [lastStoragePath, setLastStoragePath] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed timer for analysing step
  useEffect(() => {
    if (step === "analysing") {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Bitte waehle eine Video-Datei aus");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Video darf maximal ${MAX_FILE_SIZE_MB} MB gross sein`);
      return;
    }

    // Check video duration via metadata
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      if (video.duration > MAX_DURATION_SECONDS) {
        toast.error(
          `Video darf maximal ${Math.floor(MAX_DURATION_SECONDS / 60)} Minuten lang sein. Schneide dein Video auf die relevanten Ballwechsel zu.`
        );
        return;
      }
      setVideoDuration(video.duration);
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setResult(null);
      setAnalysisId(null);
      setErrorMessage(null);
      setRetryCount(0);
    };
    video.onerror = () => {
      // Can't read metadata — allow upload, duration will be null
      URL.revokeObjectURL(video.src);
      setVideoDuration(null);
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setResult(null);
      setAnalysisId(null);
      setErrorMessage(null);
      setRetryCount(0);
    };
    video.src = URL.createObjectURL(file);
  }, []);

  const runAnalysis = useCallback(async (storagePath: string, mimeType: string) => {
    setStep("analysing");
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storagePath,
          mimeType,
          strokeType,
          analysisType: (videoDuration ?? 0) > 30 ? "match" : "einzelschlag",
          videoDurationSeconds: videoDuration,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Analyse fehlgeschlagen");
      }

      const data = await res.json();
      setResult(data.feedback);
      setAnalysisId(data.id);
      setStep("result");
      toast.success("Analyse abgeschlossen!");
    } catch (err) {
      clearTimeout(timeoutId);

      let message: string;
      if (err instanceof DOMException && err.name === "AbortError") {
        message = "Die Analyse hat zu lange gedauert. Bitte versuche ein kuerzeres Video.";
      } else {
        message = err instanceof Error ? err.message : "Analyse fehlgeschlagen";
      }

      console.error("Analyse error:", err);
      setErrorMessage(message);
      setStep("error");
    }
  }, [strokeType, videoDuration]);

  const handleAnalyse = useCallback(async () => {
    if (!videoFile) return;
    if (!consentGiven) {
      toast.error("Bitte stimme der Datenverarbeitung zu");
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Bitte zuerst einloggen");
        return;
      }

      // Step 1: Upload video to Supabase Storage
      setStep("uploading");
      const fileName = `${user.id}/${Date.now()}-${videoFile.name}`;

      const { error: uploadError } = await supabase
        .storage
        .from("pc-videos")
        .upload(fileName, videoFile, {
          cacheControl: "300",
          upsert: false,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        toast.error(`Video-Upload fehlgeschlagen: ${uploadError.message}`);
        setStep("upload");
        return;
      }

      setLastStoragePath(fileName);

      // Step 2: Run analysis
      await runAnalysis(fileName, videoFile.type);
    } catch (err) {
      console.error("Analyse error:", err);
      setErrorMessage(err instanceof Error ? err.message : "Analyse fehlgeschlagen");
      setStep("error");
    }
  }, [videoFile, consentGiven, runAnalysis]);

  const handleRetry = useCallback(async () => {
    if (!lastStoragePath || !videoFile || retryCount >= MAX_RETRIES) {
      toast.error("Maximale Versuche erreicht. Bitte starte eine neue Analyse.");
      handleReset();
      return;
    }
    setRetryCount((c) => c + 1);
    await runAnalysis(lastStoragePath, videoFile.type);
  }, [lastStoragePath, videoFile, retryCount, runAnalysis]);

  const handleReset = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setVideoDuration(null);
    setResult(null);
    setAnalysisId(null);
    setStep("upload");
    setConsentGiven(false);
    setLastStoragePath(null);
    setRetryCount(0);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }, [videoUrl]);

  // Result view
  if (step === "result" && result) {
    return (
      <div className="space-y-6">
        <AnalyseResult
          feedback={result}
          analysisId={analysisId}
          videoUrl={videoUrl}
        />
        <Button onClick={handleReset} variant="outline" className="w-full">
          Neue Analyse starten
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Upload */}
      <Card className="bg-surface-2 border-white/[0.06]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald" />
            Video auswaehlen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!videoUrl ? (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-white/[0.1] rounded-xl p-8 flex flex-col items-center gap-3 hover:border-emerald/30 hover:bg-emerald/5 transition-colors cursor-pointer"
              >
                <Upload className="w-8 h-8 text-text-muted" />
                <span className="text-text-secondary font-medium text-sm">
                  Video hochladen
                </span>
                <span className="text-text-muted text-xs">
                  MP4, MOV, WebM — max. {MAX_FILE_SIZE_MB} MB, max. {Math.floor(MAX_DURATION_SECONDS / 60)} Min
                </span>
              </button>
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-white/[0.1] rounded-xl p-8 flex flex-col items-center gap-3 hover:border-cyan/30 hover:bg-cyan/5 transition-colors cursor-pointer"
              >
                <Camera className="w-8 h-8 text-text-muted" />
                <span className="text-text-secondary font-medium text-sm">
                  Video aufnehmen
                </span>
                <span className="text-text-muted text-xs">
                  Direkt mit der Kamera filmen
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative rounded-xl overflow-hidden bg-black">
                <video
                  src={videoUrl}
                  className="w-full max-h-[400px] object-contain"
                  controls
                  playsInline
                  preload="auto"
                />
              </div>
              {videoDuration && (
                <p className="text-xs text-text-muted text-center">
                  {videoDuration > 30
                    ? `${Math.floor(videoDuration / 60)}:${String(Math.floor(videoDuration % 60)).padStart(2, "0")} — Rallys werden automatisch erkannt`
                    : `${Math.round(videoDuration)}s — Einzelschlag-Analyse`}
                </p>
              )}
            </div>
          )}

          {/* File inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Options + Analyse Button */}
      {videoUrl && (
        <Card className="bg-surface-2 border-white/[0.06]">
          <CardContent className="pt-6 space-y-4">
            {/* Stroke type selection — only for short clips */}
            {(videoDuration ?? 0) <= 30 && (
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">
                  Was wird analysiert?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STROKE_TYPES.map((st) => (
                    <button
                      key={st.value}
                      onClick={() => setStrokeType(st.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        strokeType === st.value
                          ? "bg-emerald/20 text-emerald border border-emerald/30"
                          : "bg-white/[0.04] text-text-secondary border border-white/[0.06] hover:border-white/[0.12]"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Info for rally analysis */}
            {(videoDuration ?? 0) > 30 && (
              <div className="p-3 rounded-lg bg-emerald/5 border border-emerald/20">
                <p className="text-sm text-emerald">
                  Rally-Analyse: Die KI erkennt automatisch alle Ballwechsel und analysiert jeden einzeln.
                </p>
              </div>
            )}

            {/* DSGVO Consent */}
            <label className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 accent-emerald"
              />
              <span className="text-sm text-text-secondary">
                Ich stimme zu, dass das Video zur Analyse an Google Gemini gesendet wird.
                Das Video wird nicht dauerhaft gespeichert und nur fuer die einmalige Analyse verwendet.{" "}
                <a href="/datenschutz" className="text-emerald hover:underline">
                  Mehr erfahren
                </a>
              </span>
            </label>

            {/* Upload State */}
            {step === "uploading" && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Loader2 className="w-4 h-4 animate-spin text-emerald" />
                Video wird hochgeladen...
              </div>
            )}

            {/* Analysing State with elapsed timer */}
            {step === "analysing" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald" />
                  KI analysiert dein Video... ({elapsed}s)
                </div>
                {elapsed > 15 && elapsed <= 40 && (
                  <p className="text-xs text-text-muted">
                    {(videoDuration ?? 0) > 30
                      ? "Rally-Erkennung und Analyse laufen — das kann etwas dauern."
                      : "Laengere Videos brauchen etwas mehr Zeit. Bitte warte noch einen Moment."}
                  </p>
                )}
                {elapsed > 40 && (
                  <p className="text-xs text-amber-400">
                    Die Analyse dauert ungewoehnlich lang. Falls nichts passiert, wird sie automatisch abgebrochen.
                  </p>
                )}
              </div>
            )}

            {/* Error State with Retry */}
            {step === "error" && errorMessage && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{errorMessage}</p>
                </div>
                <div className="flex gap-3">
                  {retryCount < MAX_RETRIES && lastStoragePath && (
                    <Button
                      onClick={handleRetry}
                      variant="outline"
                      className="flex-1 border-emerald/30 text-emerald hover:bg-emerald/10 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Erneut versuchen ({MAX_RETRIES - retryCount} verbleibend)
                    </Button>
                  )}
                  <Button onClick={handleReset} variant="outline" className="cursor-pointer">
                    Zuruecksetzen
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons — only in upload step */}
            {step === "upload" && (
              <div className="flex gap-3">
                <Button
                  onClick={handleAnalyse}
                  disabled={!consentGiven}
                  className="flex-1 h-12 bg-emerald hover:bg-emerald-dark text-white font-medium cursor-pointer"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {(videoDuration ?? 0) > 30 ? "Spiel analysieren" : "Analyse starten"}
                </Button>
                <Button onClick={handleReset} variant="outline" className="cursor-pointer">
                  Zuruecksetzen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
