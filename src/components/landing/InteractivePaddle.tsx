'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

// =============================================================
// Apple-Style Parallax Tilt — Kein Three.js, nur CSS + Bild
// =============================================================

export default function InteractivePaddle() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [gloss, setGloss] = useState({ x: 50, y: 50 })
  const [isHovered, setIsHovered] = useState(false)
  const animFrameRef = useRef<number>(0)
  const currentTilt = useRef({ x: 0, y: 0 })
  const targetTilt = useRef({ x: 0, y: 0 })

  // Idle floating animation
  useEffect(() => {
    let frame: number
    const animate = () => {
      if (!isHovered) {
        const t = Date.now() / 1000
        targetTilt.current = {
          x: Math.sin(t * 0.5) * 3,
          y: Math.sin(t * 0.3) * 4,
        }
      }

      // Spring lerp toward target
      currentTilt.current.x += (targetTilt.current.x - currentTilt.current.x) * 0.06
      currentTilt.current.y += (targetTilt.current.y - currentTilt.current.y) * 0.06

      setTilt({ x: currentTilt.current.x, y: currentTilt.current.y })
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [isHovered])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width   // 0 to 1
    const y = (e.clientY - rect.top) / rect.height    // 0 to 1

    // Map to tilt degrees (center = 0, edges = ±12°)
    targetTilt.current = {
      x: -(y - 0.5) * 24,  // negative = tilt toward viewer at top
      y: (x - 0.5) * 24,
    }

    // Gloss follows mouse position
    setGloss({ x: x * 100, y: y * 100 })
  }, [])

  const handleMouseEnter = useCallback(() => setIsHovered(true), [])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    targetTilt.current = { x: 0, y: 0 }
    setGloss({ x: 50, y: 50 })
  }, [])

  // Shadow offset: opposite of tilt direction
  const shadowX = -tilt.y * 1.5
  const shadowY = tilt.x * 1.5

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="w-full h-full flex items-center justify-center"
      style={{ perspective: '1200px' }}
    >
      <div
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.02, 1.02, 1.02)`,
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'none' : 'transform 0.1s ease-out',
          willChange: 'transform',
          position: 'relative',
          maxWidth: '85%',
          maxHeight: '85%',
        }}
      >
        {/* Paddle Image */}
        <img
          src="/paddle-front.png"
          alt="PingCoach Schlaeger"
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            userSelect: 'none',
            filter: `drop-shadow(${shadowX}px ${shadowY}px 25px rgba(16, 185, 129, 0.15)) drop-shadow(0px 10px 40px rgba(0, 0, 0, 0.5))`,
          }}
        />

        {/* Gloss / Light reflection overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '8px',
            background: `radial-gradient(circle at ${gloss.x}% ${gloss.y}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
            pointerEvents: 'none',
            mixBlendMode: 'overlay',
          }}
        />

        {/* Subtle emerald edge glow */}
        <div
          style={{
            position: 'absolute',
            inset: '-5%',
            borderRadius: '50%',
            background: `radial-gradient(circle at ${gloss.x}% ${gloss.y}%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)`,
            pointerEvents: 'none',
            filter: 'blur(20px)',
          }}
        />
      </div>
    </div>
  )
}
