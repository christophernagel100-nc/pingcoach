'use client'

import { motion } from 'motion/react'

const stats = [
  { value: '33', label: 'Koerperpunkte pro Frame' },
  { value: '99%', label: 'Schlagtyp-Erkennung' },
  { value: '<0.05€', label: 'Pro Analyse' },
  { value: '0', label: 'Videos hochgeladen' },
]

export default function SocialProof() {
  return (
    <section className="relative z-10 py-32 px-6 md:px-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div
                className="gradient-text-emerald mb-2"
                style={{
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div className="text-sm text-text-secondary">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
