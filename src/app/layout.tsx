import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PingCoach — Dein KI-Trainer fuer Tischtennis",
    template: "%s | PingCoach",
  },
  description:
    "Analysiere deine Tischtennis-Technik mit KI. Video aufnehmen, Schwaechen erkennen, personalisiert trainieren — nur mit deinem Smartphone.",
  keywords: [
    "Tischtennis",
    "Training",
    "KI",
    "Video-Analyse",
    "Technik",
    "Coach",
    "Trainingsplan",
  ],
  authors: [{ name: "PingCoach" }],
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "PingCoach",
    title: "PingCoach — Dein KI-Trainer fuer Tischtennis",
    description:
      "Analysiere deine Tischtennis-Technik mit KI. Video aufnehmen, Schwaechen erkennen, personalisiert trainieren.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
