# PingCoach — KI-Tischtennis-Trainer
> Personalisierte Video-Analyse und Trainingsplaene fuer Tischtennis — nur mit dem Smartphone, keine Hardware noetig.

@AGENTS.md

## Projektuebersicht

| Eigenschaft | Wert |
|-------------|------|
| **Kernziel** | KI-gestuetzte Tischtennis-Analyse: Video hochladen, Technik analysieren, personalisiert trainieren |
| **Zielgruppe** | Vereinsspieler + ambitionierte Freizeitspieler (DACH-Start, dann international) |
| **Differenzierung** | Kamerabasierte KI-Analyse OHNE proprietaere Hardware (kein Spinsight/Janova) |
| **Geschaeftsmodell** | Freemium SaaS (Free + Pro 9,99 EUR/Mo + Coach/Verein B2B) |
| **Status** | Projekt-Setup |
| **GitHub** | christophernagel100-nc/pingcoach |
| **Live URL** | pingcoach.nailcrest.de (geplant) |
| **Founder** | Chris Nagel (aktiver Vereinsspieler, Solo-Founder) |

## Rolle des Agenten

- Video-Analyse-Pipeline bauen (MediaPipe im Browser + Gemini Flash fuer Coaching-Feedback)
- Premium Dark Theme UI mit Sport-Branding (Emerald/Cyan Akzent)
- Supabase Auth + RLS fuer Multi-User SaaS
- DSGVO-konforme Architektur (Privacy by Design, Video bleibt lokal)
- Trainingsplan-Algorithmen und Drill-Empfehlungen implementieren
- Alle UI-Texte auf Deutsch, Code/Variablen auf Englisch

## Tech-Stack

| Komponente | Technologie | Anmerkung |
|-----------|-------------|-----------|
| **Frontend** | Next.js 16 (App Router, RSC), TypeScript (strict), Tailwind CSS v4 | PWA-faehig |
| **UI** | shadcn/ui, Lucide React Icons, Zod Validierung | `npx shadcn@latest add [component]` |
| **Auth** | Supabase Auth (E-Mail + Passwort, spaeter Google OAuth) | Multi-User SaaS |
| **Datenbank** | PostgreSQL via Supabase (geteilte Instanz) | Alle Tabellen mit `pc_` Prefix |
| **Video-Analyse** | MediaPipe BlazePose (Client-Side, WebAssembly) | Video verlässt NIE das Geraet |
| **KI-Feedback** | Google Gemini 2.0 Flash API | Nur Pose-Metadaten (JSON) werden gesendet |
| **Deployment** | Vercel (Auto-Deploy via GitHub) | Org: `christophernagel100-nc` |
| **Payments** | Stripe (spaeter) | Freemium + Pro-Abo |

### Bewusste Abweichungen von globaler CLAUDE.md

- **KEIN n8n** — keine Workflow-Orchestrierung noetig, alles in Next.js API Routes
- **KEIN Token-Auth** — Supabase Auth fuer echtes Multi-User SaaS (nicht Cookie-Token wie beim Berater)
- **Gemini statt OpenAI** — 10x guenstiger fuer Video-/Pose-Analyse, nativer Video-Support
- **KEIN Cormorant Garamond** — Sport-App braucht modernere Typografie (Geist/Inter)
- **Emerald/Cyan Akzent** statt Beige/Indigo — sportliches, frisches Farbschema

## Datenbank (Supabase — geteilte Instanz)

**WICHTIG:** Alle Tabellen mit `pc_` Prefix, da geteilte Instanz mit kiNews + Business-Berater.

| Tabelle | Zweck |
|---------|-------|
| `pc_profiles` | Spielerprofil: Typ (Angreifer/Allrounder/Abwehr), Level, Schwaechen, Ziele, Hand |
| `pc_analyses` | Video-Analyse-Ergebnisse: Pose-Daten (JSON), KI-Feedback, Schlagtyp, Scores |
| `pc_training_sessions` | Trainingslog: Datum, Dauer, Fokus, Notizen, verknuepfte Drills |
| `pc_drills` | Drill-Bibliothek: Name, Beschreibung, Schwierigkeit, Zielbereich, Anleitung |
| `pc_match_stats` | Match-Statistiken: Ergebnis, Saetze, Schlagverteilung, Schwachstellen |
| `pc_waitlist` | Waitlist-Eintraege (Pre-Launch) |

Supabase-Instanz: `vaxtyfdznwylwhndybrq.supabase.co` (EU Frankfurt)

## App Routes

### Frontend

