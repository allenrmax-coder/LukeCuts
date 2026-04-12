import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminTokenEdge, COOKIE_NAME } from './lib/adminAuthEdge'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = req.cookies.get(COOKIE_NAME)?.value
    if (!await verifyAdminTokenEdge(token)) {
      const loginUrl = new URL('/admin/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
