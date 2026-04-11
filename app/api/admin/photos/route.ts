import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth'
import { getPhotos, savePhoto, deletePhoto, ensureUploadDir } from '@/lib/photos'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(COOKIE_NAME)?.value)
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ photos: getPhotos() })
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try { formData = await req.formData() } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('photo') as File | null
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  // Validate file type
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF allowed' }, { status: 415 })
  }

  // Max 8MB
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 8MB)' }, { status: 413 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const id = randomUUID()
  const filename = `${id}.${ext}`

  ensureUploadDir()
  const bytes = await file.arrayBuffer()
  writeFileSync(join(process.cwd(), 'public', 'uploads', filename), Buffer.from(bytes))

  const alt = (formData.get('alt') as string | null) ?? ''
  const photo = {
    id,
    filename,
    url: `/uploads/${filename}`,
    alt: alt.slice(0, 200),
    uploadedAt: new Date().toISOString(),
  }

  savePhoto(photo)
  return NextResponse.json({ photo }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json() as { id?: string }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const deleted = deletePhoto(id)
  if (!deleted) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
