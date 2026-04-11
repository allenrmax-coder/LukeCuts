import { readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'data', 'photos.json')
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

export interface Photo {
  id: string
  filename: string
  url: string
  alt: string
  uploadedAt: string
}

export function getPhotos(): Photo[] {
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return []
  }
}

export function savePhoto(photo: Photo): void {
  const photos = getPhotos()
  photos.unshift(photo) // newest first
  writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2))
}

export function deletePhoto(id: string): boolean {
  const photos = getPhotos()
  const photo = photos.find(p => p.id === id)
  if (!photo) return false

  try {
    unlinkSync(join(UPLOAD_DIR, photo.filename))
  } catch {
    // File may already be gone
  }

  const updated = photos.filter(p => p.id !== id)
  writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2))
  return true
}

export function ensureUploadDir(): void {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}
