'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, Loader2, Calendar, Clock, User, Mail, Phone, Scissors, AlertCircle } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay, getDay } from 'date-fns'

const PRICING = [
  {
    id: 'scissors',
    label: 'Scissors Cut',
    price: '$30',
    description: 'Clean scissor work for all hair types. Great for texture, length, and natural styles.',
  },
  {
    id: 'clippers',
    label: 'Clipper Cut',
    price: '$40',
    description: 'Fades, tapers, line ups, and anything that needs the clippers. Sharp and precise.',
  },
]

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`
}

export default function BookingForm() {
  const [step, setStep] = useState<'service' | 'datetime' | 'details' | 'success'>('service')
  const [selectedService, setSelectedService] = useState('')
  const [calMonth, setCalMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedTime, setSelectedTime] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const today = startOfDay(new Date())

  const fetchSlots = useCallback(async (date: Date) => {
    setSlotsLoading(true); setSlots([]); setSelectedTime('')
    try {
      const res = await fetch(`/api/available-slots?date=${format(date, 'yyyy-MM-dd')}`)
      const data = await res.json()
      setSlots(data.slots ?? [])
    } catch { setSlots([]) }
    finally { setSlotsLoading(false) }
  }, [])

  useEffect(() => { if (selectedDate) fetchSlots(selectedDate) }, [selectedDate, fetchSlots])

  const monthStart = startOfMonth(calMonth)
  const monthEnd = endOfMonth(calMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart)

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) { setError('Fill in all required fields.'); return }
    setError(''); setSubmitting(true)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone,
          service: selectedService, date: format(selectedDate!, 'yyyy-MM-dd'),
          time: selectedTime, notes: form.notes,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong. Try again.'); return }
      setStep('success')
    } catch { setError('Network error. Please try again.') }
    finally { setSubmitting(false) }
  }

  return (
    <section id="booking" className="relative z-10 py-24 px-5">
      <div className="max-w-2xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-center mb-12">
          <span className="text-gray-500 text-sm font-semibold tracking-widest uppercase">Booking</span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black text-white tracking-tight">Book Your Cut</h2>
          <div className="mt-3 w-16 h-1 rounded-full bg-white/20 mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">Pick a service, choose a time, done.</p>
        </motion.div>

        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2 mb-10">
            {(['service', 'datetime', 'details'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step === s ? 'bg-white text-black' :
                  ['service','datetime','details'].indexOf(step) > i ? 'bg-white/20 text-white' :
                  'bg-bg-card text-gray-600 border border-bg-border'
                }`}>
                  {['service','datetime','details'].indexOf(step) > i ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < 2 && <div className={`w-12 h-px ${['service','datetime','details'].indexOf(step) > i ? 'bg-white/30' : 'bg-bg-border'}`} />}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-3xl border border-bg-border bg-bg-card overflow-hidden">
          <AnimatePresence mode="wait">

            {step === 'service' && (
              <motion.div key="service" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-gray-400" /> Choose a Service
                </h3>
                <p className="text-gray-600 text-sm mb-6">All cuts include a full consultation.</p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {PRICING.map(opt => (
                    <button key={opt.id} onClick={() => setSelectedService(`${opt.label} (${opt.price})`)}
                      className={`text-left p-5 rounded-2xl border transition-all ${
                        selectedService.startsWith(opt.label)
                          ? 'bg-white/10 border-white text-white'
                          : 'bg-bg border-bg-border text-gray-400 hover:border-white/30 hover:text-gray-200'
                      }`}>
                      <div className="text-2xl font-black text-white mb-1">{opt.price}</div>
                      <div className="font-semibold text-sm mb-2">{opt.label}</div>
                      <div className="text-xs leading-relaxed opacity-70">{opt.description}</div>
                    </button>
                  ))}
                </div>

                <button disabled={!selectedService} onClick={() => setStep('datetime')}
                  className="mt-6 w-full py-3.5 rounded-xl bg-white hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold transition-colors">
                  Continue
                </button>
              </motion.div>
            )}

            {step === 'datetime' && (
              <motion.div key="datetime" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                <div className="flex items-center gap-2 mb-1">
                  <button onClick={() => setStep('service')} className="text-gray-600 hover:text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" /> Pick a Date and Time
                  </h3>
                </div>
                <p className="text-gray-600 text-sm mb-6 ml-7">Service: <span className="text-gray-300">{selectedService}</span></p>

                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setCalMonth(m => subMonths(m, 1))} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-white font-semibold">{format(calMonth, 'MMMM yyyy')}</span>
                  <button onClick={() => setCalMonth(m => addMonths(m, 1))} className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>

                <div className="grid grid-cols-7 mb-1">
                  {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                    <div key={d} className="text-center text-xs text-gray-700 py-1">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 mb-6">
                  {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
                  {days.map(day => {
                    const past = isBefore(day, today)
                    const selected = selectedDate ? isSameDay(day, selectedDate) : false
                    return (
                      <button key={day.toISOString()} disabled={past} onClick={() => setSelectedDate(day)}
                        className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                          selected ? 'bg-white text-black' :
                          past ? 'text-gray-800 cursor-not-allowed' :
                          'text-gray-400 hover:bg-white/10 hover:text-white'
                        }`}>
                        {format(day, 'd')}
                      </button>
                    )
                  })}
                </div>

                {selectedDate && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Open times for {format(selectedDate, 'MMMM d')}
                    </h4>
                    {slotsLoading ? (
                      <div className="flex items-center gap-2 text-gray-600 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
                    ) : slots.length === 0 ? (
                      <p className="text-gray-600 text-sm">No open slots on this day. Try another date.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {slots.map(slot => (
                          <button key={slot} onClick={() => setSelectedTime(slot)}
                            className={`py-2 rounded-lg text-sm font-medium transition-all border ${
                              selectedTime === slot
                                ? 'bg-white border-white text-black'
                                : 'bg-bg border-bg-border text-gray-500 hover:border-white/30 hover:text-white'
                            }`}>
                            {formatTime(slot)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <button disabled={!selectedDate || !selectedTime} onClick={() => setStep('details')}
                  className="mt-6 w-full py-3.5 rounded-xl bg-white hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-black font-semibold transition-colors">
                  Continue
                </button>
              </motion.div>
            )}

            {step === 'details' && (
              <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-8">
                <div className="flex items-center gap-2 mb-1">
                  <button onClick={() => setStep('datetime')} className="text-gray-600 hover:text-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-400" /> Your Info
                  </h3>
                </div>

                <div className="ml-7 mb-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm space-y-1">
                  <div className="flex gap-2"><span className="text-gray-600 w-16">Service</span><span className="text-white font-medium">{selectedService}</span></div>
                  <div className="flex gap-2"><span className="text-gray-600 w-16">Date</span><span className="text-white font-medium">{selectedDate && format(selectedDate, 'MMMM d, yyyy')}</span></div>
                  <div className="flex gap-2"><span className="text-gray-600 w-16">Time</span><span className="text-white font-semibold">{formatTime(selectedTime)}</span></div>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'Your name' },
                    { key: 'email', label: 'Email Address', icon: Mail, type: 'email', placeholder: 'you@example.com' },
                    { key: 'phone', label: 'Phone Number', icon: Phone, type: 'tel', placeholder: '(610) 555-0000' },
                  ].map(({ key, label, icon: Icon, type, placeholder }) => (
                    <div key={key}>
                      <label className="block text-sm text-gray-500 mb-1.5 font-medium">{label} *</label>
                      <div className="relative">
                        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <input type={type} value={form[key as keyof typeof form]}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-bg border border-bg-border text-white placeholder-gray-700 text-sm focus:outline-none focus:border-white/30 transition-colors" />
                      </div>
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm text-gray-500 mb-1.5 font-medium">Notes (optional)</label>
                    <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Address, style details, or anything else worth knowing..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-bg border border-bg-border text-white placeholder-gray-700 text-sm focus:outline-none focus:border-white/30 transition-colors resize-none" />
                  </div>
                </div>

                {error && (
                  <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />{error}
                  </div>
                )}

                <button disabled={submitting} onClick={handleSubmit}
                  className="mt-6 w-full py-3.5 rounded-xl bg-white hover:bg-gray-200 disabled:opacity-60 text-black font-semibold transition-colors flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</> : '✂ Confirm Booking'}
                </button>
                <p className="mt-3 text-center text-xs text-gray-700">
                  You'll get a confirmation email right after booking.
                </p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="p-12 text-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-white/10 border-2 border-white flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className="text-2xl font-black text-white mb-2">You're booked.</h3>
                <p className="text-gray-400 mb-6">
                  <span className="text-white font-semibold">{selectedService}</span> on{' '}
                  <span className="text-white font-semibold">
                    {selectedDate && format(selectedDate, 'MMMM d')} at {formatTime(selectedTime)}
                  </span>
                </p>
                <p className="text-gray-600 text-sm mb-8">
                  Check your email for a confirmation with all the details.
                  <br />
                  If anything needs to change, just reply to that email.
                </p>
                <button
                  onClick={() => { setStep('service'); setSelectedService(''); setSelectedDate(null); setSelectedTime(''); setForm({ name: '', email: '', phone: '', notes: '' }) }}
                  className="px-8 py-3 rounded-full border border-white/15 text-gray-400 hover:text-white hover:border-white/30 font-semibold text-sm transition-colors">
                  Book Another
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