| Route | Seite | Beschreibung |
|-------|-------|-------------|
| `/` | Landing | Hero, Features, Waitlist-CTA, Social Proof |
| `/login` | Login | E-Mail + Passwort (Supabase Auth) |
| `/register` | Registrierung | Neuer Account + Onboarding-Fragebogen |
| `/dashboard` | Dashboard | Uebersicht: Letzte Analysen, Trainingsfortschritt, naechste Empfehlungen |
| `/analyse` | Video-Analyse | Video aufnehmen/hochladen, MediaPipe Pose-Extraktion, KI-Feedback |
| `/analyse/[id]` | Analyse-Detail | Einzelne Analyse: Skelett-Visualisierung, Feedback, Drill-Empfehlungen |
| `/training` | Trainingsplan | KI-generierter Plan basierend auf Profil + Analyse-Ergebnisse |
| `/drills` | Drill-Bibliothek | Alle Drills, filterbar nach Kategorie/Schwierigkeit/Zielbereich |
| `/matches` | Match-Tracker | Spiele loggen, Statistiken, Gegner-Muster |
| `/profil` | Spieler-Profil | Spielertyp, Level, Schwaechen, Ziele bearbeiten |
| `/einstellungen` | Einstellungen | Account, Datenschutz, Datenexport, Account loeschen |
| `/datenschutz` | Datenschutz | Vollstaendige Datenschutzerklaerung |
| `/impressum` | Impressum | Pflichtangaben |

### API Routes

| Route | Methode | Beschreibung |
|-------|---------|-------------|
| `/api/auth/callback` | GET | Supabase Auth Callback |
| `/api/analyse` | POST | Pose-Daten an Gemini senden, Feedback speichern |
| `/api/training/generate` | POST | KI-Trainingsplan generieren (Gemini) |
| `/api/drills` | GET | Drill-Bibliothek abrufen |
| `/api/matches` | GET/POST | Match-Statistiken CRUD |
| `/api/profile` | GET/PUT | Spielerprofil lesen/aktualisieren |
| `/api/export` | GET | Alle User-Daten als JSON exportieren (DSGVO) |
| `/api/account/delete` | DELETE | Account + alle Daten loeschen (DSGVO) |
| `/api/waitlist` | POST | Waitlist-Eintrag (Pre-Launch) |

## Video-Analyse-Pipeline

```
Smartphone-Kamera / Video-Upload (5-60 Sek Clip)
         |
[Browser: MediaPipe BlazePose via WebAssembly]
  -> 33 Keypoints pro Frame extrahieren (lokal, 0 EUR, 30+ FPS)
  -> Gelenkwinkel berechnen (Schulter, Ellbogen, Handgelenk, Huefte, Knie)
  -> Schlagtyp klassifizieren (Topspin, Push, Block, Flip, Aufschlag)
  -> Bewegungsgeschwindigkeiten messen
         |
[Strukturierte JSON-Daten, <1KB pro Analyse]
  -> Winkel-Arrays, Geschwindigkeits-Profile, Schlagtyp-Labels
         |
[API Route -> Gemini 2.0 Flash]
  -> Prompt mit Pose-Daten + Spielerprofil + Kontext
  -> Natuerlichsprachliches Coaching-Feedback auf Deutsch
  -> Konkrete Verbesserungsvorschlaege + Drill-Empfehlungen
  -> Kosten: ~0,02-0,05 EUR pro Analyse
         |
[Ergebnis in Supabase speichern + an User anzeigen]
  -> Skelett-Overlay-Visualisierung
  -> Textfeedback mit Prioritaeten
  -> Verknuepfte Drill-Empfehlungen
  -> Fortschritts-Vergleich mit frueheren Analysen
```

**KRITISCH:** Das Video wird NIEMALS hochgeladen. Nur die extrahierten Pose-Metadaten (anonymisierte Gelenkwinkel als JSON) verlassen das Geraet. Das ist der Kern unseres DSGVO-Konzepts.

## DSGVO & Security (Pflicht — keine Kompromisse)

### Privacy by Design
- Video bleibt IMMER lokal (MediaPipe laeuft im Browser)
- Nur Pose-Metadaten (anonymisierte JSON, <1KB) an Gemini API
- Optional: User kann Video in Supabase Storage speichern (expliziter Opt-in)
- Minimale Datenerhebung: nur was fuer den Service noetig ist
- Supabase Region: eu-central-1 (Frankfurt) — Daten bleiben in EU

### DSGVO-Compliance
- Datenschutzerklaerung (deutsch, vollstaendig) auf `/datenschutz`
- Impressum auf `/impressum`
- Cookie-Consent-Banner (nur wenn technisch noetig)
- Recht auf Loeschung: Account + alle Daten mit einem Klick (`/api/account/delete`)
- Recht auf Datenportabilitaet: JSON-Export (`/api/export`)
- Einwilligung vor erster Video-Analyse (Consent-Dialog: "Pose-Daten werden an Google gesendet")
- AV-Vertrag mit Supabase (EU) + Google (Gemini API DPA)

