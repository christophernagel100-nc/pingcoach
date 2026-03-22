'use client'

import { useRef, useState, useEffect, useCallback, Suspense } from 'react'
import { Canvas, useFrame, useThree, useLoader, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

// =============================================================
// Stiga Cybershape — Foto-Textur auf 3D-Plane
// Echtes Produktfoto, Apple-like Interaction
// =============================================================

function PaddleMesh() {
  const texture = useLoader(THREE.TextureLoader, '/paddle-front.png')

  // Hochwertige Textur-Settings
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.anisotropy = 16
  texture.generateMipmaps = true

  // Seitenverhaeltnis 1:1 (1000x1000px) -> Schlaeger ist ca. 60% breit, 100% hoch
  const width = 2.8
  const height = 2.8
  const thickness = 0.06

  return (
    <group>
      {/* Front face — Paddle Foto */}
      <mesh position={[0, 0, thickness / 2 + 0.001]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.1}
          side={THREE.FrontSide}
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>

      {/* Back face — gespiegeltes Foto */}
      <mesh position={[0, 0, -(thickness / 2 + 0.001)]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          transparent
          alphaTest={0.1}
          side={THREE.FrontSide}
          roughness={0.7}
          metalness={0.0}
        />
      </mesh>

      {/* Thin edge (sichtbar bei Seitenansicht) */}
      <mesh>
        <boxGeometry args={[width * 0.58, height * 0.55, thickness]} />
        <meshStandardMaterial
          color="#1a1a1a"
          roughness={0.9}
          metalness={0.0}
        />
      </mesh>

      {/* Handle edge body */}
      <mesh position={[0, -height * 0.32, 0]}>
        <boxGeometry args={[width * 0.14, height * 0.28, thickness * 1.2]} />
        <meshStandardMaterial
          color="#3D3838"
          roughness={0.4}
          metalness={0.05}
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
  const currentRotation = useRef({ x: 0.15, y: 0 })
  const targetRotation = useRef({ x: 0.15, y: 0 })
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

      const breathe = 0.12 + Math.sin(state.clock.elapsedTime * 0.3) * 0.06
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
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 5]} intensity={0.6} color="#ffffff" />
      <pointLight position={[-4, 2, 3]} intensity={0.15} color="#10b981" />
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
          toneMappingExposure: 1.2,
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
