'use client'

import { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'

// =============================================================
// Stiga Cybershape — 1:1 Nachbau
// Proportionen basierend auf echtem Schlaeger (158x154mm Blade)
// =============================================================

function createCybershapeOutline(scale = 1): THREE.Shape {
  const s = scale
  const shape = new THREE.Shape()

  // Cybershape: Abgerundetes Sechseck, breiter oben, schmaler unten
  // Punkte im Uhrzeigersinn, Start unten-mitte (wo Handle ansetzt)
  // Reale Proportionen: ~158mm breit, ~154mm hoch (Blade only)

  // Unten Mitte → rechts unten
  shape.moveTo(-0.42 * s, -1.35 * s)
  shape.lineTo(0.42 * s, -1.35 * s)

  // Rechts unten → rechts mitte (leicht nach aussen)
  shape.lineTo(1.15 * s, -0.5 * s)

  // Rechts mitte → rechts oben
  shape.lineTo(1.35 * s, 0.3 * s)

  // Rechts oben → oben rechts (abgeschraegt)
  shape.lineTo(1.05 * s, 1.15 * s)

  // Oben rechts → oben links
  shape.lineTo(-1.05 * s, 1.15 * s)

  // Oben links → links oben
  shape.lineTo(-1.35 * s, 0.3 * s)

  // Links oben → links mitte
  shape.lineTo(-1.15 * s, -0.5 * s)

  // Links mitte → links unten
  shape.lineTo(-0.42 * s, -1.35 * s)

  return shape
}

function createHandleShape(): THREE.Shape {
  const shape = new THREE.Shape()

  // Flared handle Querschnitt (breiter unten, schmaler oben)
  shape.moveTo(-0.18, -0.15)
  shape.quadraticCurveTo(-0.2, 0, -0.18, 0.15)
  shape.lineTo(0.18, 0.15)
  shape.quadraticCurveTo(0.2, 0, 0.18, -0.15)
  shape.closePath()

  return shape
}

// ---------- Complete Paddle ----------

function CybershapePaddle() {
  const bladeOutline = useMemo(() => createCybershapeOutline(1), [])

  // Blade total thickness: ~6mm wood + 2mm rubber each side = ~10mm
  const woodThickness = 0.06
  const rubberThickness = 0.02
  const totalHalf = (woodThickness + rubberThickness * 2) / 2

  return (
    <group>
      {/* ============ BLADE ============ */}
      <group position={[0, 0.55, 0]}>

        {/* Wood core */}
        <mesh>
          <extrudeGeometry args={[bladeOutline, {
            depth: woodThickness,
            bevelEnabled: true,
            bevelThickness: 0.008,
            bevelSize: 0.01,
            bevelSegments: 2,
          }]} />
          <meshPhysicalMaterial
            color="#6B5230"
            roughness={0.55}
            metalness={0.02}
            clearcoat={0.15}
          />
        </mesh>

        {/* Front rubber (black) */}
        <mesh position={[0, 0, -rubberThickness]}>
          <extrudeGeometry args={[createCybershapeOutline(0.97), {
            depth: rubberThickness,
            bevelEnabled: false,
          }]} />
          <meshPhysicalMaterial
            color="#111111"
            roughness={0.95}
            metalness={0.0}
          />
        </mesh>

        {/* Back rubber (very dark grey) */}
        <mesh position={[0, 0, woodThickness]}>
          <extrudeGeometry args={[createCybershapeOutline(0.97), {
            depth: rubberThickness,
            bevelEnabled: false,
          }]} />
          <meshPhysicalMaterial
            color="#1a1a1a"
            roughness={0.95}
            metalness={0.0}
          />
        </mesh>

        {/* Red edge tape (thin strip around the blade edge) */}
        <mesh position={[0, 0, woodThickness + rubberThickness]}>
          <extrudeGeometry args={[bladeOutline, {
            depth: 0.003,
            bevelEnabled: false,
          }]} />
          <meshPhysicalMaterial
            color="#CC1111"
            roughness={0.5}
            metalness={0.0}
            transparent
            opacity={0.35}
          />
        </mesh>
      </group>

      {/* ============ HANDLE ============ */}
      <group position={[0, -0.25, woodThickness / 2]}>

        {/* Main handle shaft */}
        <mesh rotation={[0, 0, 0]}>
          <cylinderGeometry args={[
            0.16,  // top radius (narrower where meets blade)
            0.22,  // bottom radius (flared)
            1.1,   // length
            8,     // radial segments
          ]} />
          <meshPhysicalMaterial
            color="#3D3838"
            roughness={0.4}
            metalness={0.03}
            clearcoat={0.6}
            clearcoatRoughness={0.25}
          />
        </mesh>

        {/* Gold stripe left */}
        <mesh position={[-0.05, 0.05, 0.155]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.012, 0.95, 0.006]} />
          <meshPhysicalMaterial
            color="#C4841D"
            roughness={0.25}
            metalness={0.7}
            clearcoat={0.9}
          />
        </mesh>

        {/* Gold stripe right */}
        <mesh position={[0.05, 0.05, 0.155]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.012, 0.95, 0.006]} />
          <meshPhysicalMaterial
            color="#A06B15"
            roughness={0.25}
            metalness={0.7}
            clearcoat={0.9}
          />
        </mesh>

        {/* Handle-blade junction (smooth transition piece) */}
        <mesh position={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.18, 0.16, 0.12, 8]} />
          <meshPhysicalMaterial
            color="#3D3838"
            roughness={0.4}
            metalness={0.03}
            clearcoat={0.6}
          />
        </mesh>

        {/* Bottom endcap */}
        <mesh position={[0, -0.57, 0]}>
          <cylinderGeometry args={[0.23, 0.21, 0.04, 8]} />
          <meshPhysicalMaterial
            color="#2D2828"
            roughness={0.35}
            metalness={0.05}
            clearcoat={0.7}
          />
        </mesh>

        {/* Blue Stiga badge */}
        <mesh position={[0, -0.15, 0.18]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.1, 0.13, 0.004]} />
          <meshPhysicalMaterial
            color="#1a3a6a"
            roughness={0.25}
            metalness={0.15}
            clearcoat={0.9}
          />
        </mesh>
      </group>
    </group>
  )
}

