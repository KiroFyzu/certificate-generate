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
    if (certificate.status !== 'REVOKED') {
      return NextResponse.json({ error: 'Sertifikat ini tidak dalam status dicabut' }, { status: 400 })
    }

    const updated = await prisma.certificate.update({
      where: { id },
      data: {
        status: certificate.user_id ? 'ACTIVE' : 'PENDING',
        revoked_at: null,
        revoked_reason: null,
        revoked_by: null,
      },
    })

    await prisma.securityEvent.create({
      data: {
        user_id: auth.session.userId,
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        event_type: 'REINSTATE_CERTIFICATE',
        metadata: JSON.stringify({ certificate_id: certificate.certificate_id }),
      },
    })

    return NextResponse.json({ success: true, certificate: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
