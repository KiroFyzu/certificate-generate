import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const certificate = await prisma.certificate.findUnique({ where: { id } })
    if (!certificate) {
      return NextResponse.json({ error: 'Sertifikat tidak ditemukan' }, { status: 404 })
    }
    if (certificate.status === 'REVOKED') {
      return NextResponse.json({ error: 'Sertifikat ini sudah dicabut sebelumnya' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const reason: string | null = body.reason || null

    const updated = await prisma.certificate.update({
      where: { id },
      data: {
        status: 'REVOKED',
        revoked_at: new Date(),
        revoked_reason: reason,
        revoked_by: auth.session.userId,
      },
    })

    await prisma.securityEvent.create({
      data: {
        user_id: auth.session.userId,
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        event_type: 'REVOKE_CERTIFICATE',
        metadata: JSON.stringify({ certificate_id: certificate.certificate_id, reason }),
      },
    })

    return NextResponse.json({ success: true, certificate: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
