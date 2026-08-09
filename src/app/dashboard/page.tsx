'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Download, CheckCircle, XCircle, ExternalLink, KeyRound, Award, Calendar } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [openEvents, setOpenEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [claimCode, setClaimCode] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [claimMessage, setClaimMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      if (!res.ok || !data.user) {
        router.push('/login')
        return
      }
      setUser(data.user)
    } catch {
      router.push('/login')
    }
  }

  const fetchOpenEvents = async () => {
    try {
      const res = await fetch('/api/events')
      const data = await res.json()
      if (data.events) setOpenEvents(data.events)
    } catch {
      // non-fatal, section just won't show
    }
  }

  useEffect(() => {
    Promise.all([fetchUser(), fetchOpenEvents()]).finally(() => setLoading(false))
  }, [])

  const handleGenerate = async (eventId: string) => {
    setGeneratingId(eventId)
    setError('')
    try {
      const res = await fetch('/api/certificate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal generate sertifikat')
      await fetchUser()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGeneratingId(null)
    }
  }

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!claimCode.trim()) return
    setClaiming(true)
    setClaimMessage(null)
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: claimCode.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal klaim sertifikat')
      setClaimMessage({ type: 'success', text: 'Sertifikat berhasil diklaim!' })
      setClaimCode('')
      await fetchUser()
    } catch (err: any) {
      setClaimMessage({ type: 'error', text: err.message })
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!user) return null

  const certificates: any[] = user.certificates || []
  const ownedEventIds = new Set(certificates.map((c) => c.event.id))
  const availableEvents = openEvents.filter((e) => !ownedEventIds.has(e.id))

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Halo, {user.full_name} 👋
      </h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* My certificates */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Sertifikat Saya</h2>

        {certificates.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Anda belum memiliki sertifikat. Pilih event di bawah, atau klaim pakai kode.</p>
        ) : (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="bg-gray-50 dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-600" />
                      {cert.event.name}
                    </p>
                    <p className="font-mono text-sm text-gray-500 dark:text-gray-400 mt-1">{cert.certificate_id}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-xs font-semibold ${
                    cert.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {cert.status === 'ACTIVE' ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {cert.status === 'ACTIVE' ? 'Aktif' : 'Dicabut'}
                  </span>
                </div>

                {cert.status === 'ACTIVE' && (
                  <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <a
                      href={`/api/certificate/download/${cert.certificate_id}`}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                    <Link
                      href={`/verify/${cert.certificate_id}`}
                      className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium py-2.5 px-5 rounded-lg transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Verifikasi
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Open events */}
      {availableEvents.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
          <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Event Terbuka</h2>
          <div className="space-y-3">
            {availableEvents.map((ev) => (
              <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{ev.name}</p>
                  {ev.event_date && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ev.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleGenerate(ev.id)}
                  disabled={generatingId === ev.id}
                  className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-5 rounded-lg transition disabled:opacity-50"
                >
                  {generatingId === ev.id ? 'Memproses...' : 'Generate Sertifikat'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Claim by code */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-600" />
          Klaim Sertifikat
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Punya kode klaim dari panitia? Masukkan di sini untuk mengambil sertifikat Anda.
        </p>
        <form onSubmit={handleClaim} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            placeholder="Contoh: AB3D-9KLM"
            className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase"
          />
          <button
            type="submit"
            disabled={claiming}
            className="bg-gray-900 dark:bg-white dark:text-gray-900 hover:opacity-90 text-white font-medium py-2.5 px-6 rounded-lg transition disabled:opacity-50"
          >
            {claiming ? 'Memproses...' : 'Klaim'}
          </button>
        </form>
        {claimMessage && (
          <p className={`text-sm mt-3 ${claimMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {claimMessage.text}
          </p>
        )}
      </div>
    </div>
  )
}
