'use client'

import { motion } from 'motion/react'
import { Video, Brain, Target, TrendingUp, Smartphone, Shield } from 'lucide-react'
import { ReactNode } from 'react'

function FeatureCard({ icon, title, description, delay }: {
  icon: ReactNode
  title: string
  description: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="card-glass p-8 sm:p-10 h-full group hover:border-emerald/20 transition-all duration-300">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-emerald/10 group-hover:bg-emerald/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-xl sm:text-2xl font-bold mb-3" style={{ letterSpacing: '-0.02em' }}>
          {title}
        </h3>
        <p className="leading-relaxed text-sm sm:text-base text-text-secondary">
          {description}
        </p>
      </div>
    </motion.div>
  )
}

const features = [
  {
    icon: <Video size={24} className="text-emerald" />,
    title: 'Video-Analyse',
    description:
      'Nimm deinen Schlag auf oder lade ein Video hoch. Frame-fuer-Frame Analyse von Technik, Beinarbeit und Timing.',
  },
  {
    icon: <Brain size={24} className="text-emerald" />,
    title: 'KI-Coaching',
    description:
      'Sofort konkretes Feedback: Was laeuft gut, wo sind Schwaechen, und wie du sie gezielt verbesserst.',
  },
  {
    icon: <Target size={24} className="text-emerald" />,
    title: 'Personalisierte Drills',
    description:
      'Massgeschneiderte Uebungen basierend auf deiner Analyse — genau dort, wo du sie am meisten brauchst.',
  },
  {
    icon: <TrendingUp size={24} className="text-emerald" />,
    title: 'Fortschritt tracken',
    description:
      'Verfolge deine Entwicklung ueber Wochen und Monate. Messbare Verbesserung deiner Technik-Scores.',
  },
  {
    icon: <Smartphone size={24} className="text-emerald" />,
    title: 'Nur dein Smartphone',
    description:
      'Keine teuren Sensor-Baelle oder Smart-Rackets. Alles was du brauchst ist dein Handy und einen Tisch.',
  },
  {
    icon: <Shield size={24} className="text-emerald" />,
    title: '100% DSGVO-konform',
    description:
      'Dein Video verlaesst nie dein Geraet. Nur anonymisierte Bewegungsdaten werden analysiert. Deine Daten gehoeren dir.',
  },
]

export default function FeatureCards() {
  return (
    <section id="features" className="relative z-10 min-h-screen flex items-center py-24">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2
            className="font-bold"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              letterSpacing: '-0.03em',
            }}
          >
            Alles was du brauchst.{' '}
            <span className="gradient-text-emerald">Nichts was du nicht brauchst.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
