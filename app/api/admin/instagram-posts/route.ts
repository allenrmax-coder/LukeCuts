import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth'
import {
  getInstagramPosts,
  addInstagramPost,
  removeInstagramPost,
  reorderInstagramPosts,
  isValidInstagramUrl,
} from '@/lib/instagramPosts'

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(COOKIE_NAME)?.value)
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ posts: getInstagramPosts() })
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { url?: string; order?: string[] }

  // Reorder mode
  if (Array.isArray(body.order)) {
    if (!body.order.every(id => typeof id === 'string'))
      return NextResponse.json({ error: 'Invalid order array' }, { status: 422 })
    reorderInstagramPosts(body.order)
    return NextResponse.json({ ok: true })
  }

  // Add mode
  const url = (body.url ?? '').trim()
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })
  if (!isValidInstagramUrl(url))
    return NextResponse.json({ error: 'Invalid Instagram post URL. Must be an instagram.com/p/ or /reel/ URL.' }, { status: 422 })

  const post = addInstagramPost(url)
  return NextResponse.json({ post }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json() as { id?: string }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const deleted = removeInstagramPost(id)
  if (!deleted) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
