import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'data', 'blocked-slots.json')

type BlockedSlots = Record<string, string[] | 'all'>

function read(): BlockedSlots {
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return {}
  }
}

function write(data: BlockedSlots) {
  try {
    mkdirSync(join(process.cwd(), 'data'), { recursive: true })
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Failed to write blocked slots:', err)
  }
}

export function getBlockedSlots(): BlockedSlots {
  return read()
}

export function isSlotBlocked(date: string, time: string): boolean {
  const blocked = read()
  const day = blocked[date]
  if (!day) return false
  if (day === 'all') return true
  return (day as string[]).includes(time)
}

export function setSlotBlocked(date: string, time: string, blocked: boolean) {
  const data = read()
  const current = data[date]

  if (blocked) {
    if (!current) {
      data[date] = [time]
    } else if (current !== 'all' && !(current as string[]).includes(time)) {
      data[date] = [...(current as string[]), time]
    }
  } else {
    if (!current || current === 'all') return
    const updated = (current as string[]).filter(t => t !== time)
    if (updated.length === 0) delete data[date]
    else data[date] = updated
  }

  write(data)
}

export function setDayBlocked(date: string, blocked: boolean) {
  const data = read()
  if (blocked) {
    data[date] = 'all'
  } else {
    delete data[date]
  }
  write(data)
}
