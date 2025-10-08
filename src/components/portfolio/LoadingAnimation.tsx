import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LoadingAnimationProps {
  onComplete: () => void
}

// 3D Rotating Cube (Wireframe Box)
function LoadingCube() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.7
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshBasicMaterial color="#00d4ff" wireframe />
    </mesh>
  )
}

// Orbiting Particles (8 spheres)
function OrbitingParticles() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5
    }
  })

  const particles = []
  const radius = 3
  const count = 8

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    particles.push(
      <mesh key={i} position={[x, 0, z]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.5} />
      </mesh>,
    )
  }

  return <group ref={groupRef}>{particles}</group>
}

// Floating Rings (2 torus geometries)
function FloatingRings() {
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = state.clock.elapsedTime * 0.3
      ring1Ref.current.rotation.y = state.clock.elapsedTime * 0.2
      ring1Ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = state.clock.elapsedTime * -0.2
      ring2Ref.current.rotation.z = state.clock.elapsedTime * 0.4
      ring2Ref.current.position.y = Math.cos(state.clock.elapsedTime * 0.5) * 0.5
    }
  })

  return (
    <>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2, 0.1, 16, 100]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.5, 0.05, 16, 100]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.3} />
      </mesh>
    </>
  )
}

const LoadingAnimation = ({ onComplete }: LoadingAnimationProps) => {
  const [progress, setProgress] = useState(0)
  const preloaderRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const percentageRef = useRef<HTMLDivElement>(null)

  const content = {
    name: 'Sajal Basnet',
    subtitle: 'AI & IT Enthusiast',
    status_messages: [
      'Initializing development environment...',
      'Loading AI-enhanced tools...',
      'Configuring security protocols...',
      'Setting up IT infrastructure...',
      'Optimizing system performance...',
      'Ready to innovate...',
    ],
  }

  // Get status message based on progress
  const getStatusMessage = (progress: number) => {
    const messages = content.status_messages
    const progressPercentage = Math.floor(progress / (100 / messages.length))
    const index = Math.min(progressPercentage, messages.length - 1)
    return messages[index] || messages[0]
  }

  useEffect(() => {
    const tl = gsap.timeline()
    const canvasContainer = document.querySelector('.loading-3d-canvas')

    // Animate canvas entrance
    tl.fromTo(
      canvasContainer,
      { opacity: 0, scale: 0.8 },
      { opacity: 0.4, scale: 1, duration: 1.2, ease: 'back.out(1.7)' },
    )

    // Animate logo and percentage entrance
    tl.fromTo(
      [logoRef.current, percentageRef.current],
      { opacity: 0, y: 50, scale: 0.8 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1,
        ease: 'back.out(1.7)',
        stagger: 0.2,
      },
      '-=0.6',
    )

    // Animate progress bar with percentage updates
    const updateProgress = () => {
      const prog = Math.round((tl.progress() / tl.duration()) * 100)
      setProgress(prog)
      if (percentageRef.current) {
        percentageRef.current.textContent = `${prog}%`
      }
    }

    tl.to(
      progressBarRef.current,
      {
        width: '100%',
        duration: 3,
        ease: 'power2.out',
        onUpdate: updateProgress,
      },
      '-=0.2',
    )

    // Fade out logo and percentage
    tl.to(
      [logoRef.current, percentageRef.current],
      {
        opacity: 0,
        y: -50,
        scale: 0.8,
        duration: 0.8,
        ease: 'power2.in',
      },
      '+=0.5',
    )

    // Fade out entire preloader
    tl.to(preloaderRef.current, {
      opacity: 0,
      duration: 0.8,
      onComplete: () => {
        onComplete()
      },
    })

    return () => {
      tl.kill()
    }
  }, [onComplete])

  return (
    <div
      ref={preloaderRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden"
    >
      {/* 3D Canvas Background */}
      <div className="loading-3d-canvas absolute inset-0 opacity-40">
        <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[5, 5, 5]} intensity={1} color="#00d4ff" />
          <pointLight position={[-5, -5, -5]} intensity={0.5} color="#8b5cf6" />
          <LoadingCube />
          <OrbitingParticles />
          <FloatingRings />
        </Canvas>
      </div>

      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-20 grid-rows-20 w-full h-full">
          {[...Array(400)].map((_, i) => (
            <div
              key={i}
              className="border border-blue-400/20"
              style={{
                animationDelay: `${Math.random() * 3}s`,
                animation: `pulse 3s infinite ${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {/* Logo/Name */}
        <div ref={logoRef} className="mb-12">
          <h1 className="text-7xl md:text-9xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {content.name}
            </span>
          </h1>
          <div className="relative">
            <p className="text-2xl text-gray-400 font-light tracking-wider">{content.subtitle}</p>
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 via-purple-500/20 to-pink-500/20 opacity-20 blur-xl rounded-full" />
          </div>
        </div>

        {/* Progress bar container */}
        <div className="w-full max-w-md mx-auto mb-8">
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              ref={progressBarRef}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
              style={{ width: '0%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Percentage */}
        <div ref={percentageRef} className="text-4xl font-bold text-white mb-6">
          0%
        </div>

        {/* Status message */}
        <div className="text-gray-400 text-sm">{getStatusMessage(progress)}</div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-10 left-10 w-20 h-20 border-l-2 border-t-2 border-blue-400/30" />
      <div className="absolute top-10 right-10 w-20 h-20 border-r-2 border-t-2 border-purple-400/30" />
      <div className="absolute bottom-10 left-10 w-20 h-20 border-l-2 border-b-2 border-purple-400/30" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-r-2 border-b-2 border-pink-400/30" />
    </div>
  )
}

export default LoadingAnimation
