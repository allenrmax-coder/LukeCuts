import { google } from 'googleapis'

// Build the Google auth client from env variables.
// We use a service account — no OAuth flow needed.
function getAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  if (!keyJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not set')

  const key = JSON.parse(keyJson)

  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
}

export async function getCalendarClient() {
  const auth = getAuth()
  return google.calendar({ version: 'v3', auth })
}

export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? 'lukephilipsanderson2007@gmail.com'

// Luke's personal email — always added as attendee so events appear on his calendar
const OWNER_EMAIL = process.env.OWNER_EMAIL ?? 'lukephilipsanderson2007@gmail.com'

// Fetch busy slots for a given date (returns array of { start, end } UTC strings)
export async function getBusySlots(date: string): Promise<{ start: string; end: string }[]> {
  const cal = await getCalendarClient()

  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T23:59:59`)

  const res = await cal.freebusy.query({
    requestBody: {
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      items: [{ id: CALENDAR_ID }],
    },
  })

  const busy = res.data.calendars?.[CALENDAR_ID]?.busy ?? []
  return busy.filter(
    (slot): slot is { start: string; end: string } =>
      typeof slot.start === 'string' && typeof slot.end === 'string',
  )
}

export interface BookingDetails {
  name: string
  email: string
  phone: string
  service: string
  date: string     // YYYY-MM-DD
  time: string     // HH:mm (24h)
  notes?: string
}

// Create a Google Calendar event and return the event link
export async function createBookingEvent(booking: BookingDetails): Promise<string> {
  const cal = await getCalendarClient()

  const [hour, minute] = booking.time.split(':').map(Number)
  const start = new Date(`${booking.date}T${booking.time}:00`)
  const end = new Date(start.getTime() + 45 * 60 * 1000) // 45-min appointment

  const event = await cal.events.insert({
    calendarId: CALENDAR_ID,
    sendUpdates: 'all',
    requestBody: {
      summary: `✂ ${booking.service} — ${booking.name}`,
      description: [
        `Client: ${booking.name}`,
        `Phone: ${booking.phone}`,
        `Email: ${booking.email}`,
        `Service: ${booking.service}`,
        booking.notes ? `Notes: ${booking.notes}` : '',
      ].filter(Boolean).join('\n'),
      start: { dateTime: start.toISOString(), timeZone: 'America/New_York' },
      end: { dateTime: end.toISOString(), timeZone: 'America/New_York' },
      attendees: [
        { email: OWNER_EMAIL, displayName: 'Luke', responseStatus: 'accepted' },
        { email: booking.email, displayName: booking.name },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },  // 24h before
          { method: 'email', minutes: 60 },         // 1h before
          { method: 'popup', minutes: 30 },
        ],
      },
      colorId: '2', // Sage green
    },
  })

  return event.data.htmlLink ?? ''
}
