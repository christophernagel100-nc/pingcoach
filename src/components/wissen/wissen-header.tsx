import Link from "next/link";
import { Target } from "lucide-react";

export function WissenHeader() {
  return (
    <header className="sticky top-0 z-40 px-6 py-4 bg-background/60 backdrop-blur-xl border-b border-white/[0.04]">
      <div className="max-w-3xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald" />
          </div>
          <span className="text-lg font-semibold tracking-tight">PingCoach</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-text-secondary">
          <Link href="/wissen" className="hover:text-text-primary transition-colors">
            Wissen
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-full bg-emerald/10 text-emerald hover:bg-emerald/20 transition-colors"
          >
            Anmelden
          </Link>
        </nav>
      </div>
    </header>
  );
}
