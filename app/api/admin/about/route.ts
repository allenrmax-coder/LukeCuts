import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth'
import { getAboutContent, saveAboutContent, MediaMode } from '@/lib/aboutContent'

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(COOKIE_NAME)?.value)
}

const VALID_MODES: MediaMode[] = ['none', 'video', 'photo']

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ content: getAboutContent() })
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    mode?: MediaMode
    videoUrl?: string
    photoId?: string
    // Legacy support
    videoEnabled?: boolean
  }

  // Legacy: videoEnabled toggle
  if (typeof body.videoEnabled === 'boolean') {
    saveAboutContent({ mode: body.videoEnabled ? 'video' : 'none' })
  }

  if (body.mode !== undefined) {
    if (!VALID_MODES.includes(body.mode))
      return NextResponse.json({ error: 'Invalid mode' }, { status: 422 })
    saveAboutContent({ mode: body.mode })
  }

  if (body.videoUrl !== undefined) {
    const url = body.videoUrl.trim()
    if (url && !/(youtube\.com\/embed|youtu\.be|vimeo\.com\/video|player\.vimeo\.com)/.test(url)) {
      return NextResponse.json(
        { error: 'Only YouTube (youtube.com/embed) or Vimeo embed URLs are allowed.' },
        { status: 422 },
      )
    }
    saveAboutContent({ videoUrl: url })
  }

  if (body.photoId !== undefined) {
    saveAboutContent({ photoId: body.photoId })
  }

  return NextResponse.json({ ok: true, content: getAboutContent() })
}
