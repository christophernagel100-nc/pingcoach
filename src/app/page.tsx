import HeroSection from '@/components/landing/HeroSection'
import StatementSection from '@/components/landing/StatementSection'
import WorkflowShowcase from '@/components/landing/WorkflowShowcase'
import FeatureCards from '@/components/landing/FeatureCards'
import SocialProof from '@/components/landing/SocialProof'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import { Target } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="gradient-orb fixed -top-64 -left-64 w-[500px] h-[500px] bg-emerald" />
      <div className="gradient-orb fixed -bottom-64 -right-64 w-[500px] h-[500px] bg-cyan" />
      <div className="noise-overlay fixed inset-0 z-50" />

      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-40 px-6 py-4 bg-background/60 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-emerald" />
            </div>
            <span className="text-lg font-semibold tracking-tight">PingCoach</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#workflow" className="hover:text-text-primary transition-colors">So gehts</a>
            <a
              href="/login"
              className="px-4 py-2 rounded-full bg-emerald/10 text-emerald hover:bg-emerald/20 transition-colors"
            >
              Anmelden
            </a>
          </nav>
        </div>
      </header>

      {/* Sections */}
      <HeroSection />
      <StatementSection />
      <WorkflowShowcase />
      <FeatureCards />
      <SocialProof />
      <CTASection />
      <Footer />
    </div>
  )
}
