'use client'
import { useEffect, useState } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { Instagram, ChevronDown } from 'lucide-react'

export default function Hero() {
  const [cutDone, setCutDone] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [clippings, setClippings] = useState<{ id: number; x: number; y: number; angle: number }[]>([])
  const scissorsControls = useAnimation()

  useEffect(() => {
    const run = async () => {
      await new Promise(r => setTimeout(r, 600))
      await scissorsControls.start({ x: '110vw', transition: { duration: 1.1, ease: [0.4, 0, 0.2, 1] } })
      setCutDone(true)
      setClippings(Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 60,
        y: 30 + Math.random() * 20,
        angle: (Math.random() - 0.5) * 180,
      })))
      await new Promise(r => setTimeout(r, 200))
      setShowContent(true)
    }
    run()
  }, [scissorsControls])

  const scrollTo = (id: string) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-5 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-6 px-4 py-1.5 rounded-full border border-white/15 bg-white/5 text-gray-400 text-sm font-medium tracking-wide"
      >
        ✂ Luke.Cuts.PSU
      </motion.div>

      <div className="relative w-full max-w-4xl mx-auto text-center">
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <span className="block text-white">THE PENN STATE</span>
          <span className="block text-gray-400">BARBER</span>
          <span className="block text-white">THAT LISTENS</span>
        </motion.h1>

        <motion.div
          initial={{ x: '-10vw' }}
          animate={scissorsControls}
          className="absolute top-1/2 -translate-y-1/2 pointer-events-none z-10"
          style={{ left: 0 }}
        >
          <ScissorsSVG />
        </motion.div>

        <AnimatePresence>
          {!cutDone && (
            <motion.div
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1.0, ease: 'linear' }}
              className="absolute top-1/2 left-0 right-0 h-px bg-white/20 origin-left pointer-events-none"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {cutDone && clippings.map((c) => (
            <motion.div
              key={c.id}
              initial={{ x: `${c.x}%`, y: `${c.y}%`, opacity: 1, rotate: c.angle }}
              animate={{ y: '150%', opacity: 0, rotate: c.angle + (Math.random() - 0.5) * 90 }}
              exit={{}}
              transition={{ duration: 1.2 + Math.random() * 0.8, ease: 'easeIn', delay: Math.random() * 0.3 }}
              className="absolute pointer-events-none"
              style={{ left: 0, top: 0, width: '1px', height: `${6 + Math.random() * 14}px`, background: '#888', borderRadius: '2px' }}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="mt-8 flex flex-col items-center gap-6"
          >
            <p className="text-gray-400 text-lg sm:text-xl max-w-xl text-center leading-relaxed">
              Come to me in State College or I can come to you.
              <br />
              <span className="text-white">Book online and we'll sort out the details.</span>
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => scrollTo('#booking')}
                className="px-8 py-3.5 rounded-full bg-white hover:bg-gray-200 text-black font-semibold text-base transition-all duration-200 hover:scale-105 active:scale-95"
              >
                ✂ Book Your Cut
              </button>
              <a
                href="https://www.instagram.com/lukecutspsu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-3.5 rounded-full border border-white/15 hover:border-white/30 text-gray-400 hover:text-white font-semibold text-base transition-all duration-200 hover:bg-white/5"
              >
                <Instagram className="w-4 h-4" />
                Follow @luke.cuts.psu
              </a>
            </div>

            <div className="flex gap-8 mt-4">
              {[
                { value: '900+', label: 'Happy Clients' },
                { value: '45 min', label: 'Avg. Appointment' },
                { value: '3 Years', label: 'Experience' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => scrollTo('#about')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-700 hover:text-gray-400 transition-colors"
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>
    </section>
  )
}

function ScissorsSVG() {
  return (
    <motion.svg
      width="100" height="60" viewBox="0 0 100 60" fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ rotate: [-5, 5, -5] }}
      transition={{ repeat: Infinity, duration: 0.3 }}
      style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}
    >
      <path d="M50 30 C60 24, 80 22, 98 29 C80 32, 60 33, 50 30Z" fill="url(#bladeGrad)" />
      <path d="M50 30 C60 36, 80 38, 98 31 C80 28, 60 27, 50 30Z" fill="url(#bladeGrad)" />
      <circle cx="18" cy="20" r="12" stroke="#666" strokeWidth="3" fill="none" />
      <circle cx="18" cy="40" r="12" stroke="#666" strokeWidth="3" fill="none" />
      <line x1="30" y1="20" x2="50" y2="30" stroke="#666" strokeWidth="2.5" />
      <line x1="30" y1="40" x2="50" y2="30" stroke="#666" strokeWidth="2.5" />
      <circle cx="50" cy="30" r="5" fill="#aaa" />
      <circle cx="50" cy="30" r="2" fill="#555" />
      <defs>
        <linearGradient id="bladeGrad" x1="50" y1="30" x2="98" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#333" />
          <stop offset="0.4" stopColor="#888" />
          <stop offset="1" stopColor="#ddd" />
        </linearGradient>
      </defs>
    </motion.svg>
  )
}
