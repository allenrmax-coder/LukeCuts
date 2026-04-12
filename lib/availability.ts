import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'data', 'availability.json')

export interface AvailabilitySettings {
  allowedDays: number[]   // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
  startTime: string       // "HH:MM" 24h
  endTime: string         // "HH:MM" 24h
  slotDuration: number    // minutes
  advanceDays: number     // max days bookable in advance
}

// Default: Tue/Thu/Sat, 3:30–7:15 PM, 45-min slots, 1 week ahead
const DEFAULTS: AvailabilitySettings = {
  allowedDays: [2, 4, 6],
  startTime: '15:30',
  endTime: '19:15',
  slotDuration: 45,
  advanceDays: 7,
}

export function getAvailability(): AvailabilitySettings {
  try {
    const raw = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
    return { ...DEFAULTS, ...raw }
  } catch {
    return DEFAULTS
  }
}

export function saveAvailability(patch: Partial<AvailabilitySettings>): void {
  const current = getAvailability()
  const updated = { ...current, ...patch }
  mkdirSync(join(process.cwd(), 'data'), { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2))
}

// Generate time slots between startTime and endTime with slotDuration spacing
export function generateSlots(settings?: AvailabilitySettings): string[] {
  const s = settings ?? getAvailability()
  const [sh, sm] = s.startTime.split(':').map(Number)
  const [eh, em] = s.endTime.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  const slots: string[] = []
  for (let m = startMin; m + s.slotDuration <= endMin; m += s.slotDuration) {
    const h = Math.floor(m / 60)
    const min = m % 60
    slots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`)
  }
  return slots
}

// Returns true if the given date string (YYYY-MM-DD) is an allowed day
export function isAllowedDay(date: string, settings?: AvailabilitySettings): boolean {
  const s = settings ?? getAvailability()
  const [year, month, day] = date.split('-').map(Number)
  const dow = new Date(year, month - 1, day).getDay()
  return s.allowedDays.includes(dow)
}

// Returns true if the date is within the bookable advance window
export function isWithinAdvanceWindow(date: string, settings?: AvailabilitySettings): boolean {
  const s = settings ?? getAvailability()
  const [year, month, day] = date.split('-').map(Number)
  const appt = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date(today)
  maxDate.setDate(today.getDate() + s.advanceDays)
  return appt >= today && appt <= maxDate
}
