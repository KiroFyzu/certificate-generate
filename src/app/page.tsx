'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, ShieldCheck, Download, Search } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [certId, setCertId] = useState('')

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (certId.trim()) {
      router.push(`/verify/${certId.trim()}`)
    }
  }

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-[100px] animate-blob mix-blend-multiply dark:mix-blend-lighten pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-indigo-400/20 dark:bg-indigo-600/20 blur-[100px] animate-blob animation-delay-2000 mix-blend-multiply dark:mix-blend-lighten pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-[100px] animate-blob animation-delay-4000 mix-blend-multiply dark:mix-blend-lighten pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-4 z-10">
        <div className="max-w-5xl mx-auto text-center space-y-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-4 border border-blue-100 dark:border-blue-800">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            Sistem Verifikasi Digital Terpercaya
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Dapatkan Sertifikat <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Event Anda
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Generate sertifikat digital dengan mudah dan dapat diverifikasi menggunakan QR Code. Aman, cepat, dan profesional.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link 
              href="/register" 
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 transform hover:-translate-y-1"
            >
              DAFTAR SEKARANG
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a 
              href="#verify"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-4 px-8 rounded-full shadow-md hover:shadow-lg border border-slate-200 dark:border-slate-700 transition-all duration-200 transform hover:-translate-y-1"
            >
              Verifikasi Sertifikat
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">Cara Kerja Sistem</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Proses mudah dari pendaftaran hingga verifikasi sertifikat.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: CheckCircle2, title: 'Daftar', desc: 'Buat akun dengan nama lengkap Anda.', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
              { icon: Download, title: 'Generate', desc: 'Klik tombol untuk membuat sertifikat Anda.', color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
              { icon: Download, title: 'Download', desc: 'Unduh sertifikat dalam format PDF resolusi tinggi.', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
              { icon: ShieldCheck, title: 'Verifikasi', desc: 'Scan QR Code untuk membuktikan keaslian.', color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' }
            ].map((step, i) => (
              <div key={i} className="glass-panel rounded-3xl p-8 hover:-translate-y-2 transition-all duration-300 group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${step.bg} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className={`w-7 h-7 ${step.color}`} />
                </div>
                <div className="text-3xl font-black text-slate-200 dark:text-slate-800 mb-2">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verification */}
      <section id="verify" className="py-24 px-4 relative z-10 flex-1 flex items-center justify-center">
        <div className="w-full max-w-xl mx-auto animate-float">
          <div className="glass-panel rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
            
            <div className="text-center space-y-4 mb-10">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Verifikasi Sertifikat</h2>
              <p className="text-slate-600 dark:text-slate-400">Masukkan ID Sertifikat Anda di bawah ini</p>
            </div>
            
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="relative">
                <label htmlFor="certId" className="sr-only">Certificate ID</label>
                <input 
                  id="certId"
                  type="text" 
                  placeholder="CERT-XXXXXXXXXX" 
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 focus:outline-none uppercase text-lg font-medium tracking-wide transition-all placeholder:normal-case placeholder:text-slate-400"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                VERIFIKASI SEKARANG
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
