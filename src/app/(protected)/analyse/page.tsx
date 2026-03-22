import { VideoAnalyser } from "@/components/analyse/video-analyser";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Video-Analyse",
};

export default function AnalysePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Video-Analyse</h1>
        <p className="text-text-secondary">
          Nimm deinen Schlag auf oder lade ein Video hoch. Die KI analysiert
          deine Technik direkt auf deinem Geraet — dein Video wird nicht hochgeladen.
        </p>
      </div>
      <VideoAnalyser />
    </div>
  );
}
