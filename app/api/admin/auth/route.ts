import { NextRequest, NextResponse } from 'next/server'
import { generateAdminToken, verifyAdminToken, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/adminAuth'

export async function POST(req: NextRequest) {
  let body: { password?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const correctPassword = process.env.ADMIN_PASSWORD
  if (!correctPassword) {
    return NextResponse.json({ error: 'Admin not configured. Set ADMIN_PASSWORD in .env.local.' }, { status: 503 })
  }

  // Constant-time compare to prevent timing attacks
  const { timingSafeEqual } = await import('crypto')
  const a = Buffer.from(body.password ?? '')
  const b = Buffer.from(correctPassword)
  const match = a.length === b.length && timingSafeEqual(a, b)

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

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_NAME)
  return res
}
