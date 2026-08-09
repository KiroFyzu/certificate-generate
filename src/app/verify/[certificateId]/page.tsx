'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft, Award, Calendar, Hash, User } from 'lucide-react'

export default function VerifyPage() {
  const params = useParams()
  const router = useRouter()
  const certificateId = params.certificateId as string
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!certificateId) return

    fetch(`/api/verify/${certificateId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setData(data.certificate)
        }
      })
      .catch(() => {
        setError('Terjadi kesalahan sistem')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [certificateId])

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Memverifikasi sertifikat...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-lighten pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[10%] w-[35%] h-[35%] rounded-full bg-indigo-400/20 dark:bg-indigo-600/20 blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-lighten pointer-events-none"></div>

      <div className="max-w-xl w-full space-y-8 z-10 animate-fade-in-up">
        
        {error ? (
          <div className="glass-panel rounded-3xl p-10 border-t-4 border-t-red-500 text-center shadow-2xl shadow-red-500/10">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
              SERTIFIKAT TIDAK VALID
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              {error}
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-full transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </div>
        ) : data?.status === 'REVOKED' ? (
          <div className="glass-panel rounded-3xl p-10 border-t-4 border-t-orange-500 text-center shadow-2xl shadow-orange-500/10">
            <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-orange-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
              SERTIFIKAT DICABUT
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
              Sertifikat ini tidak lagi berlaku dan telah dicabut oleh sistem.
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-full transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </div>
        ) : data ? (
          <div className="glass-panel rounded-3xl p-10 border-t-4 border-t-green-500 shadow-2xl shadow-green-500/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-bl-full -z-10"></div>
            
            <div className="text-center mb-10">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-40 animate-pulse-slow"></div>
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center relative shadow-lg">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                SERTIFIKAT VALID
              </h2>
              <div className="inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold border border-green-200 dark:border-green-800/50">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Terverifikasi Resmi
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Diberikan Kepada</p>
                  <p className="font-bold text-xl text-slate-900 dark:text-white">{data.user.full_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Untuk Partisipasi Dalam</p>
                  <p className="font-bold text-lg text-slate-900 dark:text-white leading-tight">Seminar Nasional Teknologi 2026</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                    <Hash className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Certificate ID</p>
                    <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white truncate" title={data.id}>{data.id}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                  <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tanggal Terbit</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {new Date(data.issued_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Link 
                href="/" 
                className="inline-flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold group transition-all"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  )
}
