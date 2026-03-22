"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Video, Loader2, Camera } from "lucide-react";
import {
  processVideo,
  calculateJointAngles,
  calculateVelocities,
  drawPose,
} from "@/lib/pose-detection";
import type { PoseData, StructuredFeedback } from "@/lib/types";
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

type AnalyseStep = "upload" | "processing" | "analysing" | "result";

export function VideoAnalyser() {
  const [step, setStep] = useState<AnalyseStep>("upload");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [strokeType, setStrokeType] = useState("vorhand_topspin");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<StructuredFeedback | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Bitte waehle eine Video-Datei aus");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video darf maximal 100 MB gross sein");
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setResult(null);
    setAnalysisId(null);
  }, []);

  const handleAnalyse = useCallback(async () => {
    if (!videoRef.current || !videoUrl) return;
    if (!consentGiven) {
      toast.error("Bitte stimme der Datenverarbeitung zu");
      return;
    }

    try {
      // Step 1: Extract poses with MediaPipe (local)
      setStep("processing");
      setProgress(0);

      const video = videoRef.current;
      await new Promise<void>((resolve) => {
        if (video.readyState >= 2) {
          resolve();
        } else {
          video.onloadeddata = () => resolve();
        }
      });

      const poseData: PoseData = await processVideo(video, setProgress);

      if (poseData.frames.length === 0) {
        toast.error("Keine Pose erkannt. Stelle sicher, dass du im Video gut sichtbar bist.");
        setStep("upload");
        return;
      }

      // Draw last frame pose on canvas
      if (canvasRef.current && poseData.frames.length > 0) {
        const lastFrame = poseData.frames[poseData.frames.length - 1];
        drawPose(canvasRef.current, lastFrame.keypoints, video.videoWidth, video.videoHeight);
      }

      // Step 2: Calculate angles + velocities
      const jointAngles = calculateJointAngles(poseData);
      const velocities = calculateVelocities(poseData);

      // Step 3: Send to Gemini for coaching feedback
      setStep("analysing");

      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poseData: {
            ...poseData,
            jointAngles,
            velocities,
          },
          strokeType,
          analysisType: "einzelschlag",
        }),
      });

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
      console.error("Analyse error:", err);
      toast.error(err instanceof Error ? err.message : "Analyse fehlgeschlagen");
      setStep("upload");
    }
  }, [videoUrl, strokeType, consentGiven]);

  const handleReset = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    setResult(null);
    setAnalysisId(null);
    setStep("upload");
    setProgress(0);
    setConsentGiven(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [videoUrl]);

  // Result view
  if (step === "result" && result) {
    return (
      <div className="space-y-6">
        <AnalyseResult feedback={result} analysisId={analysisId} />
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-white/[0.1] rounded-xl p-12 flex flex-col items-center gap-3 hover:border-emerald/30 hover:bg-emerald/5 transition-colors cursor-pointer"
            >
              <Upload className="w-10 h-10 text-text-muted" />
              <span className="text-text-secondary font-medium">
                Video hochladen oder aufnehmen
              </span>
              <span className="text-text-muted text-sm">
                MP4, MOV, WebM — max. 100 MB
              </span>
            </button>
          ) : (
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full max-h-[400px] object-contain"
                controls
                playsInline
                preload="auto"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            </div>
          )}

          <input
            ref={fileInputRef}
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
            {/* Stroke type selection */}
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

            {/* DSGVO Consent */}
            <label className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 accent-emerald"
              />
              <span className="text-sm text-text-secondary">
                Ich stimme zu, dass anonymisierte Bewegungsdaten (Gelenkwinkel, keine Bilder)
                zur Analyse an Google Gemini gesendet werden.{" "}
                <a href="/datenschutz" className="text-emerald hover:underline">
                  Mehr erfahren
                </a>
              </span>
            </label>

            {/* Processing State */}
            {step === "processing" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald" />
                  Pose-Erkennung laeuft... (lokal auf deinem Geraet)
                </div>
                <div className="w-full bg-white/[0.06] rounded-full h-2">
                  <div
                    className="bg-emerald h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {step === "analysing" && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Loader2 className="w-4 h-4 animate-spin text-cyan" />
                KI analysiert deine Technik...
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleAnalyse}
                disabled={step !== "upload" || !consentGiven}
                className="flex-1 h-12 bg-emerald hover:bg-emerald-dark text-white font-medium cursor-pointer"
              >
                {step === "upload" ? (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Analyse starten
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Wird analysiert...
                  </>
                )}
              </Button>
              <Button onClick={handleReset} variant="outline" className="cursor-pointer">
                Zuruecksetzen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
