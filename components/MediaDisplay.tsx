'use client'
import { Scissors, Star } from 'lucide-react'
import { motion } from 'framer-motion'

export type MediaMode = 'none' | 'video' | 'photo'

interface MediaDisplayProps {
  mode: MediaMode
  videoUrl?: string
  photoUrl?: string
  /** Show the floating rating badge (used in the About section) */
  showBadge?: boolean
  className?: string
}

export default function MediaDisplay({
  mode,
  videoUrl,
  photoUrl,
  showBadge = false,
  className = '',
}: MediaDisplayProps) {

  if (mode === 'video' && videoUrl) {
    return (
      <div className={`rounded-3xl overflow-hidden border border-bg-border bg-bg-card aspect-video ${className}`}>
        <iframe
          src={videoUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="About Luke"
        />
      </div>
    )
  }

  if (mode === 'photo' && photoUrl) {
    return (
      <div className={`relative rounded-3xl overflow-hidden border border-bg-border bg-bg-card aspect-[4/5] ${className}`}>
        <img
          src={photoUrl}
          alt="Luke — mobile barber"
          className="w-full h-full object-cover"
        />
        {showBadge && <RatingBadge />}
      </div>
    )
  }

  // Placeholder (mode === 'none' or missing URL)
  return (
    <div className={`relative rounded-3xl overflow-hidden bg-bg-card border border-bg-border aspect-[4/5] flex flex-col items-center justify-center group ${className}`}>
      <Scissors className="absolute top-4 right-4 w-5 h-5 text-white/10" />
      <Scissors className="absolute bottom-4 left-4 w-5 h-5 text-white/10 rotate-180" />
      <div className="flex flex-col items-center gap-4 text-center px-8">
        <div className="w-20 h-20 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
          <span className="text-3xl">📸</span>
        </div>
        <p className="text-gray-600 text-sm">Photo coming soon</p>
      </div>
      <div className="absolute inset-0 rounded-3xl ring-1 ring-white/5 group-hover:ring-white/10 transition-all duration-300" />
      {showBadge && <RatingBadge />}
    </div>
  )
}

function RatingBadge() {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
      className="absolute -bottom-4 -right-4 bg-white rounded-2xl p-4 shadow-2xl"
    >
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 text-black fill-black" />
        <span className="text-black font-bold text-sm">5.0 Rating</span>
      </div>
      <p className="text-gray-600 text-xs mt-0.5">100+ happy clients</p>
    </motion.div>
  )
}
