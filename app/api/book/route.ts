import { NextRequest, NextResponse } from 'next/server'
import { createBookingEvent } from '@/lib/googleCalendar'
import { sendClientConfirmation, sendOwnerNotification } from '@/lib/email'
import { rateLimit } from '@/lib/rateLimit'
import { isSlotBlocked } from '@/lib/blockedSlots'
import { isAllowedDay, isWithinAdvanceWindow } from '@/lib/availability'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

// Strip HTML tags and control characters, trim, truncate
function sanitize(s: unknown, maxLen = 500): string {
  if (typeof s !== 'string') return ''
  return s.replace(/<[^>]*>/g, '').replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLen)
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 254
}

function isValidPhone(phone: string): boolean {
  return /^[\d\s\-().+]{7,20}$/.test(phone)
}

const VALID_SERVICES = ['Scissors Cut ($30)', 'Clipper Cut ($40)']

export async function POST(req: NextRequest) {
  // 10 booking attempts per hour per IP
  const ip = getClientIp(req)
  if (!rateLimit(`book:${ip}`, 10, 60 * 60 * 1000).allowed) {
    return NextResponse.json(
      { error: 'Too many booking attempts. Try again later.' },
      { status: 429 },
    )
  }

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const b = raw as Record<string, unknown>
  const name    = sanitize(b.name, 100)
  const email   = sanitize(b.email, 254)
  const phone   = sanitize(b.phone, 30)
  const service = sanitize(b.service, 50)
  const date    = sanitize(b.date, 10)
  const time    = sanitize(b.time, 5)
  const notes   = sanitize(b.notes, 500)

  if (name.length < 2 || name.length > 100)
    return NextResponse.json({ error: 'Please enter your full name.' }, { status: 422 })
  if (!isValidEmail(email))
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 })
  if (!isValidPhone(phone))
    return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 422 })
  if (!VALID_SERVICES.includes(service))
    return NextResponse.json({ error: 'Please select a valid service.' }, { status: 422 })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    return NextResponse.json({ error: 'Please select a date.' }, { status: 422 })
  if (!/^\d{2}:\d{2}$/.test(time))
    return NextResponse.json({ error: 'Please select a time slot.' }, { status: 422 })

  // Validate it's a real calendar date
  const [y, mo, d] = date.split('-').map(Number)
  const parsedDate = new Date(y, mo - 1, d)
  if (
    parsedDate.getFullYear() !== y ||
    parsedDate.getMonth() !== mo - 1 ||
    parsedDate.getDate() !== d
  ) {
    return NextResponse.json({ error: 'Invalid date.' }, { status: 422 })
  }

  // Validate appointment is in the future
  const [th, tm] = time.split(':').map(Number)
  const apptTime = new Date(y, mo - 1, d, th, tm)
  if (apptTime <= new Date())
    return NextResponse.json({ error: 'That time has passed. Please choose a future slot.' }, { status: 422 })

  // Validate against availability settings
  if (!isAllowedDay(date))
    return NextResponse.json({ error: 'That day is not available for booking.' }, { status: 422 })
  if (!isWithinAdvanceWindow(date))
    return NextResponse.json({ error: 'That date is outside the booking window.' }, { status: 422 })

  // Check if slot is manually blocked
  if (isSlotBlocked(date, time))
    return NextResponse.json({ error: 'That slot is no longer available.' }, { status: 422 })

  const booking = { name, email, phone, service, date, time, notes }
  let calLink = ''

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try { calLink = await createBookingEvent(booking) }
    catch (err) { console.error('Google Calendar error:', err) }
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await Promise.all([
        sendClientConfirmation(booking, calLink),
        sendOwnerNotification(booking),
      ])
    } catch (err) { console.error('Email error:', err) }
  }

  return NextResponse.json({ success: true, message: 'Booking confirmed!', calLink })
}
