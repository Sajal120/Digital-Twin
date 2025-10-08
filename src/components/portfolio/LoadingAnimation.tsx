import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface LoadingAnimationProps {
  onComplete: () => void
}

// 3D Rotating Mesh for background
function RotatingMesh() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[1, 0.3, 100, 16]} />
      <meshStandardMaterial color="#8b5cf6" wireframe />
    </mesh>
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

    // Animate logo entrance
    tl.fromTo(
      logoRef.current,
      { opacity: 0, y: 50, scale: 0.8 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' },
    )

    // Animate progress counter
    tl.to(
      {},
      {
        duration: 3,
        onUpdate: function () {
          const prog = Math.round(this.progress() * 100)
          setProgress(prog)

          if (progressBarRef.current) {
            gsap.to(progressBarRef.current, {
              width: `${prog}%`,
              duration: 0.1,
              ease: 'linear',
            })
          }

          if (percentageRef.current) {
            percentageRef.current.textContent = `${prog}%`
          }
        },
        onComplete: () => {
          // Fade out preloader
          gsap.to(preloaderRef.current, {
            opacity: 0,
            duration: 0.5,
            onComplete: () => {
              onComplete()
            },
          })
        },
      },
      '+=0.2',
    )

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
      <div className="absolute inset-0 opacity-30">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <RotatingMesh />
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
