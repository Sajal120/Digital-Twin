'use client'

import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Flying Dragon
function FlyingDragon() {
  const dragonRef = useRef<THREE.Group>(null)
  const wingsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (dragonRef.current) {
      // Orbit around the center
      const time = state.clock.elapsedTime * 0.4
      const radius = 3
      dragonRef.current.position.x = Math.cos(time) * radius
      dragonRef.current.position.z = Math.sin(time) * radius
      dragonRef.current.position.y = Math.sin(time * 2) * 0.5 // Gentle up/down motion

      // Face the direction of movement
      dragonRef.current.rotation.y = -time + Math.PI / 2

      // Add tilt during flight
      dragonRef.current.rotation.z = Math.sin(time * 2) * 0.2
    }

    // Wing flapping animation
    if (wingsRef.current) {
      const wingFlap = Math.sin(state.clock.elapsedTime * 5) * 0.5
      wingsRef.current.rotation.z = wingFlap
    }
  })

  return (
    <group ref={dragonRef}>
      {/* Dragon Body */}
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.15, 0.6, 8, 16]} />
        <meshStandardMaterial
          color="#ff4466"
          emissive="#ff0033"
          emissiveIntensity={0.6}
          metalness={0.3}
        />
      </mesh>

      {/* Dragon Head */}
      <mesh position={[0, 0, 0.45]}>
        <coneGeometry args={[0.2, 0.3, 8]} />
        <meshStandardMaterial color="#ff6688" emissive="#ff0033" emissiveIntensity={0.6} />
      </mesh>

      {/* Dragon Tail */}
      <mesh position={[0, 0, -0.5]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.08, 0.5, 8]} />
        <meshStandardMaterial color="#cc0033" emissive="#ff0033" emissiveIntensity={0.5} />
      </mesh>

      {/* Wings */}
      <group ref={wingsRef}>
        {/* Left Wing */}
        <mesh position={[-0.3, 0, 0]} rotation={[0, 0, -0.5]}>
          <boxGeometry args={[0.8, 0.02, 0.4]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#6d28d9"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* Right Wing */}
        <mesh position={[0.3, 0, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.8, 0.02, 0.4]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#6d28d9"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>

      {/* Fire Breath Effect - particles trailing behind */}
      <mesh position={[0, 0, 0.6]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color="#ffa500"
          emissive="#ff6600"
          emissiveIntensity={1.5}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  )
}

// Orbiting particles in a circle (energy trails)
function OrbitingParticles() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  const particles = []
  const radius = 2.5
  const count = 20

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius

    // Alternate colors between cyan and red
    const color = i % 2 === 0 ? '#00d4ff' : '#ff4466'

    particles.push(
      <mesh key={i} position={[x, 0, z]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>,
    )
  }

  return <group ref={groupRef}>{particles}</group>
}

// Floating rings
function FloatingRings() {
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = state.clock.elapsedTime * 0.2
      ring1Ref.current.rotation.y = state.clock.elapsedTime * 0.3
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = state.clock.elapsedTime * -0.15
      ring2Ref.current.rotation.z = state.clock.elapsedTime * 0.25
    }
  })

  return (
    <>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2, 0.05, 16, 100]} />
        <meshStandardMaterial
          color="#00d4ff"
          emissive="#00d4ff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.3, 0.03, 16, 100]} />
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.3}
          transparent
          opacity={0.4}
        />
      </mesh>
    </>
  )
}

// Central sphere with gradient effect
function CentralSphere() {
  const sphereRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <mesh ref={sphereRef}>
      <sphereGeometry args={[1.5, 32, 32]} />
      <meshStandardMaterial
        color="#6366f1"
        emissive="#4f46e5"
        emissiveIntensity={0.2}
        transparent
        opacity={0.3}
      />
    </mesh>
  )
}

export default function Animated3DBackground() {
  return (
    <div className="absolute inset-0 w-full h-full opacity-50">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[5, 5, 5]} intensity={1.2} color="#00d4ff" />
        <pointLight position={[-5, -5, -5]} intensity={0.8} color="#ff4466" />
        <spotLight position={[0, 5, 0]} intensity={0.5} color="#ffa500" />
        <FlyingDragon />
        <CentralSphere />
        <OrbitingParticles />
        <FloatingRings />
      </Canvas>
    </div>
  )
}
