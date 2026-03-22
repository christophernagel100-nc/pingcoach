'use client'

import { useRef, useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'

// ---------- Cybershape Blade Geometry (Hexagonal/Octagonal) ----------

function createBladeShape(): THREE.Shape {
  const shape = new THREE.Shape()

  // Stiga Cybershape: hexagonal with cut corners
  // Proportions based on real paddle (~158mm wide, ~150mm tall blade)
  const w = 1.4  // half width
  const h = 1.5  // half height (top to bottom of blade)
  const cut = 0.45 // corner cut size

  // Start bottom-left where blade meets handle
  shape.moveTo(-0.45, -h + 0.3)

  // Bottom edge (narrower, connects to handle)
  shape.lineTo(-0.55, -h + 0.6)

  // Left side going up
  shape.lineTo(-w, -h + 1.2)

  // Top-left corner (cut)
  shape.lineTo(-w, h - cut)
  shape.lineTo(-w + cut * 0.6, h)

  // Top edge
  shape.lineTo(w - cut * 0.6, h)

  // Top-right corner (cut)
  shape.lineTo(w, h - cut)

  // Right side going down
  shape.lineTo(w, -h + 1.2)

  // Bottom-right
  shape.lineTo(0.55, -h + 0.6)
  shape.lineTo(0.45, -h + 0.3)

  shape.closePath()
  return shape
}

// ---------- Blade Component ----------

function CybershapeBlade() {
  const bladeShape = useMemo(() => createBladeShape(), [])

  const extrudeSettings = useMemo(() => ({
    steps: 1,
    depth: 0.07,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.02,
    bevelSegments: 3,
  }), [])

  return (
    <group position={[0, 0.85, 0]}>
      {/* Wooden core */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <extrudeGeometry args={[bladeShape, extrudeSettings]} />
        <meshPhysicalMaterial
          color="#5C4A2A"
          roughness={0.65}
          metalness={0.02}
          clearcoat={0.2}
        />
      </mesh>

      {/* Black rubber FRONT */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.045]}>
        <extrudeGeometry args={[bladeShape, {
          steps: 1,
          depth: 0.015,
          bevelEnabled: false,
        }]} />
        <meshPhysicalMaterial
          color="#1a1a1a"
          roughness={0.92}
          metalness={0.0}
          clearcoat={0.02}
        />
      </mesh>

      {/* Black rubber BACK (slightly lighter for depth) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.07]}>
        <extrudeGeometry args={[bladeShape, {
          steps: 1,
          depth: 0.015,
          bevelEnabled: false,
        }]} />
        <meshPhysicalMaterial
          color="#222222"
          roughness={0.92}
          metalness={0.0}
          clearcoat={0.02}
        />
      </mesh>

      {/* Red edge strip (visible between rubber sheets) */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.065]}>
        <extrudeGeometry args={[bladeShape, {
          steps: 1,
          depth: 0.005,
          bevelEnabled: true,
          bevelThickness: 0.005,
          bevelSize: 0.005,
          bevelSegments: 1,
        }]} />
        <meshPhysicalMaterial
          color="#DC2626"
          roughness={0.5}
          metalness={0.0}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  )
}

// ---------- Handle (Flared Stiga style with gold stripes) ----------

function CybershapeHandle() {
  return (
    <group position={[0, -0.75, 0.035]}>
      {/* Main handle — flared shape, dark wood */}
      <mesh>
        <cylinderGeometry args={[0.2, 0.28, 1.1, 6]} />
        <meshPhysicalMaterial
          color="#3A3535"
          roughness={0.45}
          metalness={0.05}
          clearcoat={0.5}
          clearcoatRoughness={0.3}
        />
      </mesh>

      {/* Gold accent stripe LEFT */}
      <mesh position={[-0.06, 0, 0.18]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.015, 1.0, 0.01]} />
        <meshPhysicalMaterial
          color="#C4841D"
          roughness={0.3}
          metalness={0.6}
          clearcoat={0.8}
        />
      </mesh>

      {/* Gold accent stripe RIGHT */}
      <mesh position={[0.06, 0, 0.18]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.015, 1.0, 0.01]} />
        <meshPhysicalMaterial
          color="#B8860B"
          roughness={0.3}
          metalness={0.6}
          clearcoat={0.8}
        />
      </mesh>

      {/* Handle neck (where blade meets handle) */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.25, 0.2, 0.15, 6]} />
        <meshPhysicalMaterial
          color="#3A3535"
          roughness={0.45}
          metalness={0.05}
          clearcoat={0.5}
        />
      </mesh>

      {/* Bottom endcap */}
      <mesh position={[0, -0.58, 0]}>
        <cylinderGeometry args={[0.29, 0.27, 0.06, 6]} />
        <meshPhysicalMaterial
          color="#2A2525"
          roughness={0.4}
          metalness={0.08}
          clearcoat={0.6}
        />
      </mesh>

      {/* Stiga badge area (small blue rectangle) */}
      <mesh position={[0, -0.15, 0.22]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.12, 0.15, 0.005]} />
        <meshPhysicalMaterial
          color="#1e3a5f"
          roughness={0.3}
          metalness={0.2}
          clearcoat={0.9}
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
  const targetRotation = useRef({ x: 0.2, y: 0 })
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
      // Slow elegant rotation
      const speed = 0.003 * autoRotationBlend.current
      groupRef.current.rotation.y += speed

      // Gentle tilt
      const targetX = 0.15 + Math.sin(state.clock.elapsedTime * 0.4) * 0.1
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        targetX,
        0.012 * autoRotationBlend.current
      )
    }
  })

  return (
    <group
      ref={groupRef}
      rotation={[0.15, 0.3, 0.05]}
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
      <CybershapeBlade />
      <CybershapeHandle />
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
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#1a1a2e', '#10b981', 0.25]} />

      {/* Main key light */}
      <directionalLight position={[5, 8, 5]} intensity={1.0} color="#ffffff" />

      {/* Fill light (subtle emerald tint) */}
      <pointLight position={[-5, 3, -5]} intensity={0.3} color="#10b981" />

      {/* Rim light for edge definition */}
      <pointLight position={[0, -3, 8]} intensity={0.4} color="#ffffff" />

      {/* Subtle top accent */}
      <spotLight
        position={[3, 10, 3]}
        angle={0.4}
        penumbra={1}
        intensity={0.5}
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
        camera={{ position: [0, 0.5, 5.5], fov: 45 }}
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
