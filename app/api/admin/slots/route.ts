import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth'
import { setSlotBlocked, setDayBlocked, getBlockedSlots } from '@/lib/blockedSlots'
import { getBusySlots } from '@/lib/googleCalendar'
import { getAvailability, generateSlots } from '@/lib/availability'

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(COOKIE_NAME)?.value)
}

// GET /api/admin/slots?date=YYYY-MM-DD
// Returns all slots with status: available | booked | blocked
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })

  const settings = getAvailability()
  const allSlotTimes = generateSlots(settings)

  const blocked = getBlockedSlots()
  const dayBlocked = blocked[date]

  let busyRanges: { start: string; end: string }[] = []
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try { busyRanges = await getBusySlots(date) } catch { /* ignore */ }
  }

  const slotMs = settings.slotDuration * 60 * 1000

  const slots = allSlotTimes.map(time => {
    const slotStart = new Date(`${date}T${time}:00`).getTime()
    const slotEnd = slotStart + slotMs

    const isBooked = busyRanges.some(b => {
      const bStart = new Date(b.start).getTime()
      const bEnd = new Date(b.end).getTime()
      return slotStart < bEnd && slotEnd > bStart
    })

    const isManuallyBlocked =
      dayBlocked === 'all' || (Array.isArray(dayBlocked) && dayBlocked.includes(time))

    const status: 'booked' | 'blocked' | 'available' =
      isBooked ? 'booked' : isManuallyBlocked ? 'blocked' : 'available'

    return { time, status }
  })

  return NextResponse.json({ date, slots, dayBlocked: dayBlocked === 'all' })
}

// POST /api/admin/slots
// Body: { date, time, blocked: boolean } or { date, dayBlocked: boolean }
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    date?: string; time?: string; blocked?: boolean; dayBlocked?: boolean
  }

  if (!body.date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })

  if (typeof body.dayBlocked === 'boolean') {
    setDayBlocked(body.date, body.dayBlocked)
    return NextResponse.json({ ok: true })
  }

  if (!body.time || typeof body.blocked !== 'boolean') {
    return NextResponse.json({ error: 'Missing time or blocked' }, { status: 400 })
  }

  setSlotBlocked(body.date, body.time, body.blocked)
  return NextResponse.json({ ok: true })
}