### Security-Massnahmen
- Supabase Auth mit E-Mail-Verifizierung
- RLS auf ALLEN `pc_*` Tabellen (User sieht nur eigene Daten)
- HTTPS everywhere (Vercel Default)
- Rate Limiting auf API Routes (besonders `/api/analyse`)
- Input-Validierung mit Zod auf allen API Routes
- CSP Headers (Content Security Policy) fuer MediaPipe WASM
- `X-Frame-Options`, `X-Content-Type-Options` Security Headers
- Keine Secrets im Client-Code (nur `NEXT_PUBLIC_*` fuer oeffentliche Werte)
- try/catch Error Handling in allen API Routes
- Credentials NUR ueber `process.env.VARIABLE_NAME`

## Environment Variables

```env
# Supabase (geteilte Instanz)
NEXT_PUBLIC_SUPABASE_URL=           # vaxtyfdznwylwhndybrq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Supabase Public Key
SUPABASE_SERVICE_ROLE_KEY=          # Supabase Admin Key (Server-only)

# Gemini API
GEMINI_API_KEY=                     # Google AI Studio Key (Server-only)

# App
NEXT_PUBLIC_APP_URL=                # https://pingcoach.nailcrest.de
NEXT_PUBLIC_APP_NAME=PingCoach

# Stripe (spaeter)
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Design-System (Sport-Variante)

### Farbpalette
- **Hintergrund:** #050508 (fast schwarz)
- **Surface:** #0a0a12, #111118, #1a1a2e
- **Primaer-Akzent:** Emerald (#10b981) — Erfolg, Sport, Frische
- **Sekundaer-Akzent:** Cyan (#06b6d4) — Technologie, Analyse
- **Text:** rgba(255,255,255,0.95) / 0.55 / 0.30
- **Borders:** rgba(255,255,255,0.08)
- **Status:** Emerald (Gut), Amber (Mittel), Red (Schlecht)

### Typografie
- **Body:** Geist Sans (400/500/600) — modern, clean, sportlich
- **Headlines:** Inter (600/700) — klar, lesbar
- **Monospace:** Geist Mono (Code, Metriken)

### Effekte
- Glassmorphism Cards (wie Business-Berater)
- Gradient-Orbs (Emerald + Cyan)
- Subtle Noise-Overlay
- Skeleton-Visualisierung fuer Pose-Daten (eigene Canvas-Komponente)

## Konkurrenz (fuer Kontext)

| App | Was sie machen | Warum wir besser sind |
|-----|---------------|----------------------|
| Spinsight | Sensor-Baelle (5-50 EUR/Mo + Hardware) | Keine Hardware noetig |
| Janova | Smart Racket (200 EUR Paddle) | Keine Hardware noetig |
| SpinCoach | Video-Upload KI | Unser Video bleibt lokal (DSGVO), bessere UX |
| TTFit | Drill-Bibliothek (70+ Drills) | Wir haben Video-Analyse + personalisierte Drills |
| TT-Coach | Trainingsplaene | Wir kombinieren Analyse + Plan + Drills |

## Marktkontext

- 542.000 registrierte Vereinsspieler in Deutschland (wachsend +2,8% YoY)
- ~600.000 DACH gesamt, 3-8 Mio. Freizeitspieler
- Kein "SwingVision fuer Tischtennis" existiert
- MediaPipe fuer TT-Analyse wissenschaftlich validiert (Frontiers in Sports, 2025)
- Schlagtyp-Erkennung: 99,37% Genauigkeit (Temporal Convolutional Network)

## Coding-Konventionen

- Server Components als Default, `'use client'` nur wenn noetig
- Alle UI-Texte auf Deutsch
- Code, Variablen, Kommentare auf Englisch
- Interfaces in `lib/types.ts`, Zod-Schemas fuer API-Validierung
- Tailwind v4: `@theme` fuer CSS Variables, `@utility` fuer Custom Utilities
- Keine inline-Styles — alles Tailwind-Klassen
- Feature Branches: `feature/beschreibung`, Commits auf Deutsch
- `.env.local` NIE committen — `.env.local.example` als Template

## Wichtige Abhaengigkeiten (zu installieren)

```bash
# UI
npx shadcn@latest init
npx shadcn@latest add button card input label dialog toast

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Video-Analyse
npm install @mediapipe/tasks-vision

# KI
npm install @google/generative-ai

# Validierung
npm install zod

# Utils
npm install clsx tailwind-merge lucide-react date-fns
```
