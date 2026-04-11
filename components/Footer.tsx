'use client'
import { Instagram, Mail, Phone, MapPin, Scissors } from 'lucide-react'

export default function Footer() {
  const scrollTo = (id: string) => document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })

  return (
    <footer className="relative z-10 border-t border-bg-border mt-12">
      <div className="max-w-6xl mx-auto px-5 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="w-5 h-5 text-white/50" />
              <span className="font-black text-lg text-white">Luke<span className="text-gray-500">Cuts</span> <span className="text-gray-700 font-normal text-sm">PSU</span></span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-5">
              Penn State's mobile barber. All types of cuts, all hair types.
            </p>
            <a href="https://www.instagram.com/lukecutspsu" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-sm font-medium hover:text-white hover:border-white/20 transition-colors">
              <Instagram className="w-4 h-4" />
              @luke.cuts.psu
            </a>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Home', href: '#hero' },
                { label: 'About', href: '#about' },
                { label: 'Gallery', href: '#instagram' },
                { label: 'FAQ', href: '#faq' },
                { label: 'Book Now', href: '#booking' },
              ].map(({ label, href }) => (
                <li key={href}>
                  <button onClick={() => scrollTo(href)} className="text-gray-600 hover:text-gray-300 text-sm transition-colors">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Contact</h4>
            <ul className="space-y-3">
              <li>
                <a href="tel:6107196625" className="flex items-center gap-3 text-gray-600 hover:text-gray-300 transition-colors text-sm">
                  <Phone className="w-4 h-4 shrink-0" />
                  (610) 719-6625
                </a>
              </li>
              <li>
                <a href="mailto:luke@lukecutspsu.com" className="flex items-center gap-3 text-gray-600 hover:text-gray-300 transition-colors text-sm">
                  <Mail className="w-4 h-4 shrink-0" />
                  luke@lukecutspsu.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-gray-600 text-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                University Park, PA 16802
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-bg-border flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-700 text-xs">
          <p>© {new Date().getFullYear()} LukeCuts PSU. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
