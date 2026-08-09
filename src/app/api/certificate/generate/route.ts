import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

function generateCertId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'CERT-'
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const isAllowed = await checkRateLimit(ip, 'generate', 3, 15 * 60 * 1000)
    
    if (!isAllowed) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' }, { status: 429 })
    }

    const sessionCookie = request.headers.get('cookie')?.split('session=')[1]?.split(';')[0]
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await decrypt(sessionCookie)
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Generate random cert ID
    const certId = generateCertId()

    try {
      // Transaction to ensure atomicity. Prisma handles SQLite locking.
      const certificate = await prisma.certificate.create({
        data: {
          user_id: user.id,
          certificate_id: certId,
          generation_ip: ip,
        }
      })

      // Log Security Event
      await prisma.securityEvent.create({
        data: {
          user_id: user.id,
          ip_address: ip,
          event_type: 'GENERATE_CERTIFICATE',
          metadata: JSON.stringify({ certificate_id: certId })
        }
      })

      return NextResponse.json({ success: true, certificate })

    } catch (e: any) {
      if (e.code === 'P2002') {
        // Unique constraint failed on user_id or certificate_id
        // Usually user_id because one user = one certificate
        return NextResponse.json({ 
          error: 'Anda sudah memiliki sertifikat. Setiap peserta hanya dapat memperoleh 1 sertifikat.' 
        }, { status: 400 })
      }
      throw e
    }

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
