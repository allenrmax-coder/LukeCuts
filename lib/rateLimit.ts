// Simple in-memory rate limiter (fine for single-process Next.js)
const store = new Map<string, { count: number; resetAt: number }>()

// Prune expired entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of store) {
      if (now > v.resetAt) store.delete(k)
    }
  }, 5 * 60 * 1000)
}

export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean } {
  const now = Date.now()
  const rec = store.get(key)

  if (!rec || now > rec.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (rec.count >= maxRequests) return { allowed: false }

  rec.count++
  return { allowed: true }
}
