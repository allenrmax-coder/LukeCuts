'use client'
import { motion } from 'framer-motion'
import { MapPin, Clock, Scissors, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import MediaDisplay, { MediaMode } from './MediaDisplay'

const haircutStyles = [
  'Skin Fades', 'Taper Fades', 'Blowouts', 'Buzz Cuts',
  'Line Ups / Edge Ups', 'Shape Ups', 'Classic Cuts',
  'Textured Crops', 'Curly / Natural Hair', 'Beard Trims',
  'Hard Parts', 'Drop Fades', 'Mid Fades', 'High Fades',
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.55, ease: 'easeOut' },
  }),
}

interface AboutContent {
  mode: MediaMode
  videoUrl: string
  photoUrl: string
}

export default function About() {
  const [media, setMedia] = useState<AboutContent>({ mode: 'none', videoUrl: '', photoUrl: '' })

  useEffect(() => {
    fetch('/api/about-content')
      .then(r => r.json())
      .then(d => {
        if (d.content) setMedia({
          mode: d.content.mode ?? 'none',
          videoUrl: d.content.videoUrl ?? '',
          photoUrl: d.content.photoUrl ?? '',
        })
      })
      .catch(() => {})
  }, [])

  return (
    <section id="about" className="relative z-10 py-24 px-5">
      <div className="max-w-6xl mx-auto">

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}
          custom={0} variants={fadeUp} className="text-center mb-16">
          <span className="text-gray-500 text-sm font-semibold tracking-widest uppercase">About</span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black text-white tracking-tight">Meet Luke</h2>
          <div className="mt-3 w-16 h-1 rounded-full bg-white/20 mx-auto" />
        </motion.div>

        <div className="grid md:grid-cols-2 gap-10 items-center mb-20">

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
            custom={1} variants={fadeUp} className="relative">
            <MediaDisplay
              mode={media.mode}
              videoUrl={media.videoUrl}
              photoUrl={media.photoUrl}
              showBadge
            />
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
            custom={2} variants={fadeUp} className="space-y-6">
            <h3 className="text-3xl font-black text-white leading-tight">
              Your barber,
              <span className="text-gray-400"> on your terms.</span>
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Hey, I'm Luke. I cut hair for Penn State students and locals in State College. You can come to me,
              or I can head to you for a small travel fee. Either way, I bring everything I need and give you
              my full attention start to finish.
            </p>
            <p className="text-gray-400 leading-relaxed">
              I do all types of cuts. Skin fades, tapers, textured crops, curly hair, beard trims, you name it.
              If you're not sure what you want, we'll figure it out together.
            </p>

            <div className="p-4 rounded-xl border border-white/10 bg-white/3 text-sm text-gray-400 leading-relaxed">
              <strong className="text-white block mb-1">Heads up about campus cuts</strong>
              Due to Penn State policy, cuts on campus are done outdoors only. I cannot enter dorms.
              If you're on campus, just find a spot outside that works for you and we'll make it happen.
            </div>

            <div className="space-y-3 pt-2">
              {[
                { icon: MapPin, text: 'State College and surrounding areas' },
                { icon: Clock, text: 'Flexible hours, mornings through evenings' },
                { icon: Scissors, text: 'All hair types and styles, no exceptions' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 text-sm text-gray-500">
              Travel available for an additional fee. Details confirmed at booking.
            </div>

            <button
              onClick={() => document.querySelector('#booking')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-2 px-7 py-3 rounded-full bg-white hover:bg-gray-200 text-black font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Book a Cut
            </button>
          </motion.div>
        </div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }}
          custom={0} variants={fadeUp}
          className="rounded-3xl border border-bg-border bg-bg-card p-8 mb-20">
          <h3 className="text-2xl font-black text-white mb-2">All Types, All Styles</h3>
          <p className="text-gray-500 text-sm mb-6">If you've seen it, I can probably do it.</p>
          <div className="flex flex-wrap gap-2">
            {haircutStyles.map((style, i) => (
              <motion.span key={style}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm text-gray-300 border border-white/10 bg-white/5 font-medium">
                <Check className="w-3 h-3 text-gray-400" />
                {style}
              </motion.span>
            ))}
          </div>
        </motion.div>

        <GallerySection />

      </div>
    </section>
  )
}

interface Photo { id: string; url: string; alt: string }

function GallerySection() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/photos')
      .then(r => r.json())
      .then(d => { setPhotos(d.photos ?? []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  const showPlaceholders = loaded && photos.length === 0

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-black text-white">Work Gallery</h3>
        <p className="text-gray-600 text-sm mt-1">
          {showPlaceholders ? (
            <>Photos coming soon. Follow{' '}
              <a href="https://www.instagram.com/lukecutspsu" target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors">@luke.cuts.psu</a>{' '}
              for the latest.</>
          ) : (
            <>Fresh cuts. Real results.</>
          )}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" id="gallery-grid">
        {showPlaceholders
          ? Array.from({ length: 6 }, (_, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="aspect-square rounded-2xl bg-bg-card border border-dashed border-bg-border flex flex-col items-center justify-center gap-2 group hover:border-white/15 transition-colors">
                <span className="text-2xl opacity-20 group-hover:opacity-30 transition-opacity">📷</span>
                <span className="text-gray-700 text-xs">Photo {i + 1}</span>
              </motion.div>
            ))
          : photos.map((photo, i) => (
              <motion.div key={photo.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="aspect-square rounded-2xl overflow-hidden bg-bg-card border border-bg-border">
                <img src={photo.url} alt={photo.alt || 'Gallery photo'} className="w-full h-full object-cover" />
              </motion.div>
            ))
        }
      </div>
    </motion.div>
  )
}
