import { NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { parse } from 'csv-parse/sync'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { generateCertificateId } from '@/lib/certificate-id'

const MAX_ROWS = 500
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function pick(record: Record<string, string>, keys: string[]): string | undefined {
  const lowerEntries = Object.entries(record).map(([k, v]) => [k.trim().toLowerCase(), v] as const)
  for (const key of keys) {
    const found = lowerEntries.find(([k]) => k === key)
    if (found && found[1]?.trim()) return found[1].trim()
  }
  return undefined
}

interface RowResult {
  row: number
  email: string
  full_name?: string
  status: 'created' | 'skipped' | 'error'
  message: string
  certificate_id?: string
  tempPassword?: string
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { id: eventId } = await params
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File CSV tidak ditemukan' }, { status: 400 })
    }

    const text = await file.text()
    let records: Record<string, string>[]
    try {
      records = parse(text, { columns: true, skip_empty_lines: true, trim: true })
    } catch {
      return NextResponse.json({ error: 'Gagal membaca file CSV. Pastikan formatnya benar.' }, { status: 400 })
    }

    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV kosong atau tidak punya baris data.' }, { status: 400 })
    }
    if (records.length > MAX_ROWS) {
      return NextResponse.json({ error: `Maksimal ${MAX_ROWS} baris per import.` }, { status: 400 })
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const results: RowResult[] = []

    for (let i = 0; i < records.length; i++) {
      const rowNum = i + 2 // account for header row, 1-indexed
      const record = records[i]
      const fullName = pick(record, ['full_name', 'nama', 'name'])
      const email = pick(record, ['email', 'e-mail'])

      if (!email || !EMAIL_RE.test(email)) {
        results.push({ row: rowNum, email: email || '(kosong)', status: 'error', message: 'Email tidak valid atau kosong' })
        continue
      }
      if (!fullName) {
        results.push({ row: rowNum, email, status: 'error', message: 'Nama tidak boleh kosong' })
        continue
      }

      try {
        let user = await prisma.user.findUnique({ where: { email } })
        let tempPassword: string | undefined

        if (!user) {
          tempPassword = crypto.randomBytes(9).toString('base64url')
          const passwordHash = await bcrypt.hash(tempPassword, 10)
          user = await prisma.user.create({
            data: {
              full_name: fullName,
              email,
              password_hash: passwordHash,
              registration_ip: ip,
            },
          })
        }

        const certificateId = generateCertificateId()
        await prisma.certificate.create({
          data: {
            user_id: user.id,
            event_id: eventId,
            certificate_id: certificateId,
            status: 'ACTIVE',
            generation_ip: ip,
          },
        })

        results.push({
          row: rowNum,
          email,
          full_name: fullName,
          status: 'created',
          message: tempPassword ? 'Akun & sertifikat baru dibuat' : 'Sertifikat dibuat untuk akun yang sudah ada',
          certificate_id: certificateId,
          tempPassword,
        })
      } catch (e: any) {
        if (e.code === 'P2002') {
          results.push({ row: rowNum, email, full_name: fullName, status: 'skipped', message: 'User sudah punya sertifikat untuk event ini' })
        } else {
          console.error(e)
          results.push({ row: rowNum, email, full_name: fullName, status: 'error', message: 'Gagal memproses baris ini' })
        }
      }
    }

    const summary = {
      created: results.filter(r => r.status === 'created').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      errors: results.filter(r => r.status === 'error').length,
    }

    await prisma.securityEvent.create({
      data: {
        user_id: auth.session.userId,
        ip_address: ip,
        event_type: 'BULK_IMPORT_CERTIFICATES',
        metadata: JSON.stringify({ event_id: eventId, ...summary }),
      },
    })

    return NextResponse.json({ success: true, results, summary })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
