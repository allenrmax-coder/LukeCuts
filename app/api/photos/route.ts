import { NextResponse } from 'next/server'
import { getPhotos } from '@/lib/photos'

export async function GET() {
  return NextResponse.json({ photos: getPhotos() })
}
