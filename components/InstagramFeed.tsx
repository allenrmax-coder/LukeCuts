'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Instagram, ExternalLink, AlertCircle } from 'lucide-react'
import Image from 'next/image'

interface Post {
  id: string; caption: string; mediaType: string
  mediaUrl: string; permalink: string; timestamp: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' } }),
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/instagram').then(r => r.json())
      .then(d => { if (d.posts) setPosts(d.posts); else setError(true) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section id="instagram" className="relative z-10 py-24 px-5">
      <div className="max-w-6xl mx-auto">

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} custom={0} variants={fadeUp}
          className="text-center mb-12">
          <span className="text-gray-500 text-sm font-semibold tracking-widest uppercase">Gallery</span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black text-white tracking-tight flex items-center justify-center gap-3">
            <Instagram className="w-9 h-9 text-gray-400" />
            @luke.cuts.psu
          </h2>
          <div className="mt-3 w-16 h-1 rounded-full bg-white/20 mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">Latest cuts straight from Instagram</p>
        </motion.div>

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-bg-card border border-bg-border animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <AlertCircle className="w-10 h-10 text-gray-700" />
            <p className="text-gray-600">Couldn't load posts right now.</p>
            <a href="https://www.instagram.com/lukecutspsu" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-colors">
              <Instagram className="w-4 h-4" /> View on Instagram
            </a>
          </div>
        )}

        {!loading && !error && posts.length === 0 && <PlaceholderGrid />}

        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {posts.map((post, i) => (
              <motion.a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
                initial="hidden" whileInView="show" viewport={{ once: true }} custom={i} variants={fadeUp}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-bg-card border border-bg-border cursor-pointer">
                <Image src={post.mediaUrl} alt={post.caption.slice(0, 80) || 'Luke Cuts PSU'} fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, 33vw" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <ExternalLink className="w-6 h-6 text-white" />
                </div>
              </motion.a>
            ))}
          </div>
        )}

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} custom={0} variants={fadeUp}
          className="mt-8 text-center">
          <a href="https://www.instagram.com/lukecutspsu" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20 font-semibold text-sm transition-colors">
            <Instagram className="w-4 h-4" /> See All Posts
          </a>
        </motion.div>

      </div>
    </section>
  )
}

function PlaceholderGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.a key={i} href="https://www.instagram.com/lukecutspsu" target="_blank" rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="group aspect-square rounded-2xl bg-bg-card border border-dashed border-bg-border flex flex-col items-center justify-center gap-3 hover:border-white/15 transition-colors">
          <Instagram className="w-8 h-8 text-gray-700 group-hover:text-gray-500 transition-colors" />
          <span className="text-gray-700 text-xs">@luke.cuts.psu</span>
        </motion.a>
      ))}
    </div>
  )
}
