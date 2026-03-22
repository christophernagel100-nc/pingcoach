'use client'

import { Video, Brain, Target, TrendingUp, type LucideIcon } from 'lucide-react'
import ScrollReveal from './ScrollReveal'

interface WorkflowStepProps {
  word: string
  description: string
  icon: LucideIcon
  color: string
  reversed?: boolean
}

function WorkflowStep({ word, description, icon: Icon, color, reversed }: WorkflowStepProps) {
  return (
    <div className="min-h-[70vh] flex items-center py-16 sm:py-24">
      <div
        className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-16 items-center w-full"
        style={reversed ? { direction: 'rtl' } : undefined}
      >
        {/* Text */}
        <ScrollReveal direction={reversed ? 'right' : 'left'}>
          <div style={reversed ? { direction: 'ltr' } : undefined}>
            <h3
              style={{
                fontSize: 'clamp(3rem, 8vw, 6rem)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1,
                color,
              }}
            >
              {word}
            </h3>
            <p
              className="mt-6 max-w-md text-text-secondary"
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.15rem)',
                lineHeight: 1.7,
              }}
            >
              {description}
            </p>
          </div>
        </ScrollReveal>

        {/* Visual */}
        <ScrollReveal direction={reversed ? 'left' : 'right'} delay={0.15}>
          <div
            className="relative rounded-2xl overflow-hidden flex items-center justify-center card-glass"
            style={{
              direction: 'ltr',
              aspectRatio: '16 / 10',
            }}
          >
            <Icon
              size={120}
              strokeWidth={0.8}
              style={{ color, opacity: 0.2 }}
            />
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

const steps: WorkflowStepProps[] = [
  {
    word: 'Aufnehmen.',
    description:
      'Stelle dein Smartphone auf und nimm deinen Schlag auf. 5 bis 60 Sekunden reichen — einzelner Topspin oder ganzes Match.',
    icon: Video,
    color: '#10b981',
  },
  {
    word: 'Analysieren.',
    description:
      'Unsere KI erkennt 33 Koerperpunkte in Echtzeit, berechnet Gelenkwinkel, Geschwindigkeiten und Schlagtypen — direkt auf deinem Geraet.',
    icon: Brain,
    color: '#06b6d4',
    reversed: true,
  },
  {
    word: 'Verbessern.',
    description:
      'Erhalte konkretes Coaching-Feedback: Was laeuft gut, wo sind Schwaechen, und welche Uebungen dich gezielt weiterbringen.',
    icon: Target,
    color: '#10b981',
  },
  {
    word: 'Gewinnen.',
    description:
      'Tracke deinen Fortschritt ueber Wochen. Sieh messbar, wie sich deine Technik-Scores verbessern — Match fuer Match.',
    icon: TrendingUp,
    color: '#06b6d4',
    reversed: true,
  },
]

export default function WorkflowShowcase() {
  return (
    <section id="workflow" className="relative z-10">
      {steps.map((step) => (
        <WorkflowStep key={step.word} {...step} />
      ))}
    </section>
  )
}
