'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogOut, LayoutDashboard, ShieldAlert } from 'lucide-react'

export default function Header() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user)
      })
      .catch(() => {})

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass-panel border-b border-white/20 dark:border-white/10' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="font-bold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 hover:opacity-80 transition flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span className="text-white text-lg leading-none">C</span>
          </div>
          CertiGen
        </Link>

        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin" className="text-sm font-semibold flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 transition">
                  <ShieldAlert className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <button 
                onClick={handleLogout}
                className="text-sm font-semibold flex items-center gap-2 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition ml-2 border-l border-slate-200 dark:border-slate-800 pl-6"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition">
                Login
              </Link>
              <Link href="/register" className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-200">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
