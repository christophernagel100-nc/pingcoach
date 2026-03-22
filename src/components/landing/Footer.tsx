import { Target } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-border px-6 py-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-emerald" />
          </div>
          <span className="font-semibold text-sm">PingCoach</span>
        </div>

        <div className="flex gap-6 text-sm text-text-muted">
          <a href="/datenschutz" className="hover:text-text-secondary transition-colors">
            Datenschutz
          </a>
          <a href="/impressum" className="hover:text-text-secondary transition-colors">
            Impressum
          </a>
        </div>

        <span className="text-sm text-text-muted">
          &copy; {new Date().getFullYear()} PingCoach
        </span>
      </div>
    </footer>
  )
}
