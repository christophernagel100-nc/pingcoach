'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

export default function StatementSection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.2'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0.8, 1, 1, 0.8])
  const y = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [40, 0, 0, -40])

  return (
    <section
      id="statement"
      ref={ref}
      className="relative z-10 flex items-center justify-center min-h-screen px-6"
    >
      <motion.div
        style={{ opacity, y, scale }}
        className="text-center max-w-5xl"
      >
        <h2
          style={{
            fontSize: 'clamp(2.5rem, 9vw, 7rem)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
          }}
        >
          Dein Schlag.
          <br />
          <span className="gradient-text-emerald">Unsere KI.</span>
        </h2>
      </motion.div>
    </section>
  )
}
