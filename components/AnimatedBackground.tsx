'use client'
import { useEffect, useRef } from 'react'

interface ScissorObj {
  x: number; y: number; vx: number; vy: number
  angle: number; rotSpeed: number; size: number
  opacity: number; openAngle: number; openSpeed: number; openDir: number
}

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

function drawScissor(ctx: CanvasRenderingContext2D, s: ScissorObj): void {
  ctx.save()
  ctx.globalAlpha = s.opacity
  ctx.translate(s.x, s.y)
  ctx.rotate(s.angle)
  const sz = s.size
  const oa = s.openAngle * 0.45

  const makeGrad = (): CanvasGradient => {
    const g = ctx.createLinearGradient(-sz * 0.1, 0, sz, 0)
    g.addColorStop(0, '#1a1a1a')
    g.addColorStop(0.35, '#555')
    g.addColorStop(0.7, '#bbb')
    g.addColorStop(1, '#333')
    return g
  }

  ctx.shadowColor = 'rgba(255,255,255,0.15)'
  ctx.shadowBlur = 12

  ctx.save()
  ctx.rotate(oa)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(sz * 0.25, -sz * 0.06, sz * 0.65, -sz * 0.13, sz * 0.95, -sz * 0.02)
  ctx.bezierCurveTo(sz * 0.65, sz * 0.05, sz * 0.25, sz * 0.025, 0, 0)
  ctx.fillStyle = makeGrad()
  ctx.fill()
  ctx.beginPath()
  ctx.arc(-sz * 0.2, 0, sz * 0.13, 0, Math.PI * 2)
  ctx.strokeStyle = '#555'
  ctx.lineWidth = sz * 0.04
  ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.rotate(-oa)
  ctx.scale(1, -1)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(sz * 0.25, -sz * 0.06, sz * 0.65, -sz * 0.13, sz * 0.95, -sz * 0.02)
  ctx.bezierCurveTo(sz * 0.65, sz * 0.05, sz * 0.25, sz * 0.025, 0, 0)
  ctx.fillStyle = makeGrad()
  ctx.fill()
  ctx.beginPath()
  ctx.arc(-sz * 0.2, 0, sz * 0.13, 0, Math.PI * 2)
  ctx.strokeStyle = '#555'
  ctx.lineWidth = sz * 0.04
  ctx.stroke()
  ctx.restore()

  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.arc(0, 0, sz * 0.075, 0, Math.PI * 2)
  const screwG = ctx.createRadialGradient(0, -sz * 0.02, 0, 0, 0, sz * 0.075)
  screwG.addColorStop(0, '#ccc')
  screwG.addColorStop(1, '#555')
  ctx.fillStyle = screwG
  ctx.fill()
  ctx.restore()
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

    const scissors: ScissorObj[] = Array.from({ length: 8 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.7, vy: (Math.random() - 0.5) * 0.7,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.008,
      size: 28 + Math.random() * 44,
      opacity: 0.08 + Math.random() * 0.18,
      openAngle: Math.random() * 0.5,
      openSpeed: 0.015 + Math.random() * 0.02,
      openDir: 1,
    }))

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

      for (const s of scissors) {
        s.x += s.vx; s.y += s.vy; s.angle += s.rotSpeed
        s.openAngle += s.openSpeed * s.openDir
        if (s.openAngle >= 0.65) s.openDir = -1
        if (s.openAngle <= 0.02) s.openDir = 1
        if (s.x < -120) s.x = W + 80
        if (s.x > W + 120) s.x = -80
        if (s.y < -120) s.y = H + 80
        if (s.y > H + 120) s.y = -80
        drawScissor(c, s)
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
