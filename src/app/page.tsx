import { WaitlistForm } from "@/components/waitlist-form";
import {
  Video,
  Brain,
  Target,
  TrendingUp,
  Smartphone,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "Video-Analyse",
    description:
      "Nimm deinen Schlag auf oder lade ein Video hoch. Unsere KI analysiert Technik, Beinarbeit und Timing — Frame fuer Frame.",
  },
  {
    icon: Brain,
    title: "KI-Coaching",
    description:
      "Erhalte sofort konkretes Feedback: Was laeuft gut, wo sind Schwaechen, und wie du sie gezielt verbesserst.",
  },
  {
    icon: Target,
    title: "Personalisierte Drills",
    description:
      "Basierend auf deiner Analyse bekommst du massgeschneiderte Uebungen — genau dort, wo du sie brauchst.",
  },
  {
    icon: TrendingUp,
    title: "Fortschritt tracken",
    description:
      "Verfolge deine Entwicklung ueber Wochen und Monate. Sieh, wie sich deine Technik messbar verbessert.",
  },
  {
    icon: Smartphone,
    title: "Nur dein Smartphone",
    description:
      "Keine teuren Sensor-Baelle oder Smart-Rackets. Alles was du brauchst ist dein Handy.",
  },
  {
    icon: Shield,
    title: "100% DSGVO-konform",
    description:
      "Dein Video verlaesst nie dein Geraet. Nur anonymisierte Bewegungsdaten werden analysiert. Deine Daten gehoeren dir.",
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Effects */}
      <div className="gradient-orb absolute -top-40 -left-40 w-96 h-96 bg-emerald" />
      <div className="gradient-orb absolute top-1/3 -right-40 w-80 h-80 bg-cyan" />
      <div className="noise-overlay fixed inset-0 z-0" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            PingCoach
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald/10 border border-emerald/20 text-emerald text-sm font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
              Coming Soon — Jetzt auf die Warteliste
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Dein{" "}
              <span className="gradient-text-emerald">KI-Trainer</span>
              <br />
              fuer Tischtennis
            </h1>

            <p className="text-lg md:text-xl text-text-secondary max-w-xl mb-10 leading-relaxed">
              Analysiere deine Technik mit kuenstlicher Intelligenz.
              Video aufnehmen, Schwaechen erkennen, personalisiert
              trainieren — nur mit deinem Smartphone.
            </p>

            <WaitlistForm />

            <p className="text-text-muted text-sm mt-4">
              Kostenlos in der Beta. Keine Kreditkarte noetig. DSGVO-konform.
            </p>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <h2 className="text-2xl md:text-3xl font-bold mb-12">
            Alles was du brauchst.{" "}
            <span className="text-text-secondary">Nichts was du nicht brauchst.</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card-glass p-6 hover:border-emerald/20 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald/10 flex items-center justify-center mb-4 group-hover:bg-emerald/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-emerald" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <h2 className="text-2xl md:text-3xl font-bold mb-12">
            So funktioniert&apos;s
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Video aufnehmen",
                description:
                  "Stelle dein Smartphone auf und nimm deinen Schlag auf. 5-30 Sekunden reichen.",
              },
              {
                step: "02",
                title: "KI analysiert",
                description:
                  "Unsere KI erkennt deine Koerperhaltung, Schlagbewegung und Beinarbeit — direkt auf deinem Geraet.",
              },
              {
                step: "03",
                title: "Besser werden",
                description:
                  "Erhalte konkretes Feedback und passende Uebungen. Tracke deinen Fortschritt ueber die Zeit.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <span className="text-6xl font-bold text-emerald/10 absolute -top-2 -left-1">
                  {item.step}
                </span>
                <div className="pt-12">
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-6xl mx-auto px-6 pb-32">
          <div className="card-glass p-8 md:p-12 text-center glow-emerald">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Bereit, dein Spiel auf das naechste Level zu bringen?
            </h2>
            <p className="text-text-secondary mb-8 max-w-lg mx-auto">
              Sei einer der Ersten, die PingCoach testen. Trag dich auf
              die Warteliste ein und erhalte exklusiven Zugang zur Beta.
            </p>
            <WaitlistForm />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <span>&copy; {new Date().getFullYear()} PingCoach</span>
          <div className="flex gap-6">
            <a href="/datenschutz" className="hover:text-text-secondary transition-colors">
              Datenschutz
            </a>
            <a href="/impressum" className="hover:text-text-secondary transition-colors">
              Impressum
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
