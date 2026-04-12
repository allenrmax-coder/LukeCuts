import { NextResponse } from 'next/server'
import { getAvailability } from '@/lib/availability'

export async function GET() {
  return NextResponse.json({ settings: getAvailability() })
}
