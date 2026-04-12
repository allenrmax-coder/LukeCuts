import { NextRequest, NextResponse } from 'next/server'
import { getBusySlots } from '@/lib/googleCalendar'
import { isSlotBlocked } from '@/lib/blockedSlots'
import {
  getAvailability,
  generateSlots,
  isAllowedDay,
  isWithinAdvanceWindow,
} from '@/lib/availability'

type SlotStatus = 'available' | 'booked'
interface SlotInfo { time: string; status: SlotStatus }

function slotToMs(date: string, time: string) {
  return new Date(`${date}T${time}:00`).getTime()
}

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ slots: [] }, { status: 400 })
  }

  // Outside the bookable window — return empty (client handles the messaging)
  if (!isAllowedDay(date) || !isWithinAdvanceWindow(date)) {
    return NextResponse.json({ slots: [] })
  }

  const settings = getAvailability()
  const allSlots = generateSlots(settings)

  // Drop slots that are within 30 min of now (for same-day bookings)
  const now = Date.now()
  const visible = allSlots.filter(slot => slotToMs(date, slot) > now + 30 * 60 * 1000)

  // No Google Calendar configured — classify by admin blocks only
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const slots: SlotInfo[] = visible.map(slot => ({
      time: slot,
      status: isSlotBlocked(date, slot) ? 'booked' : 'available',
    }))
    return NextResponse.json({ slots })
  }

  try {
    const busy = await getBusySlots(date)
    const slotMs = settings.slotDuration * 60 * 1000

    const slots: SlotInfo[] = visible.map(slot => {
      // Admin-blocked slots appear as booked to users
      if (isSlotBlocked(date, slot)) return { time: slot, status: 'booked' }

      const slotStart = slotToMs(date, slot)
      const slotEnd = slotStart + slotMs
      const isBusy = busy.some(b => {
        const bStart = new Date(b.start).getTime()
        const bEnd = new Date(b.end).getTime()
        return slotStart < bEnd && slotEnd > bStart
      })

      return { time: slot, status: isBusy ? 'booked' : 'available' }
    })

    return NextResponse.json({ slots })
  } catch (err) {
    console.error('Slot fetch error:', err)
    // Fallback: show admin blocks as booked, rest as available
    const slots: SlotInfo[] = visible.map(slot => ({
      time: slot,
      status: isSlotBlocked(date, slot) ? 'booked' : 'available',
    }))
    return NextResponse.json({ slots })
  }
}
