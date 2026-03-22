'use client'

import { useRef, useState, useEffect, useCallback, Suspense } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Environment, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// ---------- Paddle Blade (Rounded rectangular shape) ----------

function PaddleBlade() {
  return (
    <group position={[0, 0.6, 0]}>
      {/* Wooden core */}
      <mesh>
        <cylinderGeometry args={[1.35, 1.35, 0.08, 64]} />
        <meshPhysicalMaterial
          color="#8B6914"
          roughness={0.6}
          metalness={0.05}
          clearcoat={0.3}
        />
      </mesh>

      {/* Red rubber (front) */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[1.32, 1.32, 0.02, 64]} />
        <meshPhysicalMaterial
          color="#DC2626"
          roughness={0.85}
          metalness={0.0}
          clearcoat={0.1}
        />
      </mesh>

      {/* Black rubber (back) */}
      <mesh position={[0, -0.045, 0]}>
        <cylinderGeometry args={[1.32, 1.32, 0.02, 64]} />
        <meshPhysicalMaterial
          color="#1a1a1a"
          roughness={0.9}
          metalness={0.0}
          clearcoat={0.05}
        />
      </mesh>

      {/* Edge tape (white) */}
      <mesh>
        <torusGeometry args={[1.335, 0.05, 8, 64]} />
        <meshPhysicalMaterial
          color="#ffffff"
          roughness={0.5}
          metalness={0.0}
        />
      </mesh>
    </group>
  )
}

// ---------- Handle ----------

function PaddleHandle() {
  return (
    <group position={[0, -1.0, 0]}>
      {/* Main handle (flared) */}
      <mesh>
        <cylinderGeometry args={[0.22, 0.28, 1.2, 16]} />
        <meshPhysicalMaterial
          color="#5C3A0E"
          roughness={0.5}
          metalness={0.05}
          clearcoat={0.4}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* Handle grip texture rings */}
      {[0.3, 0.1, -0.1, -0.3].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.26, 0.015, 8, 16]} />
          <meshPhysicalMaterial
            color="#3D2408"
            roughness={0.7}
            metalness={0.0}
          />
        </mesh>
      ))}

      {/* Bottom cap */}
      <mesh position={[0, -0.62, 0]}>
        <cylinderGeometry args={[0.29, 0.26, 0.05, 16]} />
        <meshPhysicalMaterial
          color="#3D2408"
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
    </group>
  )
}

// ---------- Rotating Paddle with drag interaction ----------

function RotatingPaddle() {
  const groupRef = useRef<THREE.Group>(null)

  const isDragging = useRef(false)
  const prevPointer = useRef({ x: 0, y: 0 })
  const targetRotation = useRef({ x: 0.3, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })
  const lastInteractionTime = useRef(0)
  const autoRotationBlend = useRef(1)

  const { gl } = useThree()

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    isDragging.current = true
    prevPointer.current = { x: e.clientX, y: e.clientY }
    velocity.current = { x: 0, y: 0 }
    autoRotationBlend.current = 0
    lastInteractionTime.current = Date.now()

    if (groupRef.current) {
      targetRotation.current = {
        x: groupRef.current.rotation.x,
        y: groupRef.current.rotation.y,
      }
    }

    gl.domElement.style.cursor = 'grabbing'
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return

    const deltaX = e.clientX - prevPointer.current.x
    const deltaY = e.clientY - prevPointer.current.y

    const sensitivity = 0.008
    targetRotation.current.x += deltaY * sensitivity
    targetRotation.current.y += deltaX * sensitivity

    velocity.current = {
      x: velocity.current.x * 0.5 + deltaY * sensitivity * 0.5,
      y: velocity.current.y * 0.5 + deltaX * sensitivity * 0.5,
    }

    prevPointer.current = { x: e.clientX, y: e.clientY }
    lastInteractionTime.current = Date.now()
  }

  const handlePointerUp = () => {
    isDragging.current = false
    lastInteractionTime.current = Date.now()
    gl.domElement.style.cursor = 'grab'
  }

  useFrame((state) => {
    if (!groupRef.current) return

    const timeSinceInteraction = Date.now() - lastInteractionTime.current
    const isIdle = timeSinceInteraction > 2500

    if (isDragging.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetRotation.current.x,
        0.25
      )
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation.current.y,
        0.25
      )
    } else if (
      Math.abs(velocity.current.x) > 0.0001 ||
      Math.abs(velocity.current.y) > 0.0001
    ) {
      groupRef.current.rotation.y += velocity.current.y
      groupRef.current.rotation.x += velocity.current.x
      velocity.current.x *= 0.95
      velocity.current.y *= 0.95
    } else if (isIdle) {
      autoRotationBlend.current = THREE.MathUtils.lerp(
        autoRotationBlend.current,
        1,
        0.01
      )
      const speed = 0.004 * autoRotationBlend.current
      groupRef.current.rotation.y += speed

      // Gentle tilt oscillation
      const targetX = 0.3 + Math.sin(state.clock.elapsedTime * 0.5) * 0.15
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetX,
        0.015 * autoRotationBlend.current
      )
    }
  })

  return (
    <group
      ref={groupRef}
      rotation={[0.3, 0, 0.1]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOut={() => {
        if (isDragging.current) {
          isDragging.current = false
          gl.domElement.style.cursor = 'grab'
        }
      }}
    >
      <PaddleBlade />
      <PaddleHandle />
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
      if (frameCount.current >= 2) {
        reported.current = true
        onReady?.()
      }
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#0a0a12', '#10b981', 0.3]} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-8, -5, -8]} intensity={0.3} color="#10b981" />
      <spotLight
        position={[5, 8, 5]}
        angle={0.3}
        penumbra={1}
        intensity={0.6}
        color="#06b6d4"
      />

      <Environment preset="night" />
      <RotatingPaddle />
    </>
  )
}

// ---------- Exported component ----------

export default function InteractivePaddle() {
  const [isClient, setIsClient] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

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
      className="interactive-paddle-container"
      style={{
        width: '100%',
        height: '100%',
        opacity: isReady ? 1 : 0,
        transition: 'opacity 0.6s ease-out',
        touchAction: 'none',
        cursor: 'grab',
      }}
    >
      <Canvas
        camera={{ position: [0, 0.5, 6], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
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
