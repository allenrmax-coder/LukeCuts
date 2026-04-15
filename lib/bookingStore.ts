// Persistent booking store — saves upcoming bookings to a JSON file so the
// cron job can send 24h and 2h reminder emails.
// On Vercel, /tmp is the only writable directory at runtime.

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { BookingDetails } from './googleCalendar'

const DATA_DIR  = process.env.NODE_ENV === 'production'
  ? '/tmp'
  : join(process.cwd(), 'data')
const DATA_FILE = join(DATA_DIR, 'bookings.json')

export interface StoredBooking extends BookingDetails {
  id: string
  bookedAt: string      // ISO timestamp when the booking was created
  reminded24h: boolean  // has the 24h reminder been sent?
  reminded2h: boolean   // has the 2h reminder been sent?
}

function read(): StoredBooking[] {
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8')) as StoredBooking[]
  } catch {
    return []
  }
}

function write(bookings: StoredBooking[]): void {
  try {
    mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2))
  } catch (err) {
    console.error('[bookingStore] write error:', err)
  }
}

// Save a new booking
export function saveBooking(booking: BookingDetails): StoredBooking {
  const stored: StoredBooking = {
    ...booking,
    id: randomUUID(),
    bookedAt: new Date().toISOString(),
    reminded24h: false,
    reminded2h: false,
  }
  const all = read()
  all.push(stored)
  write(all)
  return stored
}

// Return all bookings that need a 24h or 2h reminder right now.
// windowMs: how wide a window to match (default 30 min — matches cron frequency)
export function getBookingsDueForReminder(windowMs = 30 * 60 * 1000): {
  need24h: StoredBooking[]
  need2h:  StoredBooking[]
} {
  const now  = Date.now()
  const all  = read()
  const need24h: StoredBooking[] = []
  const need2h:  StoredBooking[] = []

  for (const b of all) {
    const apptMs = new Date(`${b.date}T${b.time}:00`).getTime()
    if (apptMs < now) continue  // past appointments, skip

    const msUntil = apptMs - now

    // 24h window: between 24h and 24h-window before appointment
    if (!b.reminded24h && msUntil <= 24 * 60 * 60 * 1000 && msUntil > 24 * 60 * 60 * 1000 - windowMs) {
      need24h.push(b)
    }

    // 2h window: between 2h and 2h-window before appointment
    if (!b.reminded2h && msUntil <= 2 * 60 * 60 * 1000 && msUntil > 2 * 60 * 60 * 1000 - windowMs) {
      need2h.push(b)
    }
  }

  return { need24h, need2h }
}

// Mark a reminder as sent to prevent double-sending
export function markReminded(id: string, type: '24h' | '2h'): void {
  const all = read()
  const booking = all.find(b => b.id === id)
  if (!booking) return
  if (type === '24h') booking.reminded24h = true
  if (type === '2h')  booking.reminded2h  = true
  write(all)
}

// Prune bookings older than 7 days to keep the file small
export function pruneOldBookings(): void {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  const all    = read()
  const fresh  = all.filter(b => new Date(`${b.date}T${b.time}:00`).getTime() > cutoff)
  if (fresh.length !== all.length) write(fresh)
}
