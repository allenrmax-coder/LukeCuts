import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth'
import { getAvailability, saveAvailability, AvailabilitySettings } from '@/lib/availability'

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(COOKIE_NAME)?.value)
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ settings: getAvailability() })
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Partial<AvailabilitySettings>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Validate allowedDays
  if (body.allowedDays !== undefined) {
    if (!Array.isArray(body.allowedDays) || !body.allowedDays.every(d => Number.isInteger(d) && d >= 0 && d <= 6)) {
      return NextResponse.json({ error: 'allowedDays must be array of 0-6' }, { status: 422 })
    }
  }

  // Validate time strings
  const timeRe = /^\d{2}:\d{2}$/
  if (body.startTime !== undefined && !timeRe.test(body.startTime))
    return NextResponse.json({ error: 'Invalid startTime' }, { status: 422 })
  if (body.endTime !== undefined && !timeRe.test(body.endTime))
    return NextResponse.json({ error: 'Invalid endTime' }, { status: 422 })

  // Validate slot duration
  if (body.slotDuration !== undefined) {
    const valid = [15, 30, 45, 60, 90]
    if (!valid.includes(body.slotDuration))
      return NextResponse.json({ error: 'Invalid slotDuration' }, { status: 422 })
  }

  // Validate advance days (1–30)
  if (body.advanceDays !== undefined) {
    if (!Number.isInteger(body.advanceDays) || body.advanceDays < 1 || body.advanceDays > 30)
      return NextResponse.json({ error: 'advanceDays must be 1–30' }, { status: 422 })
  }

  saveAvailability(body)
  return NextResponse.json({ ok: true, settings: getAvailability() })
}
