'use client'

import { motion } from 'motion/react'
import { WaitlistForm } from '@/components/waitlist-form'

export default function CTASection() {
  return (
    <section className="relative z-10 py-32 px-6 md:px-12">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl mx-auto text-center"
      >
        <div className="card-glass p-10 md:p-16 glow-emerald">
          <h2
            className="font-bold mb-4"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              letterSpacing: '-0.03em',
            }}
          >
            Bereit, dein Spiel auf das{' '}
            <span className="gradient-text-emerald">naechste Level</span>{' '}
            zu bringen?
          </h2>
          <p className="text-text-secondary mb-8 max-w-lg mx-auto text-lg">
            Sei einer der Ersten, die PingCoach testen. Trag dich ein und
            erhalte exklusiven Beta-Zugang.
          </p>
          <div className="flex justify-center">
            <WaitlistForm />
          </div>
        </div>
      </motion.div>
    </section>
  )
}
