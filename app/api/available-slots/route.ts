import { NextRequest, NextResponse } from 'next/server'
import { getBusySlots } from '@/lib/googleCalendar'

// Available time slots (9am–8pm, every 45 min)
function generateSlots(date: string) {
  const slots: string[] = []
  const start = 9 * 60   // 9:00 AM in minutes
  const end = 20 * 60    // 8:00 PM in minutes
  const step = 45
  for (let m = start; m + step <= end; m += step) {
    const h = Math.floor(m / 60)
    const min = m % 60
    slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
  }
  return slots
}

function slotToMs(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime()
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  // Block bookings in the past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (new Date(date) < today) {
    return NextResponse.json({ slots: [] })
  }

  // If Google Calendar is not configured, return all slots
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return NextResponse.json({ slots: generateSlots(date) })
  }

  try {
    const busy = await getBusySlots(date)
    const allSlots = generateSlots(date)

    const available = allSlots.filter(slot => {
      const slotStart = slotToMs(date, slot)
      const slotEnd = slotStart + 45 * 60 * 1000
      // Block if overlaps any busy period
      return !busy.some(b => {
        const bStart = new Date(b.start).getTime()
        const bEnd = new Date(b.end).getTime()
        return slotStart < bEnd && slotEnd > bStart
      })
    })

    // Also block slots in the past for today
    const now = Date.now()
    const filtered = available.filter(slot => slotToMs(date, slot) > now + 30 * 60 * 1000)

    return NextResponse.json({ slots: filtered })
  } catch (err) {
    console.error('Slot fetch error:', err)
    // Fallback: return all slots if calendar fails
    return NextResponse.json({ slots: generateSlots(date) })
  }
}
