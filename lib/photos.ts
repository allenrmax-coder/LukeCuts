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

function read(): Photo[] {
  try { return JSON.parse(readFileSync(DATA_FILE, 'utf-8')) } catch { return [] }
}

function write(photos: Photo[]) {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2))
}

export function getPhotos(): Photo[] {
  return read()
}

export function getPhotoById(id: string): Photo | undefined {
  return read().find(p => p.id === id)
}

export function savePhoto(photo: Photo): void {
  const photos = read()
  photos.unshift(photo)
  write(photos)
}

export function updatePhoto(id: string, patch: Partial<Pick<Photo, 'alt' | 'filename' | 'url'>>): boolean {
  const photos = read()
  const idx = photos.findIndex(p => p.id === id)
  if (idx === -1) return false
  photos[idx] = { ...photos[idx], ...patch }
  write(photos)
  return true
}

export function deletePhoto(id: string): boolean {
  const photos = read()
  const photo = photos.find(p => p.id === id)
  if (!photo) return false
  try { unlinkSync(join(UPLOAD_DIR, photo.filename)) } catch { /* already gone */ }
  write(photos.filter(p => p.id !== id))
  return true
}

export function ensureUploadDir(): void {
  mkdirSync(UPLOAD_DIR, { recursive: true })
}
