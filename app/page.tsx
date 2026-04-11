import AnimatedBackground from '@/components/AnimatedBackground'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import About from '@/components/About'
import InstagramFeed from '@/components/InstagramFeed'
import BookingForm from '@/components/BookingForm'
import FAQ from '@/components/FAQ'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <main className="relative min-h-screen">
      {/* Animated canvas background (fixed, behind everything) */}
      <AnimatedBackground />

      {/* Navigation */}
      <Navbar />

      {/* Page sections */}
      <Hero />
      <About />
      <InstagramFeed />
      <BookingForm />
      <FAQ />
      <Footer />
    </main>
  )
}
