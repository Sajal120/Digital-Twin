'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

export function DragonBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Fire particle system
    class FireParticle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      life: number
      maxLife: number
      hue: number

      constructor(x: number, y: number, intensity: number = 1) {
        this.x = x + (Math.random() - 0.5) * 10
        this.y = y + (Math.random() - 0.5) * 10
        this.size = (Math.random() * 4 + 2) * intensity
        this.speedX = (Math.random() - 0.5) * 3
        this.speedY = (Math.random() - 0.5) * 3
        this.life = 0
        this.maxLife = Math.random() * 40 + 30
        this.hue = 260 + Math.random() * 40 // Purple to pink
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.speedX *= 0.98
        this.speedY *= 0.98
        this.life++
      }

      draw(ctx: CanvasRenderingContext2D) {
        const opacity = (1 - this.life / this.maxLife) * 0.8
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size)
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 70%, ${opacity})`)
        gradient.addColorStop(0.5, `hsla(${this.hue}, 100%, 50%, ${opacity * 0.6})`)
        gradient.addColorStop(1, `hsla(${this.hue - 20}, 100%, 40%, 0)`)

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }

      isDead() {
        return this.life >= this.maxLife
      }
    }

    // Dragon scale particle
    class ScaleParticle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      life: number
      maxLife: number
      rotation: number
      rotationSpeed: number

      constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.size = Math.random() * 2 + 1
        this.speedX = (Math.random() - 0.5) * 1.5
        this.speedY = (Math.random() - 0.5) * 1.5
        this.life = 0
        this.maxLife = Math.random() * 60 + 40
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.1
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.rotation += this.rotationSpeed
        this.life++
      }

      draw(ctx: CanvasRenderingContext2D) {
        const opacity = (1 - this.life / this.maxLife) * 0.6
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)

        // Diamond-shaped scale
        ctx.fillStyle = `rgba(147, 51, 234, ${opacity})`
        ctx.beginPath()
        ctx.moveTo(0, -this.size)
        ctx.lineTo(this.size * 0.6, 0)
        ctx.lineTo(0, this.size)
        ctx.lineTo(-this.size * 0.6, 0)
        ctx.closePath()
        ctx.fill()

        // Highlight
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.5})`
        ctx.beginPath()
        ctx.arc(-this.size * 0.2, -this.size * 0.3, this.size * 0.3, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
      }

      isDead() {
        return this.life >= this.maxLife
      }
    }

    // Dragon body segment
    class DragonSegment {
      x: number
      y: number
      radius: number
      angle: number

      constructor(x: number, y: number, radius: number, angle: number) {
        this.x = x
        this.y = y
        this.radius = radius
        this.angle = angle
      }

      draw(ctx: CanvasRenderingContext2D, nextSegment?: DragonSegment) {
        // Draw body segment with gradient
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius)
        gradient.addColorStop(0, 'rgba(147, 51, 234, 1)')
        gradient.addColorStop(0.3, 'rgba(126, 34, 206, 0.95)')
        gradient.addColorStop(0.7, 'rgba(107, 33, 168, 0.8)')
        gradient.addColorStop(1, 'rgba(88, 28, 135, 0.6)')

        ctx.fillStyle = gradient
        ctx.shadowBlur = 20
        ctx.shadowColor = 'rgba(168, 85, 247, 0.8)'
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.fill()

        // Draw scales texture
        for (let i = 0; i < 3; i++) {
          const scaleAngle = this.angle + (i * Math.PI * 2) / 3
          const scaleX = this.x + Math.cos(scaleAngle) * this.radius * 0.6
          const scaleY = this.y + Math.sin(scaleAngle) * this.radius * 0.6

          ctx.fillStyle = 'rgba(168, 85, 247, 0.4)'
          ctx.beginPath()
          ctx.arc(scaleX, scaleY, this.radius * 0.25, 0, Math.PI * 2)
          ctx.fill()
        }

        // Draw connection to next segment
        if (nextSegment) {
          const gradient = ctx.createLinearGradient(this.x, this.y, nextSegment.x, nextSegment.y)
          gradient.addColorStop(0, 'rgba(147, 51, 234, 0.8)')
          gradient.addColorStop(1, 'rgba(126, 34, 206, 0.8)')

          ctx.strokeStyle = gradient
          ctx.lineWidth = this.radius * 1.5
          ctx.lineCap = 'round'
          ctx.shadowBlur = 15
          ctx.shadowColor = 'rgba(168, 85, 247, 0.6)'
          ctx.beginPath()
          ctx.moveTo(this.x, this.y)
          ctx.lineTo(nextSegment.x, nextSegment.y)
          ctx.stroke()
        }

        ctx.shadowBlur = 0
      }
    }

    // Enhanced Dragon with body segments
    class Dragon {
      segments: DragonSegment[] = []
      angle: number = 0
      speed: number = 0.015
      wingFlap: number = 0
      wingFlapSpeed: number = 0.1
      breatheFire: boolean = false
      fireTimer: number = 0

      constructor() {
        // Initialize segments
        for (let i = 0; i < 12; i++) {
          this.segments.push(new DragonSegment(0, 0, 15 - i * 0.8, 0))
        }
      }

      update() {
        this.angle += this.speed
        this.wingFlap += this.wingFlapSpeed
        this.fireTimer++

        // Breathe fire periodically
        if (this.fireTimer % 200 === 0) {
          this.breatheFire = true
          setTimeout(() => (this.breatheFire = false), 1000)
        }

        const centerX = canvas?.width ? canvas.width / 2 : 400
        const centerY = canvas?.height ? canvas.height / 2 : 300
        const radiusX = canvas?.width ? canvas.width / 3.5 : 200
        const radiusY = canvas?.height ? canvas.height / 3.5 : 150

        // Update head position (figure-8 pattern)
        const t = this.angle
        const scale = Math.sin(t * 0.5) * 0.3 + 1 // Pulsing effect
        const headX = centerX + radiusX * Math.sin(t) * Math.cos(t) * scale
        const headY = centerY + radiusY * Math.sin(t) * scale

        this.segments[0].x = headX
        this.segments[0].y = headY
        this.segments[0].angle = t

        // Update body segments to follow head
        for (let i = 1; i < this.segments.length; i++) {
          const target = this.segments[i - 1]
          const current = this.segments[i]

          const dx = target.x - current.x
          const dy = target.y - current.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const targetDistance = 18

          if (distance > targetDistance) {
            const ratio = (distance - targetDistance) / distance
            current.x += dx * ratio * 0.4
            current.y += dy * ratio * 0.4
          }

          current.angle = Math.atan2(dy, dx)
        }

        return { x: headX, y: headY }
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Draw body segments from tail to head
        for (let i = this.segments.length - 1; i >= 0; i--) {
          const nextSegment = i > 0 ? this.segments[i - 1] : undefined
          this.segments[i].draw(ctx, nextSegment)
        }

        // Draw head details
        const head = this.segments[0]

        // Draw wings
        const wingAngle = Math.sin(this.wingFlap) * 0.3
        this.drawWing(ctx, head.x, head.y, head.angle, wingAngle, 1)
        this.drawWing(ctx, head.x, head.y, head.angle, wingAngle, -1)

        // Draw dragon head
        const headGradient = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 20)
        headGradient.addColorStop(0, 'rgba(168, 85, 247, 1)')
        headGradient.addColorStop(0.5, 'rgba(147, 51, 234, 1)')
        headGradient.addColorStop(1, 'rgba(126, 34, 206, 0.8)')

        ctx.fillStyle = headGradient
        ctx.shadowBlur = 30
        ctx.shadowColor = '#a855f7'
        ctx.beginPath()
        ctx.arc(head.x, head.y, 18, 0, Math.PI * 2)
        ctx.fill()

        // Draw horns
        this.drawHorn(ctx, head.x - 8, head.y - 12, head.angle)
        this.drawHorn(ctx, head.x + 8, head.y - 12, head.angle)

        // Draw eyes
        const eyeGlow = Math.sin(this.angle * 5) * 0.3 + 0.7
        ctx.fillStyle = `rgba(255, 100, 255, ${eyeGlow})`
        ctx.shadowBlur = 15
        ctx.shadowColor = '#ff00ff'
        ctx.beginPath()
        ctx.arc(head.x - 6, head.y - 4, 3, 0, Math.PI * 2)
        ctx.arc(head.x + 6, head.y - 4, 3, 0, Math.PI * 2)
        ctx.fill()

        // Pupils
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.arc(head.x - 6, head.y - 4, 1.5, 0, Math.PI * 2)
        ctx.arc(head.x + 6, head.y - 4, 1.5, 0, Math.PI * 2)
        ctx.fill()

        // Draw mouth/snout
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(head.x, head.y + 8, 8, 0.2, Math.PI - 0.2)
        ctx.stroke()

        ctx.shadowBlur = 0
      }

      drawWing(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        bodyAngle: number,
        flapAngle: number,
        side: number,
      ) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(bodyAngle + side * (Math.PI / 4 + flapAngle))

        // Wing gradient
        const wingGradient = ctx.createLinearGradient(0, 0, 30, -20)
        wingGradient.addColorStop(0, 'rgba(147, 51, 234, 0.7)')
        wingGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.5)')
        wingGradient.addColorStop(1, 'rgba(192, 132, 252, 0.3)')

        ctx.fillStyle = wingGradient
        ctx.shadowBlur = 15
        ctx.shadowColor = 'rgba(168, 85, 247, 0.5)'

        // Wing shape
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.quadraticCurveTo(20, -15, 35, -25)
        ctx.quadraticCurveTo(30, -10, 25, 0)
        ctx.quadraticCurveTo(15, -8, 0, 0)
        ctx.closePath()
        ctx.fill()

        // Wing membrane lines
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(5, -2)
        ctx.lineTo(20, -18)
        ctx.moveTo(12, -4)
        ctx.lineTo(28, -22)
        ctx.stroke()

        ctx.restore()
      }

      drawHorn(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) {
        const hornGradient = ctx.createLinearGradient(x, y, x, y - 15)
        hornGradient.addColorStop(0, 'rgba(168, 85, 247, 1)')
        hornGradient.addColorStop(1, 'rgba(219, 39, 119, 0.8)')

        ctx.fillStyle = hornGradient
        ctx.shadowBlur = 10
        ctx.shadowColor = 'rgba(168, 85, 247, 0.8)'
        ctx.beginPath()
        ctx.moveTo(x - 3, y)
        ctx.lineTo(x, y - 15)
        ctx.lineTo(x + 3, y)
        ctx.closePath()
        ctx.fill()
        ctx.shadowBlur = 0
      }

      getHeadPosition() {
        return { x: this.segments[0].x, y: this.segments[0].y }
      }

      isBreathingFire() {
        return this.breatheFire
      }
    }

    // Floating energy orbs
    class Orb {
      x: number
      y: number
      radius: number
      speedX: number
      speedY: number
      hue: number
      pulsePhase: number

      constructor() {
        this.x = Math.random() * (canvas?.width || 800)
        this.y = Math.random() * (canvas?.height || 600)
        this.radius = Math.random() * 30 + 15
        this.speedX = (Math.random() - 0.5) * 0.3
        this.speedY = (Math.random() - 0.5) * 0.3
        this.hue = Math.random() * 60 + 260
        this.pulsePhase = Math.random() * Math.PI * 2
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY
        this.pulsePhase += 0.05

        if (this.x < 0 || this.x > (canvas?.width || 800)) this.speedX *= -1
        if (this.y < 0 || this.y > (canvas?.height || 600)) this.speedY *= -1
      }

      draw(ctx: CanvasRenderingContext2D) {
        const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7
        const currentRadius = this.radius * pulse

        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, currentRadius)
        gradient.addColorStop(0, `hsla(${this.hue}, 100%, 70%, 0.4)`)
        gradient.addColorStop(0.5, `hsla(${this.hue}, 100%, 60%, 0.2)`)
        gradient.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Initialize
    const fireParticles: FireParticle[] = []
    const scaleParticles: ScaleParticle[] = []
    const dragon = new Dragon()
    const orbs: Orb[] = []

    // Create floating orbs
    for (let i = 0; i < 8; i++) {
      orbs.push(new Orb())
    }

    // Animation loop
    let animationFrameId: number

    const animate = () => {
      // Semi-transparent background for trail effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw orbs
      orbs.forEach((orb) => {
        orb.update()
        orb.draw(ctx)
      })

      // Update dragon
      const dragonHead = dragon.update()

      // Create fire particles if dragon is breathing fire
      if (dragon.isBreathingFire()) {
        for (let i = 0; i < 5; i++) {
          fireParticles.push(new FireParticle(dragonHead.x, dragonHead.y, 1.5))
        }
      }

      // Create scale particles along dragon body
      if (Math.random() < 0.3) {
        const randomSegment = dragon.segments[Math.floor(Math.random() * dragon.segments.length)]
        scaleParticles.push(new ScaleParticle(randomSegment.x, randomSegment.y))
      }

      // Update and draw fire particles
      for (let i = fireParticles.length - 1; i >= 0; i--) {
        fireParticles[i].update()
        fireParticles[i].draw(ctx)
        if (fireParticles[i].isDead()) {
          fireParticles.splice(i, 1)
        }
      }

      // Update and draw scale particles
      for (let i = scaleParticles.length - 1; i >= 0; i--) {
        scaleParticles[i].update()
        scaleParticles[i].draw(ctx)
        if (scaleParticles[i].isDead()) {
          scaleParticles.splice(i, 1)
        }
      }

      // Draw dragon
      dragon.draw(ctx)

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <>
      {/* Canvas for 3D-like animation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Animated grid background */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(147, 51, 234, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 51, 234, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '50px 50px'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Floating particles overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-purple-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-slate-900/30 pointer-events-none" />
    </>
  )
}
