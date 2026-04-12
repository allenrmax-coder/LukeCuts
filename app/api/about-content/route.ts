import { NextResponse } from 'next/server'
import { getAboutContent } from '@/lib/aboutContent'
import { getPhotoById } from '@/lib/photos'

export async function GET() {
  const content = getAboutContent()

  // Resolve photo URL when mode is 'photo'
  let photoUrl = ''
  if (content.mode === 'photo' && content.photoId) {
    const photo = getPhotoById(content.photoId)
    photoUrl = photo?.url ?? ''
  }

  return NextResponse.json({ content: { ...content, photoUrl } })
}
