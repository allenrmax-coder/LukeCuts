import { NextResponse } from 'next/server'

export const revalidate = 300 // cache 5 minutes

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Instagram not configured' }, { status: 503 })
  }

  try {
    // Fetch media from Instagram Graph API
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'
    const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=9&access_token=${token}`

    const res = await fetch(url, { next: { revalidate: 300 } })
    if (!res.ok) {
      const err = await res.json()
      console.error('Instagram API error:', err)
      return NextResponse.json({ error: 'Failed to fetch Instagram posts' }, { status: 502 })
    }

    const data = await res.json()

    // Filter to only IMAGE and CAROUSEL types (exclude pure videos with no thumbnail)
    const posts = (data.data ?? [])
      .filter((p: { media_type: string }) => ['IMAGE', 'CAROUSEL_ALBUM'].includes(p.media_type))
      .slice(0, 9)
      .map((p: { id: string; caption?: string; media_type: string; media_url: string; thumbnail_url?: string; permalink: string; timestamp: string }) => ({
        id: p.id,
        caption: p.caption ?? '',
        mediaType: p.media_type,
        mediaUrl: p.media_url ?? p.thumbnail_url ?? '',
        permalink: p.permalink,
        timestamp: p.timestamp,
      }))

    return NextResponse.json({ posts })
  } catch (err) {
    console.error('Instagram fetch error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
