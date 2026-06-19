'use client'
import { useEffect, useRef } from 'react'

interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; color: string; rotation: number; rotSpeed: number
  life: number; maxLife: number; shape: 'rect' | 'circle'
}

const COLORS = ['#0EA5E9', '#22c55e', '#f59e0b', '#8b5cf6', '#e879f9', '#38bdf8', '#10b981']

export function Confetti({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prevTrigger = useRef(0)

  useEffect(() => {
    if (trigger <= prevTrigger.current) return
    prevTrigger.current = trigger

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    canvas.style.display = 'block'

    const particles: Particle[] = []
    for (let i = 0; i < 120; i++) {
      const angle = (Math.random() * Math.PI * 2)
      const speed = 4 + Math.random() * 8
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2 - 100,
        vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
        vy: -Math.abs(Math.sin(angle) * speed) - Math.random() * 4,
        size: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        life: 0,
        maxLife: 80 + Math.random() * 40,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
      })
    }

    let frame: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      let alive = false

      for (const p of particles) {
        p.life++
        if (p.life > p.maxLife) continue
        alive = true

        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15
        p.vx *= 0.99
        p.rotation += p.rotSpeed

        const alpha = Math.max(0, 1 - p.life / p.maxLife)
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = alpha

        ctx.fillStyle = p.color
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        } else {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      if (alive) {
        frame = requestAnimationFrame(animate)
      } else {
        canvas.style.display = 'none'
      }
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [trigger])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        pointerEvents: 'none', display: 'none',
      }}
    />
  )
}
