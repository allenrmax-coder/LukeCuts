import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/adminAuth'
import { getPhotos, savePhoto, deletePhoto, updatePhoto, ensureUploadDir } from '@/lib/photos'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

function requireAdmin(req: NextRequest) {
  return verifyAdminToken(req.cookies.get(COOKIE_NAME)?.value)
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_BYTES = 8 * 1024 * 1024

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ photos: getPhotos() })
}

// POST — upload new photo OR replace existing (pass replaceId in formData)
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try { formData = await req.formData() } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('photo') as File | null
  if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF allowed' }, { status: 415 })

  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: 'File too large (max 8MB)' }, { status: 413 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const newId = randomUUID()
  const newFilename = `${newId}.${ext}`
  const bytes = await file.arrayBuffer()

  ensureUploadDir()
  writeFileSync(join(process.cwd(), 'public', 'uploads', newFilename), Buffer.from(bytes))

  const alt = ((formData.get('alt') as string | null) ?? '').slice(0, 200)
  const replaceId = (formData.get('replaceId') as string | null) ?? ''

  if (replaceId) {
    // Replace existing photo — delete old file, update record in-place
    const photos = getPhotos()
    const existing = photos.find(p => p.id === replaceId)

    if (!existing) {
      // Clean up new file and bail
      try { unlinkSync(join(process.cwd(), 'public', 'uploads', newFilename)) } catch { /* ignore */ }
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    // Delete old file
    try { unlinkSync(join(process.cwd(), 'public', 'uploads', existing.filename)) } catch { /* already gone */ }

    // Update record in-place (keeps same id and position in array)
    const updated = updatePhoto(replaceId, {
      filename: newFilename,
      url: `/uploads/${newFilename}`,
      alt: alt || existing.alt,
    })
    if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

    const photo = getPhotos().find(p => p.id === replaceId)
    return NextResponse.json({ photo })
  }

  // New upload
  const photo = {
    id: newId,
    filename: newFilename,
    url: `/uploads/${newFilename}`,
    alt,
    uploadedAt: new Date().toISOString(),
  }
  savePhoto(photo)
  return NextResponse.json({ photo }, { status: 201 })
}

// PATCH — update caption/alt text only
export async function PATCH(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { id?: string; alt?: string }
  if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (typeof body.alt !== 'string') return NextResponse.json({ error: 'Missing alt' }, { status: 400 })

  const ok = updatePhoto(body.id, { alt: body.alt.slice(0, 200) })
  if (!ok) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json() as { id?: string }
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const deleted = deletePhoto(id)
  if (!deleted) return NextResponse.json({ error: 'Photo not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
