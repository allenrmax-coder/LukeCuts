import { NextResponse } from 'next/server'
import { getInstagramPosts, toEmbedUrl } from '@/lib/instagramPosts'

export async function GET() {
  const posts = getInstagramPosts().map(p => ({
    ...p,
    embedUrl: toEmbedUrl(p.url),
  }))
  return NextResponse.json({ posts })
}
