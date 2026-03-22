'use client'

import { useRef, useState, useEffect, useCallback, Suspense } from 'react'
import { Canvas, useFrame, useThree, useLoader, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

// =============================================================
// PingCoach Paddle — Foto-Texturen (Front + Seite)
// Leicht modifiziert um Urheberrechtsprobleme zu vermeiden
// =============================================================

function PaddleMesh() {
  const frontTex = useLoader(THREE.TextureLoader, '/paddle-front.png')
  const sideTex = useLoader(THREE.TextureLoader, '/paddle-side.png')

  // Hochwertige Textur-Settings
  for (const tex of [frontTex, sideTex]) {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.anisotropy = 16
    tex.generateMipmaps = true
  }

  const size = 2.8        // Front face size (1:1 aspect)
  const thickness = 0.35  // Realistische Schlaeger-Dicke
  const sideHeight = 2.8  // Seiten-Textur Hoehe (= paddle height)

  return (
    <group>
      {/* ===== FRONT FACE — Paddle Foto ===== */}
      <mesh position={[0, 0, thickness / 2 + 0.001]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          map={frontTex}
          transparent
          alphaTest={0.1}
          side={THREE.FrontSide}
          roughness={0.65}
          metalness={0.02}
        />
      </mesh>

      {/* ===== BACK FACE — gespiegeltes Foto ===== */}
      <mesh position={[0, 0, -(thickness / 2 + 0.001)]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          map={frontTex}
          transparent
          alphaTest={0.1}
          side={THREE.FrontSide}
          roughness={0.65}
          metalness={0.02}
        />
      </mesh>

      {/* ===== RIGHT SIDE — Seiten-Foto ===== */}
      <mesh position={[size * 0.27, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[thickness, sideHeight]} />
        <meshStandardMaterial
          map={sideTex}
          transparent
          alphaTest={0.1}
          side={THREE.FrontSide}
          roughness={0.6}
          metalness={0.02}
        />
      </mesh>

      {/* ===== LEFT SIDE — gespiegelte Seite ===== */}
      <mesh position={[-size * 0.27, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[thickness, sideHeight]} />
        <meshStandardMaterial
          map={sideTex}
          transparent
          alphaTest={0.1}
          side={THREE.FrontSide}
          roughness={0.6}
          metalness={0.02}
        />
      </mesh>

      {/* ===== PingCoach Branding Overlay (Urheberrecht) ===== */}
      {/* Subtiler Emerald-Tint ueber dem Gummi-Bereich */}
      <mesh position={[0, size * 0.12, thickness / 2 + 0.003]}>
        <circleGeometry args={[size * 0.3, 32]} />
        <meshStandardMaterial
          color="#10b981"
          transparent
          opacity={0.06}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// ---------- Apple-like smooth rotation ----------

function RotatingPaddle() {
  const groupRef = useRef<THREE.Group>(null)

  const isDragging = useRef(false)
  const prevPointer = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0.12, y: 0 })
  const targetRotation = useRef({ x: 0.12, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const lastInteraction = useRef(0)
  const autoBlend = useRef(1)

  const { gl } = useThree()

  const onDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    isDragging.current = true
    prevPointer.current = { x: e.clientX, y: e.clientY }
    velocity.current = { x: 0, y: 0 }
    autoBlend.current = 0
    lastInteraction.current = Date.now()
    targetRotation.current = { ...currentRotation.current }
    gl.domElement.style.cursor = 'grabbing'
  }, [gl])

  const onMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return
    const dx = e.clientX - prevPointer.current.x
    const dy = e.clientY - prevPointer.current.y
    const s = 0.006

    targetRotation.current.y += dx * s
    targetRotation.current.x += dy * s

    velocity.current.x = velocity.current.x * 0.6 + dy * s * 0.4
    velocity.current.y = velocity.current.y * 0.6 + dx * s * 0.4

    prevPointer.current = { x: e.clientX, y: e.clientY }
    lastInteraction.current = Date.now()
  }, [])

  const onUp = useCallback(() => {
    isDragging.current = false
    lastInteraction.current = Date.now()
    gl.domElement.style.cursor = 'grab'
  }, [gl])

  useFrame((state) => {
    if (!groupRef.current) return
    const idle = Date.now() - lastInteraction.current > 2000

    if (isDragging.current) {
      currentRotation.current.x = THREE.MathUtils.lerp(
        currentRotation.current.x, targetRotation.current.x, 0.12
      )
      currentRotation.current.y = THREE.MathUtils.lerp(
        currentRotation.current.y, targetRotation.current.y, 0.12
      )
    } else if (
      Math.abs(velocity.current.x) > 0.00005 ||
      Math.abs(velocity.current.y) > 0.00005
    ) {
      currentRotation.current.x += velocity.current.x
      currentRotation.current.y += velocity.current.y
      velocity.current.x *= 0.965
      velocity.current.y *= 0.965
    } else if (idle) {
      autoBlend.current = THREE.MathUtils.lerp(autoBlend.current, 1, 0.008)
      currentRotation.current.y += 0.002 * autoBlend.current

      const breathe = 0.1 + Math.sin(state.clock.elapsedTime * 0.3) * 0.05
      currentRotation.current.x = THREE.MathUtils.lerp(
        currentRotation.current.x, breathe, 0.008 * autoBlend.current
      )
    }

    groupRef.current.rotation.x = currentRotation.current.x
    groupRef.current.rotation.y = currentRotation.current.y
  })

  return (
    <group
      ref={groupRef}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={() => {
        if (isDragging.current) {
          isDragging.current = false
          gl.domElement.style.cursor = 'grab'
        }
      }}
    >
      <PaddleMesh />
    </group>
  )
}

// ---------- Scene ----------

function Scene({ onReady }: { onReady?: () => void }) {
  const frameCount = useRef(0)
  const reported = useRef(false)

  useFrame(() => {
    if (!reported.current) {
      frameCount.current++
      if (frameCount.current >= 3) {
        reported.current = true
        onReady?.()
      }
    }
  })

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 4, 5]} intensity={0.5} />
      <pointLight position={[-3, 2, 4]} intensity={0.15} color="#10b981" />
      <RotatingPaddle />
    </>
  )
}

// ---------- Export ----------

export default function InteractivePaddle() {
  const [isClient, setIsClient] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => setIsClient(true), [])
  const handleReady = useCallback(() => setIsReady(true), [])

  if (!isClient) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-emerald" />
      </div>
    )
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.8s ease-out',
        touchAction: 'none',
        cursor: 'grab',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.3,
        }}
        dpr={[1.5, 2]}
        style={{ touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          <Scene onReady={handleReady} />
        </Suspense>
      </Canvas>
    </div>
  )
}
