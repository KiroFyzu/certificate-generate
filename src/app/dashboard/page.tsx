'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Download, CheckCircle, PlusCircle, ExternalLink } from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/certificate/generate', { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Gagal generate sertifikat')
      }
      
      await fetchUser() // Reload to get certificate info
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!user) return null

  const cert = user.certificate

  return (
    <div className="max-w-4xl mx-auto p-6 mt-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Halo, {user.full_name} 👋
      </h1>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg">
            {error}
          </div>
        )}

        {cert ? (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
              <CheckCircle className="w-6 h-6" />
              <h2 className="text-xl font-semibold">Sertifikat telah tersedia</h2>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Certificate ID</p>
              <p className="font-mono font-bold text-lg dark:text-white">{cert.certificate_id}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="/api/certificate/download"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
              >
                <Download className="w-5 h-5" />
                DOWNLOAD SERTIFIKAT
              </a>
              <Link 
                href={`/verify/${cert.certificate_id}`}
                className="flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium py-3 px-6 rounded-lg transition"
              >
                <ExternalLink className="w-5 h-5" />
                VERIFIKASI SERTIFIKAT
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-center py-8">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Anda belum memiliki sertifikat</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Klik tombol di bawah ini untuk membuat sertifikat digital Anda sekarang. Pastikan nama yang terdaftar sudah sesuai.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-lg shadow-md transition disabled:opacity-50"
            >
              {generating ? 'Memproses...' : 'GENERATE SERTIFIKAT'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
