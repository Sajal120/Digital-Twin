'use client'

import { useEffect, useRef } from 'react'

export function ChatboxDragon() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to match parent
    const resize = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }
    resize()
    window.addEventListener('resize', resize)

    // Mini dragon for chatbox
    class MiniDragon {
      x: number = 0
      y: number = 0
      angle: number = 0
      speed: number = 0.02
      segments: { x: number; y: number; size: number }[] = []
      breatheFire: boolean = false
      fireTimer: number = 0
      scale: number = 0.6 // Smaller for chatbox

      constructor() {
        // Initialize 8 body segments (smaller dragon)
        for (let i = 0; i < 8; i++) {
          this.segments.push({
            x: 0,
            y: 0,
            size: 12 - i * 1.2,
          })
        }
      }

      update() {
        this.angle += this.speed
        this.fireTimer++

        // Fire every 3 seconds
        if (this.fireTimer % 150 === 0) {
          this.breatheFire = true
          setTimeout(() => (this.breatheFire = false), 800)
        }

        // Elliptical path around the chat area
        const centerX = canvas?.width ? canvas.width / 2 : 400
        const centerY = canvas?.height ? canvas.height / 2 : 300
        const radiusX = canvas?.width ? Math.min(canvas.width * 0.35, 200) : 140
        const radiusY = canvas?.height ? Math.min(canvas.height * 0.35, 150) : 105

        this.x = centerX + radiusX * Math.cos(this.angle)
        this.y = centerY + radiusY * Math.sin(this.angle) * 0.8

        // Update body segments
        this.segments[0].x = this.x
        this.segments[0].y = this.y

        for (let i = 1; i < this.segments.length; i++) {
          const target = this.segments[i - 1]
          const current = this.segments[i]

          const dx = target.x - current.x
          const dy = target.y - current.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const targetDistance = 10

          if (distance > targetDistance) {
            const ratio = (distance - targetDistance) / distance
            current.x += dx * ratio * 0.5
            current.y += dy * ratio * 0.5
          }
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Draw body segments from tail to head
        for (let i = this.segments.length - 1; i >= 1; i--) {
          const current = this.segments[i]
          const next = this.segments[i - 1]

          // Connection
          const gradient = ctx.createLinearGradient(current.x, current.y, next.x, next.y)
          gradient.addColorStop(0, `rgba(147, 51, 234, ${0.7 - i * 0.08})`)
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0.8)')

          ctx.strokeStyle = gradient
          ctx.lineWidth = current.size * 1.2
          ctx.lineCap = 'round'
          ctx.shadowBlur = 10
          ctx.shadowColor = 'rgba(168, 85, 247, 0.6)'
          ctx.beginPath()
          ctx.moveTo(current.x, current.y)
          ctx.lineTo(next.x, next.y)
          ctx.stroke()
        }

        // Draw segments
        for (let i = this.segments.length - 1; i >= 0; i--) {
          const segment = this.segments[i]
          const gradient = ctx.createRadialGradient(
            segment.x,
            segment.y,
            0,
            segment.x,
            segment.y,
            segment.size,
          )
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.95)')
          gradient.addColorStop(0.6, 'rgba(147, 51, 234, 0.85)')
          gradient.addColorStop(1, 'rgba(126, 34, 206, 0.6)')

          ctx.fillStyle = gradient
          ctx.shadowBlur = 15
          ctx.shadowColor = 'rgba(168, 85, 247, 0.8)'
          ctx.beginPath()
          ctx.arc(segment.x, segment.y, segment.size, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.shadowBlur = 0

        // Draw head details
        const head = this.segments[0]

        // Horns
        this.drawHorn(ctx, head.x - 5, head.y - 8)
        this.drawHorn(ctx, head.x + 5, head.y - 8)

        // Eyes
        const eyeGlow = Math.sin(this.angle * 8) * 0.4 + 0.6
        ctx.fillStyle = `rgba(255, 120, 255, ${eyeGlow})`
        ctx.shadowBlur = 10
        ctx.shadowColor = '#ff00ff'
        ctx.beginPath()
        ctx.arc(head.x - 4, head.y - 2, 2, 0, Math.PI * 2)
        ctx.arc(head.x + 4, head.y - 2, 2, 0, Math.PI * 2)
        ctx.fill()

        // Pupils
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.arc(head.x - 4, head.y - 2, 1, 0, Math.PI * 2)
        ctx.arc(head.x + 4, head.y - 2, 1, 0, Math.PI * 2)
        ctx.fill()

        // Mouth glow when breathing fire
        if (this.breatheFire) {
          const fireGlow = ctx.createRadialGradient(head.x, head.y + 10, 0, head.x, head.y + 10, 20)
          fireGlow.addColorStop(0, 'rgba(255, 100, 255, 0.8)')
          fireGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)')
          fireGlow.addColorStop(1, 'transparent')

          ctx.fillStyle = fireGlow
          ctx.beginPath()
          ctx.arc(head.x, head.y + 10, 20, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      drawHorn(ctx: CanvasRenderingContext2D, x: number, y: number) {
        const gradient = ctx.createLinearGradient(x, y, x, y - 10)
        gradient.addColorStop(0, 'rgba(168, 85, 247, 1)')
        gradient.addColorStop(1, 'rgba(219, 39, 119, 0.8)')

        ctx.fillStyle = gradient
        ctx.shadowBlur = 8
        ctx.shadowColor = 'rgba(168, 85, 247, 0.6)'
        ctx.beginPath()
        ctx.moveTo(x - 2, y)
        ctx.lineTo(x, y - 10)
        ctx.lineTo(x + 2, y)
        ctx.closePath()
        ctx.fill()
        ctx.shadowBlur = 0
      }
    }

    // Fire particles
    class FireParticle {
      x: number
      y: number
      vx: number
      vy: number
      life: number = 0
      maxLife: number = 30
      size: number
      hue: number

      constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.size = Math.random() * 3 + 1
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 2 + 1
        this.vx = Math.cos(angle) * speed
        this.vy = Math.sin(angle) * speed
        this.hue = 280 + Math.random() * 40
      }

      update() {
        this.x += this.vx
        this.y += this.vy
        this.vx *= 0.95
        this.vy *= 0.95
        this.life++
      }

      draw(ctx: CanvasRenderingContext2D) {
        const opacity = (1 - this.life / this.maxLife) * 0.6
        ctx.fillStyle = `hsla(${this.hue}, 100%, 65%, ${opacity})`
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
      }

      isDead() {
        return this.life >= this.maxLife
      }
    }

    // Initialize
    const dragon = new MiniDragon()
    const fireParticles: FireParticle[] = []

    // Animation loop
    let animationId: number
    const animate = () => {
      // Semi-transparent trail
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update dragon
      dragon.update()

      // Create fire particles when breathing
      if (dragon.breatheFire && Math.random() < 0.5) {
        const head = dragon.segments[0]
        fireParticles.push(new FireParticle(head.x, head.y + 10))
      }

      // Update and draw fire particles
      for (let i = fireParticles.length - 1; i >= 0; i--) {
        fireParticles[i].update()
        fireParticles[i].draw(ctx)
        if (fireParticles[i].isDead()) {
          fireParticles.splice(i, 1)
        }
      }

      // Draw dragon
      dragon.draw(ctx)

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: 'screen', opacity: 0.4 }}
    />
  )
}
