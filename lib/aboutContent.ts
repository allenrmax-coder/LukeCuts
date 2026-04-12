import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_FILE = join(process.cwd(), 'data', 'about-content.json')

export type MediaMode = 'none' | 'video' | 'photo'

export interface AboutContent {
  mode: MediaMode
  videoUrl: string   // YouTube/Vimeo embed URL
  photoId: string    // ID of an uploaded photo from data/photos.json
}

const DEFAULTS: AboutContent = {
  mode: 'none',
  videoUrl: '',
  photoId: '',
}

export function getAboutContent(): AboutContent {
  try {
    const raw = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
    // Migrate legacy videoEnabled field
    if (raw.videoEnabled === true && !raw.mode) raw.mode = 'video'
    return { ...DEFAULTS, ...raw }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveAboutContent(patch: Partial<AboutContent>): void {
  const current = getAboutContent()
  const updated = { ...current, ...patch }
  mkdirSync(join(process.cwd(), 'data'), { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2))
}
