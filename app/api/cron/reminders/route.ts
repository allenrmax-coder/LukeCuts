// Vercel Cron Job — runs every 30 minutes (see vercel.json)
// Sends 24h and 2h reminder emails to clients with upcoming appointments.
// Secured with CRON_SECRET so it can only be triggered by Vercel.

import { NextRequest, NextResponse } from 'next/server'
import { getBookingsDueForReminder, markReminded, pruneOldBookings } from '@/lib/bookingStore'
import { send24hReminder, send2hReminder } from '@/lib/email'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Verify the request comes from Vercel's cron scheduler
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ skipped: 'SMTP not configured' })
  }

  // Remove bookings older than 7 days to keep the file lean
  pruneOldBookings()

  const { need24h, need2h } = getBookingsDueForReminder()

  const results: string[] = []

  for (const booking of need24h) {
    try {
      await send24hReminder(booking)
      markReminded(booking.id, '24h')
      results.push(`24h sent → ${booking.email} (${booking.date} ${booking.time})`)
    } catch (err) {
      results.push(`24h FAILED → ${booking.email}: ${String(err)}`)
      console.error('[cron/reminders] 24h error:', err)
    }
  }

  for (const booking of need2h) {
    try {
      await send2hReminder(booking)
      markReminded(booking.id, '2h')
      results.push(`2h sent → ${booking.email} (${booking.date} ${booking.time})`)
    } catch (err) {
      results.push(`2h FAILED → ${booking.email}: ${String(err)}`)
      console.error('[cron/reminders] 2h error:', err)
    }
  }

  return NextResponse.json({
    ok: true,
    sent: results.length,
    results,
    timestamp: new Date().toISOString(),
  })
}