// ---------- Interaction: Apple-like smooth rotation ----------

function RotatingPaddle() {
  const groupRef = useRef<THREE.Group>(null)

  const isDragging = useRef(false)
  const prevPointer = useRef({ x: 0, y: 0 })
  const currentRotation = useRef({ x: 0.2, y: 0.4 })
  const targetRotation = useRef({ x: 0.2, y: 0.4 })
  const velocity = useRef({ x: 0, y: 0 })
  const lastInteractionTime = useRef(0)
  const autoBlend = useRef(1)

  const { gl } = useThree()

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    isDragging.current = true
    prevPointer.current = { x: e.clientX, y: e.clientY }
    velocity.current = { x: 0, y: 0 }
    autoBlend.current = 0
    lastInteractionTime.current = Date.now()
    targetRotation.current = { ...currentRotation.current }
    gl.domElement.style.cursor = 'grabbing'
  }, [gl])

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return

    const dx = e.clientX - prevPointer.current.x
    const dy = e.clientY - prevPointer.current.y
    const sens = 0.006

    targetRotation.current.y += dx * sens
    targetRotation.current.x += dy * sens

    // Smooth velocity tracking for momentum
    velocity.current.x = velocity.current.x * 0.6 + dy * sens * 0.4
    velocity.current.y = velocity.current.y * 0.6 + dx * sens * 0.4

    prevPointer.current = { x: e.clientX, y: e.clientY }
    lastInteractionTime.current = Date.now()
  }, [])

  const handlePointerUp = useCallback(() => {
    isDragging.current = false
    lastInteractionTime.current = Date.now()
    gl.domElement.style.cursor = 'grab'
  }, [gl])

  useFrame((state) => {
    if (!groupRef.current) return

    const idle = Date.now() - lastInteractionTime.current > 2000

    if (isDragging.current) {
      // Apple-like: smooth spring follow (lerp factor 0.12 = silky)
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
      // Momentum: decelerate smoothly
      currentRotation.current.x += velocity.current.x
      currentRotation.current.y += velocity.current.y
      velocity.current.x *= 0.965
      velocity.current.y *= 0.965
    } else if (idle) {
      // Auto-rotate: gentle, premium feel
      autoBlend.current = THREE.MathUtils.lerp(autoBlend.current, 1, 0.008)
      const speed = 0.002 * autoBlend.current

      currentRotation.current.y += speed

      const breathe = 0.15 + Math.sin(state.clock.elapsedTime * 0.3) * 0.08
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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        if (isDragging.current) {
          isDragging.current = false
          gl.domElement.style.cursor = 'grab'
        }
      }}
    >
      <CybershapePaddle />
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
      {/* Soft ambient */}
      <ambientLight intensity={0.4} />

      {/* Key light: strong white from upper right */}
      <directionalLight
        position={[4, 6, 5]}
        intensity={1.2}
        color="#ffffff"
        castShadow={false}
      />

      {/* Fill: subtle emerald tint from left */}
      <pointLight position={[-6, 2, 3]} intensity={0.25} color="#10b981" />

      {/* Rim light: defines edges from behind */}
      <pointLight position={[0, 0, -6]} intensity={0.4} color="#e0e0e0" />

      {/* Top accent */}
      <spotLight
        position={[0, 8, 2]}
        angle={0.5}
        penumbra={1}
        intensity={0.3}
        color="#06b6d4"
      />

      <Environment preset="apartment" environmentIntensity={0.3} />
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
        camera={{ position: [0, 0.3, 4.5], fov: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
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
