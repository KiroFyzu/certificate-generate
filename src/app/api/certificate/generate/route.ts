import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateCertificateId } from '@/lib/certificate-id'

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const isAllowed = await checkRateLimit(ip, 'generate', 3, 15 * 60 * 1000)

    if (!isAllowed) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' }, { status: 429 })
    }

    const session = await getSession(request)
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const eventId: string | undefined = body.event_id
    if (!eventId) {
      return NextResponse.json({ error: 'event_id wajib diisi' }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event || !event.is_active) {
      return NextResponse.json({ error: 'Event tidak ditemukan atau tidak aktif' }, { status: 404 })
    }
    if (event.issuance_mode !== 'OPEN') {
      return NextResponse.json({
        error: 'Sertifikat untuk event ini hanya bisa didapat lewat kode klaim atau diterbitkan admin.',
      }, { status: 403 })
    }

    const certId = generateCertificateId()

    try {
      const certificate = await prisma.certificate.create({
        data: {
          user_id: user.id,
          event_id: eventId,
          certificate_id: certId,
          generation_ip: ip,
        }
      })

      await prisma.securityEvent.create({
        data: {
          user_id: user.id,
          ip_address: ip,
          event_type: 'GENERATE_CERTIFICATE',
          metadata: JSON.stringify({ certificate_id: certId, event_id: eventId })
        }
      })

      return NextResponse.json({ success: true, certificate })

    } catch (e: any) {
      if (e.code === 'P2002') {
        return NextResponse.json({
          error: 'Anda sudah memiliki sertifikat untuk event ini.'
        }, { status: 400 })
      }
      throw e
    }

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
