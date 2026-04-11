import { NextRequest, NextResponse } from 'next/server'
import { createBookingEvent } from '@/lib/googleCalendar'
import { sendClientConfirmation, sendOwnerNotification } from '@/lib/email'

function sanitize(s: string) {
  return s.replace(/<[^>]*>/g, '').trim().slice(0, 500)
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPhone(phone: string) {
  return /^[\d\s\-().+]{7,20}$/.test(phone)
}

const VALID_SERVICES = [
  'Scissors Cut ($30)',
  'Clipper Cut ($40)',
]

export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const b = body as Record<string, string>
  const name    = sanitize(b.name ?? '')
  const email   = sanitize(b.email ?? '')
  const phone   = sanitize(b.phone ?? '')
  const service = sanitize(b.service ?? '')
  const date    = sanitize(b.date ?? '')
  const time    = sanitize(b.time ?? '')
  const notes   = sanitize(b.notes ?? '')

  if (!name || name.length < 2)      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 422 })
  if (!isValidEmail(email))          return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 422 })
  if (!isValidPhone(phone))          return NextResponse.json({ error: 'Please enter a valid phone number.' }, { status: 422 })
  if (!VALID_SERVICES.includes(service)) return NextResponse.json({ error: 'Please select a valid service.' }, { status: 422 })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Please select a date.' }, { status: 422 })
  if (!/^\d{2}:\d{2}$/.test(time))   return NextResponse.json({ error: 'Please select a time slot.' }, { status: 422 })

  const apptDate = new Date(`${date}T${time}:00`)
  if (apptDate < new Date()) {
    return NextResponse.json({ error: 'That time has passed. Please choose a future slot.' }, { status: 422 })
  }

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
