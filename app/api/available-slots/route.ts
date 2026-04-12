import { NextRequest, NextResponse } from 'next/server'
import { getBusySlots } from '@/lib/googleCalendar'
import { isSlotBlocked } from '@/lib/blockedSlots'
import {
  getAvailability,
  generateSlots,
  isAllowedDay,
  isWithinAdvanceWindow,
} from '@/lib/availability'

function slotToMs(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime()
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  // Must be an allowed day of the week and within advance window
  if (!isAllowedDay(date) || !isWithinAdvanceWindow(date)) {
    return NextResponse.json({ slots: [] })
  }

  const settings = getAvailability()
  const allSlots = generateSlots(settings)

  // Remove manually blocked slots
  const unblocked = allSlots.filter(slot => !isSlotBlocked(date, slot))

  // Also remove slots less than 30 min from now (for today)
  const now = Date.now()
  const futureOnly = unblocked.filter(slot => slotToMs(date, slot) > now + 30 * 60 * 1000)

  // If Google Calendar is not configured, return these slots
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return NextResponse.json({ slots: futureOnly })
  }

  try {
    const busy = await getBusySlots(date)
    const slotMs = settings.slotDuration * 60 * 1000

    const available = futureOnly.filter(slot => {
      const slotStart = slotToMs(date, slot)
      const slotEnd = slotStart + slotMs
      return !busy.some(b => {
        const bStart = new Date(b.start).getTime()
        const bEnd = new Date(b.end).getTime()
        return slotStart < bEnd && slotEnd > bStart
      })
    })

    return NextResponse.json({ slots: available })
  } catch (err) {
    console.error('Slot fetch error:', err)
    return NextResponse.json({ slots: futureOnly })
  }
}
