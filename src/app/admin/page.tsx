'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, FileText, ShieldAlert, CheckCircle, XCircle, Search, Calendar as CalendarIcon,
  Plus, Upload, KeyRound, Pencil, Ban, RotateCcw, Copy, X, Trash2,
} from 'lucide-react'

type Tab = 'overview' | 'users' | 'events' | 'certificates'

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<any>(null)
  const [usersList, setUsersList] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(true)

  const [certFilters, setCertFilters] = useState<{ event_id: string; status: string; q: string }>({ event_id: '', status: '', q: '' })

  const [showCreateEvent, setShowCreateEvent] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [importingEvent, setImportingEvent] = useState<any>(null)
  const [claimingEvent, setClaimingEvent] = useState<any>(null)

  const fetchOverview = useCallback(async () => {
    const [statsRes, usersRes, eventsRes] = await Promise.all([
      fetch('/api/admin/stats'),
      fetch('/api/admin/users'),
      fetch('/api/admin/events'),
    ])
    if (!statsRes.ok || !usersRes.ok || !eventsRes.ok) throw new Error('Unauthorized')
    const statsData = await statsRes.json()
    const usersData = await usersRes.json()
    const eventsData = await eventsRes.json()
    if (statsData.stats) setStats(statsData.stats)
    if (usersData.users) setUsersList(usersData.users)
    if (eventsData.events) setEvents(eventsData.events)
  }, [])

  const fetchCertificates = useCallback(async (filters = certFilters) => {
    const params = new URLSearchParams()
    if (filters.event_id) params.set('event_id', filters.event_id)
    if (filters.status) params.set('status', filters.status)
    if (filters.q) params.set('q', filters.q)
    const res = await fetch(`/api/admin/certificates?${params.toString()}`)
    if (res.ok) {
      const data = await res.json()
      if (data.certificates) setCertificates(data.certificates)
    }
  }, [certFilters])

  useEffect(() => {
    (async () => {
      try {
        await fetchOverview()
        await fetchCertificates({ event_id: '', status: '', q: '' })
      } catch {
        setAuthorized(false)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Memuat Panel Admin...</p>
      </div>
    )
  }

  if (!authorized || !stats) return null

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Total Events', value: stats.totalEvents, icon: CalendarIcon, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { label: 'Total Certificates', value: stats.totalCertificates, icon: FileText, color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    { label: 'Active', value: stats.verifiedCertificates, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Revoked', value: stats.revokedCertificates, icon: XCircle, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
    { label: 'Kode Klaim Aktif', value: stats.activeClaimCodes, icon: KeyRound, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { label: 'Suspicious', value: stats.suspiciousActivities, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  ]

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'users', label: 'Users' },
    { key: 'events', label: 'Events' },
    { key: 'certificates', label: 'Sertifikat' },
  ]

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 mt-4 animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Dashboard</h1>
      </div>

      <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              tab === t.key
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {statCards.map((stat, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 hover:-translate-y-1 transition-all">
              <div className={`p-3 w-12 h-12 rounded-xl ${stat.bg} ${stat.color} mb-4 flex items-center justify-center`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <UsersTable
          users={usersList}
          onViewCertificates={(email) => {
            setCertFilters({ event_id: '', status: '', q: email })
            fetchCertificates({ event_id: '', status: '', q: email })
            setTab('certificates')
          }}
        />
      )}

      {tab === 'events' && (
        <EventsTable
          events={events}
          onCreateClick={() => setShowCreateEvent(true)}
          onEditClick={setEditingEvent}
          onImportClick={setImportingEvent}
          onClaimClick={setClaimingEvent}
          onRefresh={fetchOverview}
        />
      )}

      {tab === 'certificates' && (
        <CertificatesTable
          certificates={certificates}
          events={events}
          filters={certFilters}
          onFiltersChange={(f: { event_id: string; status: string; q: string }) => { setCertFilters(f); fetchCertificates(f) }}
          onRefresh={() => { fetchCertificates(); fetchOverview() }}
        />
      )}

      {showCreateEvent && (
        <EventFormModal
          onClose={() => setShowCreateEvent(false)}
          onSaved={async () => { setShowCreateEvent(false); await fetchOverview() }}
        />
      )}
      {editingEvent && (
        <EventFormModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSaved={async () => { setEditingEvent(null); await fetchOverview() }}
        />
      )}
      {importingEvent && (
        <BulkImportModal
          event={importingEvent}
          onClose={() => setImportingEvent(null)}
          onDone={async () => { await fetchOverview(); await fetchCertificates() }}
        />
      )}
      {claimingEvent && (
        <ClaimCodesModal
          event={claimingEvent}
          onClose={() => setClaimingEvent(null)}
          onDone={async () => { await fetchOverview(); await fetchCertificates() }}
        />
      )}
    </div>
  )
}

function UsersTable({ users, onViewCertificates }: { users: any[]; onViewCertificates: (email: string) => void }) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Daftar Pengguna</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola semua pengguna terdaftar.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Nama Lengkap</th>
              <th className="px-6 py-4 font-semibold">Email</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Jumlah Sertifikat</th>
              <th className="px-6 py-4 font-semibold">Tanggal Daftar</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{u.full_name}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{u._count?.certificates ?? 0}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                    {new Date(u.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onViewCertificates(u.email)}
                      className="text-purple-600 hover:text-purple-800 text-xs font-semibold hover:underline"
                    >
                      Lihat Sertifikat
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                  Belum ada data pengguna.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EventsTable({ events, onCreateClick, onEditClick, onImportClick, onClaimClick, onRefresh }: any) {
  const toggleActive = async (ev: any) => {
    await fetch(`/api/admin/events/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !ev.is_active }),
    })
    onRefresh()
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Events</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola event & template sertifikatnya.</p>
        </div>
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Buat Event
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Nama Event</th>
              <th className="px-6 py-4 font-semibold">Mode</th>
              <th className="px-6 py-4 font-semibold">Aktif</th>
              <th className="px-6 py-4 font-semibold">Sertifikat</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {events.length > 0 ? (
              events.map((ev: any) => (
                <tr key={ev.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{ev.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ev.issuance_mode === 'OPEN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {ev.issuance_mode === 'OPEN' ? 'Terbuka' : 'Klaim'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(ev)}
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${ev.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
                    >
                      {ev.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{ev._count?.certificates ?? 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3 text-xs font-semibold">
                      <button onClick={() => onEditClick(ev)} className="text-slate-500 hover:text-purple-600 flex items-center gap-1">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => onImportClick(ev)} className="text-slate-500 hover:text-blue-600 flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" /> Import CSV
                      </button>
                      <button onClick={() => onClaimClick(ev)} className="text-slate-500 hover:text-amber-600 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5" /> Kode Klaim
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                  Belum ada event. Buat satu untuk mulai menerbitkan sertifikat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CertificatesTable({ certificates, events, filters, onFiltersChange, onRefresh }: any) {
  const [busyId, setBusyId] = useState<string | null>(null)

  const revoke = async (cert: any) => {
    const reason = window.prompt('Alasan revoke (opsional):') || undefined
    setBusyId(cert.id)
    try {
      await fetch(`/api/admin/certificates/${cert.id}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      onRefresh()
    } finally {
      setBusyId(null)
    }
  }

  const reinstate = async (cert: any) => {
    setBusyId(cert.id)
    try {
      await fetch(`/api/admin/certificates/${cert.id}/reinstate`, { method: 'POST' })
      onRefresh()
    } finally {
      setBusyId(null)
    }
  }

  const deleteCert = async (cert: any) => {
    const label = cert.user ? `${cert.user.full_name} (${cert.event.name})` : cert.certificate_id
    if (!window.confirm(`Hapus permanen sertifikat untuk ${label}? Ini tidak bisa dibatalkan. Kalau cuma mau menonaktifkan sementara, pakai Revoke saja.`)) return
    setBusyId(cert.id)
    try {
      await fetch(`/api/admin/certificates/${cert.id}`, { method: 'DELETE' })
      onRefresh()
    } finally {
      setBusyId(null)
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      REVOKED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    }
    const label: Record<string, string> = { ACTIVE: 'Aktif', REVOKED: 'Dicabut' }
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || ''}`}>{label[status] || status}</span>
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.q}
            onChange={(e) => onFiltersChange({ ...filters, q: e.target.value })}
            placeholder="Cari nama, email, atau ID sertifikat..."
            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm w-full"
          />
        </div>
        <select
          value={filters.event_id}
          onChange={(e) => onFiltersChange({ ...filters, event_id: e.target.value })}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
        >
          <option value="">Semua Event</option>
          {events.map((ev: any) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
          className="px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
        >
          <option value="">Semua Status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="REVOKED">Dicabut</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Pemilik</th>
              <th className="px-6 py-4 font-semibold">Event</th>
              <th className="px-6 py-4 font-semibold">ID Sertifikat</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {certificates.length > 0 ? (
              certificates.map((cert: any) => (
                <tr key={cert.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    {cert.user ? (
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{cert.user.full_name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{cert.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{cert.event.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {cert.certificate_id}
                    {cert.claim_code && (
                      <span className="block text-purple-600 dark:text-purple-400 font-semibold mt-0.5">via {cert.claim_code.code}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">{statusBadge(cert.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {cert.status === 'REVOKED' ? (
                        <button
                          onClick={() => reinstate(cert)}
                          disabled={busyId === cert.id}
                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 text-xs font-semibold disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Aktifkan Lagi
                        </button>
                      ) : (
                        <button
                          onClick={() => revoke(cert)}
                          disabled={busyId === cert.id}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-xs font-semibold disabled:opacity-50"
                        >
                          <Ban className="w-3.5 h-3.5" /> Revoke
                        </button>
                      )}
                      <button
                        onClick={() => deleteCert(cert)}
                        disabled={busyId === cert.id}
                        className="inline-flex items-center gap-1 text-slate-400 hover:text-red-700 text-xs font-semibold disabled:opacity-50"
                        title="Hapus permanen"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-500 dark:text-slate-400">
                  Tidak ada sertifikat yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ModalShell({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function EventFormModal({ event, onClose, onSaved }: { event?: any; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!event
  const [form, setForm] = useState({
    name: event?.name || '',
    description: event?.description || '',
    event_date: event?.event_date ? event.event_date.slice(0, 10) : '',
    organizer_name: event?.organizer_name || '',
    signer_name: event?.signer_name || '',
    signer_title: event?.signer_title || '',
    certificate_title: event?.certificate_title || 'CERTIFICATE OF APPRECIATION',
    completion_text: event?.completion_text || 'for outstanding participation and successfully completing',
    issuance_mode: event?.issuance_mode || 'OPEN',
    logo_position: event?.logo_position || 'top-center',
  })
  const [templateFile, setTemplateFile] = useState<File | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [previewError, setPreviewError] = useState('')

  useEffect(() => {
    // Revoke the blob URL when it changes or the modal unmounts, so we don't leak memory.
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const buildPreviewFormData = () => {
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('certificate_title', form.certificate_title)
    fd.append('completion_text', form.completion_text)
    fd.append('signer_name', form.signer_name)
    fd.append('signer_title', form.signer_title)
    fd.append('logo_position', form.logo_position)
    if (templateFile) fd.append('template', templateFile)
    else if (event?.template_path) fd.append('template_path', event.template_path)
    if (logoFile) fd.append('logo', logoFile)
    else if (event?.logo_path) fd.append('logo_path', event.logo_path)
    return fd
  }

  const handlePreview = async () => {
    setPreviewing(true)
    setPreviewError('')
    try {
      const res = await fetch('/api/admin/events/preview', { method: 'POST', body: buildPreviewFormData() })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal membuat preview')
      }
      const blob = await res.blob()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(blob))
    } catch (err: any) {
      setPreviewError(err.message)
    } finally {
      setPreviewing(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const url = isEdit ? `/api/admin/events/${event.id}` : '/api/admin/events'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan event')

      const eventId = data.event.id
      if (templateFile) {
        const fd = new FormData()
        fd.append('file', templateFile)
        const uploadRes = await fetch(`/api/admin/events/${eventId}/template`, { method: 'POST', body: fd })
        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json()
          throw new Error(uploadData.error || 'Event tersimpan, tapi upload template gagal')
        }
      }
      if (logoFile) {
        const fd = new FormData()
        fd.append('file', logoFile)
        const uploadRes = await fetch(`/api/admin/events/${eventId}/logo`, { method: 'POST', body: fd })
        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json()
          throw new Error(uploadData.error || 'Event tersimpan, tapi upload logo gagal')
        }
      }

      onSaved()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isEdit ? 'Edit Event' : 'Buat Event'} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Event</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deskripsi</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tanggal Event</label>
            <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mode Penerbitan</label>
            <select value={form.issuance_mode} onChange={(e) => setForm({ ...form, issuance_mode: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="OPEN">Terbuka (generate sendiri)</option>
              <option value="CLAIM">Klaim / diterbitkan admin</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Penyelenggara</label>
            <input value={form.organizer_name} onChange={(e) => setForm({ ...form, organizer_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Penandatangan</label>
            <input value={form.signer_name} onChange={(e) => setForm({ ...form, signer_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jabatan Penandatangan</label>
          <input value={form.signer_title} onChange={(e) => setForm({ ...form, signer_title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Judul Sertifikat</label>
          <input value={form.certificate_title} onChange={(e) => setForm({ ...form, certificate_title: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teks Kelulusan</label>
          <input value={form.completion_text} onChange={(e) => setForm({ ...form, completion_text: e.target.value })}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Background Sertifikat (opsional, PDF/PNG/JPG, maks 5MB)
          </label>
          <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-600 dark:text-slate-300" />
          {event?.template_path && !templateFile && (
            <p className="text-xs text-slate-400 mt-1">Sudah ada background tersimpan. Upload file baru untuk menggantinya.</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Logo (opsional, PNG/JPG, maks 2MB)
            </label>
            <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-slate-600 dark:text-slate-300" />
            {event?.logo_path && !logoFile && (
              <p className="text-xs text-slate-400 mt-1">Sudah ada logo tersimpan. Upload file baru untuk menggantinya.</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Posisi Logo</label>
            <select value={form.logo_position} onChange={(e) => setForm({ ...form, logo_position: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
              <option value="top-left">Kiri atas</option>
              <option value="top-center">Tengah atas</option>
              <option value="top-right">Kanan atas</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Preview Sertifikat</p>
            <button type="button" onClick={handlePreview} disabled={previewing || !form.name}
              className="text-xs font-semibold text-purple-600 hover:text-purple-800 disabled:opacity-50">
              {previewing ? 'Membuat preview...' : previewUrl ? 'Perbarui Preview' : 'Lihat Preview'}
            </button>
          </div>
          {previewError && <p className="text-xs text-red-600 dark:text-red-400 mb-2">{previewError}</p>}
          {previewUrl ? (
            <iframe src={previewUrl} className="w-full h-[420px] rounded-lg border border-slate-200 dark:border-slate-700" title="Preview sertifikat" />
          ) : (
            <p className="text-xs text-slate-400">Isi nama event dulu, lalu klik "Lihat Preview" untuk melihat tampilan sertifikatnya (pakai nama contoh) sebelum disimpan.</p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300">Batal</button>
          <button type="submit" disabled={saving} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

function BulkImportModal({ event, onClose, onDone }: { event: any; onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  const submit = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/admin/events/${event.id}/bulk-import`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal import CSV')
      setResult(data)
      onDone()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <ModalShell title={`Import CSV — ${event.name}`} onClose={onClose} wide>
      {!result ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            CSV dengan kolom <code>full_name</code> (atau <code>nama</code>) dan <code>email</code>. Akun baru dibuat otomatis
            dengan password acak — password itu hanya ditampilkan sekali di hasil import, sebarkan manual ke pesertanya.
          </p>
          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>}
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-slate-600 dark:text-slate-300" />
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300">Batal</button>
            <button onClick={submit} disabled={!file || uploading} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              {uploading ? 'Mengunggah...' : 'Import'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 font-semibold">{result.summary.created} dibuat</span>
            <span className="text-amber-600 font-semibold">{result.summary.skipped} dilewati</span>
            <span className="text-red-600 font-semibold">{result.summary.errors} error</span>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0">
                <tr>
                  <th className="px-3 py-2">Baris</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Pesan</th>
                  <th className="px-3 py-2">Password Sementara</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {result.results.map((r: any) => (
                  <tr key={r.row}>
                    <td className="px-3 py-2">{r.row}</td>
                    <td className="px-3 py-2">{r.email}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">{r.message}</td>
                    <td className="px-3 py-2 font-mono">{r.tempPassword || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <button onClick={onClose} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-sm font-semibold rounded-lg">Selesai</button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

function ClaimCodesModal({ event, onClose, onDone }: { event: any; onClose: () => void; onDone: () => void }) {
  const [codes, setCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [maxUses, setMaxUses] = useState(10)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const fetchCodes = async () => {
    const res = await fetch(`/api/admin/events/${event.id}/claims`)
    if (res.ok) {
      const data = await res.json()
      setCodes(data.claimCodes || [])
    }
  }

  useEffect(() => {
    fetchCodes().finally(() => setLoading(false))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/events/${event.id}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note || undefined, max_uses: maxUses }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal membuat kode klaim')
      setNote('')
      await fetchCodes()
      onDone()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const copyCode = (code: any) => {
    navigator.clipboard.writeText(code.code)
    setCopiedId(code.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleActive = async (code: any) => {
    setBusyId(code.id)
    try {
      await fetch(`/api/admin/claim-codes/${code.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !code.is_active }),
      })
      await fetchCodes()
      onDone()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <ModalShell title={`Kode Klaim — ${event.name}`} onClose={onClose} wide>
      <div className="space-y-6">
        <form onSubmit={submit} className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          {error && <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Maksimal Klaim (jumlah user)</label>
              <input type="number" min={1} max={10000} value={maxUses} onChange={(e) => setMaxUses(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
              <p className="text-xs text-slate-400 mt-1">1 kode ini bisa dipakai sampai {maxUses} user berbeda.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Catatan (opsional)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. dibagikan di grup WhatsApp panitia"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={creating} className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50">
              {creating ? 'Membuat...' : 'Buat Kode Baru'}
            </button>
          </div>
        </form>

        <div>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Kode yang sudah dibuat</p>
          {loading ? (
            <p className="text-sm text-slate-400">Memuat...</p>
          ) : codes.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada kode klaim untuk event ini.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-2">
              {codes.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-sm text-slate-900 dark:text-white">{c.code}</span>
                      {!c.is_active && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">Nonaktif</span>}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {c.used_count} / {c.max_uses} klaim terpakai{c.note ? ` — ${c.note}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button onClick={() => copyCode(c)} className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800">
                      <Copy className="w-3.5 h-3.5" /> {copiedId === c.id ? 'Tersalin!' : 'Salin'}
                    </button>
                    <button onClick={() => toggleActive(c)} disabled={busyId === c.id}
                      className="text-xs font-semibold text-slate-500 hover:text-red-600 disabled:opacity-50">
                      {c.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-sm font-semibold rounded-lg">Selesai</button>
        </div>
      </div>
    </ModalShell>
  )
}
