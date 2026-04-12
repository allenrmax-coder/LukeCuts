// Edge-runtime-compatible admin auth using the Web Crypto API.
// Used exclusively by middleware.ts (Edge runtime — no Node.js modules allowed).
// All admin API routes continue to use lib/adminAuth.ts (Node.js crypto, synchronous).
// Both files produce identical HMAC-SHA256 tokens so sessions work across both.

export const COOKIE_NAME = 'admin_session'

function getSecret(): string {
  return process.env.ADMIN_SECRET ?? 'changeme-set-ADMIN_SECRET-in-env'
}

function getDayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

async function getHmacKey(usage: 'sign' | 'verify'): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    [usage],
  )
}

// Timing-safe: uses crypto.subtle.verify (constant-time internally)
export async function verifyAdminTokenEdge(value: string | undefined): Promise<boolean> {
  if (!value || !/^[0-9a-f]{64}$/.test(value)) return false
  try {
    const key = await getHmacKey('verify')
    const tokenBytes = new Uint8Array(
      (value.match(/.{2}/g) ?? []).map(h => parseInt(h, 16)),
    )
    return await crypto.subtle.verify(
      'HMAC',
      key,
      tokenBytes,
      new TextEncoder().encode(getDayKey()),
    )
  } catch {
    return false
  }
}
