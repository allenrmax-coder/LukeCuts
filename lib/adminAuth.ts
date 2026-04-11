import { createHmac, timingSafeEqual } from 'crypto'

function getSecret() {
  return process.env.ADMIN_SECRET ?? 'changeme-set-ADMIN_SECRET-in-env'
}

// Token rotates daily — stateless, no DB needed
function getDayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function generateAdminToken(): string {
  return createHmac('sha256', getSecret()).update(getDayKey()).digest('hex')
}

export function verifyAdminToken(value: string | undefined): boolean {
  if (!value) return false
  const expected = generateAdminToken()
  try {
    const a = Buffer.from(value, 'hex')
    const b = Buffer.from(expected, 'hex')
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export const COOKIE_NAME = 'admin_session'
export const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours in seconds
