'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Instagram } from 'lucide-react'

interface StoredPost {
  id: string
  url: string
  embedUrl: string
  addedAt: string
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState<StoredPost[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/instagram-posts')
      .then(r => r.json())
      .then(d => setPosts(d.posts ?? []))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  return (
    <section id="instagram" className="relative z-10 py-24 px-5">
      <div className="max-w-5xl mx-auto">

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true }} custom={0} variants={fadeUp}
          className="text-center mb-12">
          <span className="text-gray-500 text-sm font-semibold tracking-widest uppercase">Gallery</span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black text-white tracking-tight flex items-center justify-center gap-3">
            <Instagram className="w-9 h-9 text-gray-400" />
            @luke.cuts.psu
          </h2>
          <div className="mt-3 w-16 h-1 rounded-full bg-white/20 mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">Fresh cuts, straight from Instagram.</p>
        </motion.div>

        {!loaded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-bg-card border border-bg-border animate-pulse" style={{ height: 500 }} />
            ))}
          </div>
        )}

        {loaded && posts.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Instagram className="w-10 h-10 text-gray-700" />
            <p className="text-gray-600 text-sm">No posts added yet. Follow along on Instagram.</p>
            <a href="https://www.instagram.com/lukecutspsu" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/10 text-gray-400 hover:text-white hover:border-white/20 text-sm font-medium transition-colors">
              <Instagram className="w-4 h-4" /> @luke.cuts.psu
            </a>
          </div>
        )}

        {loaded && posts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post, i) => (
              <motion.div
                key={post.id}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="rounded-2xl overflow-hidden border border-bg-border bg-bg-card"
              >
                <iframe
                  src={post.embedUrl}
                  className="w-full"
                  style={{ minHeight: 500, border: 'none', display: 'block' }}
                  loading="lazy"
                  scrolling="no"
                  title={`Instagram post ${i + 1}`}
                />
              </motion.div>
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
