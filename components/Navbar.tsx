'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const links = [
  { label: 'Home', href: '#hero' },
  { label: 'About', href: '#about' },
  { label: 'Gallery', href: '#instagram' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Book Now', href: '#booking', cta: true },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (href: string) => {
    setOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-bg/80 backdrop-blur-xl border-b border-bg-border shadow-lg shadow-black/30' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <button onClick={() => scrollTo('#hero')} className="flex items-center gap-2 group">
            <ScissorsIcon className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
            <span className="font-bold text-lg tracking-tight text-white">
              Luke<span className="text-gray-400">Cuts</span>
              <span className="text-gray-600 text-sm font-normal ml-1">PSU</span>
            </span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {links.map((l) =>
              l.cta ? (
                <button key={l.href} onClick={() => scrollTo(l.href)}
                  className="ml-3 px-5 py-2 rounded-full bg-white hover:bg-gray-200 text-black text-sm font-semibold transition-all duration-200">
                  {l.label}
                </button>
              ) : (
                <button key={l.href} onClick={() => scrollTo(l.href)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                  {l.label}
                </button>
              ),
            )}
          </div>

          <button onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 left-0 right-0 z-40 bg-bg/95 backdrop-blur-xl border-b border-bg-border md:hidden">
            <div className="flex flex-col p-4 gap-1">
              {links.map((l) => (
                <button key={l.href} onClick={() => scrollTo(l.href)}
                  className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    l.cta ? 'bg-white text-black hover:bg-gray-200 mt-2' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}>
                  {l.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ScissorsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
      <line x1="8.46" y1="7.68" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="21" y1="3" x2="8.46" y2="16.32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
