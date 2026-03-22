"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, Video, Loader2, Camera } from "lucide-react";
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

type AnalyseStep = "upload" | "uploading" | "analysing" | "result";

export function VideoAnalyser() {
  const [step, setStep] = useState<AnalyseStep>("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [strokeType, setStrokeType] = useState("vorhand_topspin");
  const [result, setResult] = useState<StructuredFeedback | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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

    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setResult(null);
    setAnalysisId(null);
  }, []);

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
        toast.error("Video-Upload fehlgeschlagen");
        setStep("upload");
        return;
      }

      // Step 2: Send storage path to API for analysis
      setStep("analysing");

      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storagePath: fileName,
          mimeType: videoFile.type,
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
  }, [videoFile, strokeType, consentGiven]);

  const handleReset = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoFile(null);
    setVideoUrl(null);
    setResult(null);
    setAnalysisId(null);
    setStep("upload");
    setConsentGiven(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
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
                  MP4, MOV, WebM — max. 100 MB
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
            <div className="relative rounded-xl overflow-hidden bg-black">
              <video
                src={videoUrl}
                className="w-full max-h-[400px] object-contain"
                controls
                playsInline
                preload="auto"
              />
            </div>
          )}

          {/* Upload aus Galerie/Dateien */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          {/* Direkt aufnehmen mit Kamera */}
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
                Ich stimme zu, dass das Video zur Analyse an Google Gemini gesendet wird.
                Das Video wird nicht gespeichert und nur fuer die einmalige Analyse verwendet.{" "}
                <a href="/datenschutz" className="text-emerald hover:underline">
                  Mehr erfahren
                </a>
              </span>
            </label>

            {/* Upload + Analysing States */}
            {step === "uploading" && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Loader2 className="w-4 h-4 animate-spin text-emerald" />
                Video wird hochgeladen...
              </div>
            )}

            {step === "analysing" && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Loader2 className="w-4 h-4 animate-spin text-emerald" />
                KI analysiert dein Video...
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
