'use client'
import { useRouter } from 'next/navigation'
import { Scissors, LogOut } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#080808]/80 backdrop-blur z-50">
        <div className="flex items-center gap-2.5">
          <Scissors className="w-5 h-5 text-white" />
          <span className="font-black text-lg tracking-tight">LukeCuts Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-white transition-colors">
            View Site
          </a>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-10">
        {children}
      </main>
    </div>
  )
}
