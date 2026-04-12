import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { timingSafeEqual } from 'crypto'
import { generateAdminToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/adminAuth'
import { rateLimit } from '@/lib/rateLimit'

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(req: NextRequest) {
  // 5 login attempts per 15 minutes per IP
  const ip = getClientIp(req)
  if (!rateLimit(`login:${ip}`, 5, 15 * 60 * 1000).allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again in 15 minutes.' },
      { status: 429 },
    )
  }

  let body: { password?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const submitted = body.password ?? ''
  const hash = process.env.ADMIN_PASSWORD_HASH
  const plain = process.env.ADMIN_PASSWORD

  if (!hash && !plain) {
    return NextResponse.json(
      { error: 'Admin not configured. Set ADMIN_PASSWORD or ADMIN_PASSWORD_HASH in .env.local.' },
      { status: 503 },
    )
  }

  let match = false

  if (hash) {
    // Preferred: bcrypt hash stored in env
    match = await bcrypt.compare(submitted, hash)
  } else if (plain) {
    // Fallback: timing-safe plaintext comparison
    const a = Buffer.from(submitted)
    const b = Buffer.from(plain)
    match = a.length === b.length && timingSafeEqual(a, b)
  }

  if (!match) {
    return NextResponse.json({ error: 'Wrong password.' }, { status: 401 })
  }

  const token = generateAdminToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_NAME)
  return res
}
