import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateCertificateId } from '@/lib/certificate-id'

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

    const claimCode = await prisma.claimCode.findUnique({ where: { code }, include: { event: true } })
    if (!claimCode || !claimCode.is_active || !claimCode.event.is_active) {
      return NextResponse.json({ error: 'Kode tidak valid atau sudah tidak berlaku' }, { status: 404 })
    }

    try {
      const claimed = await prisma.$transaction(async (tx) => {
        // Atomically reserve one use of the code: this UPDATE only affects a row
        // if used_count is still below max_uses, so concurrent claims can't
        // oversell the cap (each transaction serializes on this row).
        const reserved: number = await tx.$executeRaw`
          UPDATE "ClaimCode" SET used_count = used_count + 1
          WHERE id = ${claimCode.id} AND used_count < max_uses AND is_active = true
        `
        if (reserved === 0) {
          throw new ClaimExhaustedError()
        }

        return tx.certificate.create({
          data: {
            user_id: session.userId,
            event_id: claimCode.event_id,
            certificate_id: generateCertificateId(),
            status: 'ACTIVE',
            claim_code_id: claimCode.id,
            claimed_at: new Date(),
          },
          include: { event: true },
        })
      })

      await prisma.securityEvent.create({
        data: {
          user_id: session.userId,
          ip_address: ip,
          event_type: 'CLAIM_CERTIFICATE',
          metadata: JSON.stringify({ certificate_id: claimed.certificate_id, claim_code_id: claimCode.id }),
        },
      })

      return NextResponse.json({ success: true, certificate: claimed })
    } catch (e: any) {
      if (e instanceof ClaimExhaustedError) {
        return NextResponse.json({ error: 'Kode klaim sudah mencapai batas maksimal penggunaan' }, { status: 400 })
      }
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

class ClaimExhaustedError extends Error {}
