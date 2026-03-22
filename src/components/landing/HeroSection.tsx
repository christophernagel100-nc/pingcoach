'use client'

import dynamic from 'next/dynamic'
import { motion } from 'motion/react'
import { WaitlistForm } from '@/components/waitlist-form'

const InteractivePaddle = dynamic(() => import('./InteractivePaddle'), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full w-full items-center justify-center rounded-2xl"
      style={{
        background: 'rgba(16, 185, 129, 0.05)',
        border: '1px solid rgba(16, 185, 129, 0.1)',
      }}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-emerald" />
    </div>
  ),
})

const ease = [0.16, 1, 0.3, 1] as const

export default function HeroSection() {
  return (
    <section className="relative z-10 flex min-h-screen items-center justify-center px-6 md:px-12 pt-16">
      <div className="mx-auto flex max-w-7xl w-full flex-col-reverse items-center gap-12 md:flex-row md:gap-16">
        {/* Text */}
        <div className="flex-1 text-center md:text-left">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="text-sm uppercase tracking-widest mb-4 text-emerald"
          >
            KI-gesteuertes Tischtennis-Training
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Analysiere.
            <br />
            <span className="text-text-secondary">Trainiere.</span>
            <br />
            <span className="gradient-text-emerald">Dominiere.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease }}
            className="mt-6 max-w-md text-text-secondary"
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.125rem)',
              lineHeight: 1.7,
            }}
          >
            Dein KI-Trainer erkennt deine Technik per Video, findet Schwaechen
            und gibt dir personalisierte Uebungen — nur mit deinem Smartphone.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease }}
            className="mt-8"
          >
            <WaitlistForm />
            <p className="text-text-muted text-sm mt-3">
              Kostenlos in der Beta. DSGVO-konform. Kein Spam.
            </p>
          </motion.div>
        </div>

        {/* 3D Paddle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="flex-1"
          style={{
            width: 'clamp(300px, 40vw, 550px)',
            height: 'clamp(300px, 40vw, 550px)',
          }}
        >
          <InteractivePaddle />
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <a href="#statement" className="flex flex-col items-center gap-2 text-text-muted">
          <span className="text-xs">Mehr erfahren</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-8 rounded-full border border-white/10 flex justify-center pt-1.5"
          >
            <motion.div className="w-1 h-1.5 rounded-full bg-text-muted" />
          </motion.div>
        </a>
      </motion.div>
    </section>
  )
}
