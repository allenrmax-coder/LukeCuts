'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    q: 'Where do you cut hair?',
    a: 'Primarily at my place in State College, but I can also come to you for a small travel fee. If you\'re on campus, cuts are done outdoors only. Penn State doesn\'t allow barbers into dorms, so we find a spot outside that works. Most people just pick a bench or open area nearby and it\'s completely fine.',
  },
  {
    q: 'What kinds of cuts can you do?',
    a: 'Pretty much everything. Skin fades, taper fades, blowouts, buzz cuts, line ups, shape ups, textured crops, curly and natural hair, beard trims, hard parts, drop fades, mid fades, high fades. If you\'re unsure what you want, just describe the vibe and we\'ll figure it out.',
  },
  {
    q: 'How much does it cost?',
    a: 'Two options: scissors cuts are $30, clipper cuts are $40. If you need travel, there\'s a small fee on top depending on how far you are. We\'ll confirm everything before your appointment.',
  },
  {
    q: 'How long does a cut take?',
    a: 'Usually around 45 minutes. If you\'re doing something more involved or adding a beard trim, give it closer to an hour. Either way the time slot is yours, no rushing.',
  },
  {
    q: 'Will I get reminders?',
    a: 'Yes. You\'ll get a confirmation email right after booking with all your appointment details, plus a reminder 24 hours before and another one an hour before. You can also add it to your Google Calendar straight from the confirmation.',
  },
  {
    q: 'What if I need to cancel or move my appointment?',
    a: 'Just let me know at least a couple hours before and we\'ll sort it out. Reply to your confirmation email or text me directly at (610) 719-6625.',
  },
  {
    q: 'Do you offer travel?',
    a: 'Yes. I can come to your apartment, house, or any outdoor location. There\'s a travel fee depending on the distance. It\'s the secondary option, so if you\'re close by, coming to me is usually quicker and easier for both of us. Reach out if you have questions about your specific location.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="relative z-10 py-24 px-5">
      <div className="max-w-2xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-12">
          <span className="text-gray-500 text-sm font-semibold tracking-widest uppercase">FAQ</span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black text-white tracking-tight">Questions?</h2>
          <div className="mt-3 w-16 h-1 rounded-full bg-white/20 mx-auto" />
        </motion.div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border border-bg-border overflow-hidden transition-colors ${open === i ? 'bg-white/5' : 'bg-bg-card'}`}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/3 transition-colors">
                <span className={`font-semibold text-sm sm:text-base transition-colors ${open === i ? 'text-white' : 'text-gray-300'}`}>
                  {faq.q}
                </span>
                <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
                  <ChevronDown className={`w-4 h-4 transition-colors ${open === i ? 'text-white' : 'text-gray-600'}`} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden">
                    <p className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-bg-border pt-3">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}
