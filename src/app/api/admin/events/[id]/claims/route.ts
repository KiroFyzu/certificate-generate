import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { generateCertificateId, generateClaimCode } from '@/lib/certificate-id'

const MAX_COUNT = 100

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { id: eventId } = await params
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const note: string | null = body.note || null
    const count: number = Math.max(1, Math.min(MAX_COUNT, Number(body.count) || 1))

    const created = []
    for (let i = 0; i < count; i++) {
      const certificate = await prisma.certificate.create({
        data: {
          event_id: eventId,
          certificate_id: generateCertificateId(),
          claim_code: generateClaimCode(),
          status: 'PENDING',
          note,
        },
      })
      created.push(certificate)
    }

    await prisma.securityEvent.create({
      data: {
        user_id: auth.session.userId,
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        event_type: 'CREATE_CLAIM_CODES',
        metadata: JSON.stringify({ event_id: eventId, count }),
      },
    })

    return NextResponse.json({ success: true, certificates: created })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
