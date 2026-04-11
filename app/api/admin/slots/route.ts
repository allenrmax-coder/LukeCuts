import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth'
import { setSlotBlocked, setDayBlocked, getBlockedSlots } from '@/lib/blockedSlots'
import { getBusySlots } from '@/lib/googleCalendar'

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(COOKIE_NAME)?.value)
}

// Generate all slots for a day (same as available-slots route)
function allSlots() {
  const slots: string[] = []
  for (let m = 9 * 60; m + 45 <= 20 * 60; m += 45) {
    const h = Math.floor(m / 60)
    const min = m % 60
    slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
  }
  return slots
}

// GET /api/admin/slots?date=YYYY-MM-DD
// Returns all slots with status: available | booked | blocked
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const date = req.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })

  const blocked = getBlockedSlots()
  const dayBlocked = blocked[date]

  let busyRanges: { start: string; end: string }[] = []
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try { busyRanges = await getBusySlots(date) } catch { /* ignore */ }
  }

  const slots = allSlots().map(time => {
    const slotMs = new Date(`${date}T${time}:00`).getTime()
    const slotEndMs = slotMs + 45 * 60 * 1000

    const isBooked = busyRanges.some(b => {
      const bStart = new Date(b.start).getTime()
      const bEnd = new Date(b.end).getTime()
      return slotMs < bEnd && slotEndMs > bStart
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
