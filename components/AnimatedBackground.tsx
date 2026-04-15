'use client'
import { useEffect, useRef } from 'react'

interface HairStrand {
  x: number; y: number; vy: number
  cp1x: number; cp2x: number
  ex: number; length: number
  opacity: number; swayAngle: number; swaySpeed: number; sway: number
}

interface Sparkle {
  x: number; y: number; size: number
  opacity: number; fadeDir: number; speed: number
}

function initHair(W: number, H: number): HairStrand {
  const x = Math.random() * W
  return {
    x, y: -80,
    vy: 0.25 + Math.random() * 0.6,
    cp1x: x + (Math.random() - 0.5) * 100,
    cp2x: x + (Math.random() - 0.5) * 100,
    ex: x + (Math.random() - 0.5) * 60,
    length: 50 + Math.random() * 100,
    opacity: 0.04 + Math.random() * 0.12,
    swayAngle: Math.random() * Math.PI * 2,
    swaySpeed: 0.008 + Math.random() * 0.015,
    sway: 0,
  }
}

function drawHair(ctx: CanvasRenderingContext2D, h: HairStrand): void {
  ctx.save()
  ctx.globalAlpha = h.opacity
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 0.8
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(h.x + h.sway, h.y)
  ctx.bezierCurveTo(
    h.cp1x + h.sway * 0.4, h.y + h.length * 0.33,
    h.cp2x + h.sway * 0.7, h.y + h.length * 0.66,
    h.ex + h.sway, h.y + h.length,
  )
  ctx.stroke()
  ctx.restore()
}

function drawSparkles(
  ctx: CanvasRenderingContext2D,
  sparkles: Sparkle[],
  W: number,
  H: number,
): void {
  for (const sp of sparkles) {
    sp.opacity += sp.speed * sp.fadeDir
    if (sp.opacity >= 1) { sp.opacity = 1; sp.fadeDir = -1 }
    if (sp.opacity <= 0) {
      sp.opacity = 0; sp.fadeDir = 1
      sp.x = Math.random() * W; sp.y = Math.random() * H
    }
    ctx.save()
    ctx.globalAlpha = sp.opacity * 0.35
    ctx.fillStyle = '#fff'
    ctx.shadowColor = '#fff'
    ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width = W
    canvas.height = H

    const onResize = () => {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W
      canvas.height = H
    }
    window.addEventListener('resize', onResize)

    const hairs: HairStrand[] = Array.from({ length: 30 }, () => {
      const h = initHair(W, H)
      h.y = Math.random() * H
      return h
    })

    const sparkles: Sparkle[] = Array.from({ length: 14 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      size: 0.8 + Math.random() * 2,
      opacity: Math.random(),
      fadeDir: Math.random() > 0.5 ? 1 : -1,
      speed: 0.004 + Math.random() * 0.007,
    }))

    // draw receives ctx as a parameter so it never closes over a possibly-null value.
    // The recursive rAF call wraps it in an arrow so the signature stays consistent.
    function draw(c: CanvasRenderingContext2D): void {
      c.clearRect(0, 0, W, H)

      drawSparkles(c, sparkles, W, H)

      for (const h of hairs) {
        h.y += h.vy
        h.swayAngle += h.swaySpeed
        h.sway = Math.sin(h.swayAngle) * 14
        if (h.y > H + 120) Object.assign(h, initHair(W, H))
        drawHair(c, h)
      }

      animId = requestAnimationFrame(() => draw(c))
    }

    draw(ctx)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <>
      <div className="fixed inset-0 z-0 bg-bg" />
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%)' }}
      />
      <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />
    </>
  )
}
