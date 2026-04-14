import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Luke Cuts PSU | Mobile Barber at Penn State',
  description:
    'Penn State\'s go-to mobile barber. Fresh fades, tapers, and all hair types. Come to me in State College or I can come to you. Book online.',
  keywords: ['barber', 'Penn State', 'PSU', 'mobile barber', 'haircut', 'State College', 'fade', 'taper'],
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'Luke Cuts PSU | Mobile Barber at Penn State',
    description: 'Fresh cuts delivered to your door. Book your appointment online.',
    url: 'https://lukecutspsu.com',
    siteName: 'Luke Cuts PSU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luke Cuts PSU | Mobile Barber',
    description: 'Penn State\'s mobile barber. Book online.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
