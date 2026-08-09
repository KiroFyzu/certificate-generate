import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const isAllowed = await checkRateLimit(ip, 'claim', 10, 15 * 60 * 1000)
    if (!isAllowed) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' }, { status: 429 })
    }

    const session = await getSession(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const code: string = (body.code || '').trim().toUpperCase()
    if (!code) {
      return NextResponse.json({ error: 'Kode klaim wajib diisi' }, { status: 400 })
    }

    const certificate = await prisma.certificate.findUnique({
      where: { claim_code: code },
      include: { event: true },
    })

    if (!certificate || certificate.status !== 'PENDING') {
      return NextResponse.json({ error: 'Kode tidak valid atau sudah digunakan' }, { status: 404 })
    }

    try {
      const claimed = await prisma.certificate.update({
        where: { id: certificate.id },
        data: {
          user_id: session.userId,
          status: 'ACTIVE',
          claimed_at: new Date(),
        },
        include: { event: true },
      })

      await prisma.securityEvent.create({
        data: {
          user_id: session.userId,
          ip_address: ip,
          event_type: 'CLAIM_CERTIFICATE',
          metadata: JSON.stringify({ certificate_id: claimed.certificate_id }),
        },
      })

      return NextResponse.json({ success: true, certificate: claimed })
    } catch (e: any) {
      if (e.code === 'P2002') {
        return NextResponse.json({ error: 'Anda sudah memiliki sertifikat untuk event ini' }, { status: 400 })
      }
      throw e
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
