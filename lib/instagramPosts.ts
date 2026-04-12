import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'

const DATA_FILE = join(process.cwd(), 'data', 'instagram-posts.json')

export interface StoredPost {
  id: string
  url: string
  addedAt: string
}

function read(): StoredPost[] {
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function write(posts: StoredPost[]) {
  mkdirSync(join(process.cwd(), 'data'), { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2))
}

// Validate it looks like an Instagram post/reel URL
export function isValidInstagramUrl(url: string): boolean {
  return /^https:\/\/(www\.)?instagram\.com\/(p|reel)\/[A-Za-z0-9_-]+\/?/.test(url)
}

// Extract embed URL: instagram.com/p/ABC → instagram.com/p/ABC/embed/
export function toEmbedUrl(postUrl: string): string {
  const m = postUrl.match(/instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/)
  if (!m) return ''
  return `https://www.instagram.com/${m[1]}/${m[2]}/embed/`
}

export function getInstagramPosts(): StoredPost[] {
  return read()
}

export function addInstagramPost(url: string): StoredPost {
  const posts = read()
  const post: StoredPost = { id: randomUUID(), url, addedAt: new Date().toISOString() }
  posts.unshift(post)
  write(posts)
  return post
}

export function removeInstagramPost(id: string): boolean {
  const posts = read()
  const updated = posts.filter(p => p.id !== id)
  if (updated.length === posts.length) return false
  write(updated)
  return true
}

export function reorderInstagramPosts(ids: string[]): void {
  const posts = read()
  const map = new Map(posts.map(p => [p.id, p]))
  const reordered = ids.map(id => map.get(id)).filter(Boolean) as StoredPost[]
  write(reordered)
}
