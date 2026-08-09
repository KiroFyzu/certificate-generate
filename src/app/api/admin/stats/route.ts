import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const sessionCookie = request.headers.get('cookie')?.split('session=')[1]?.split(';')[0]
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await decrypt(sessionCookie)
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const totalUsers = await prisma.user.count()
    const totalCertificates = await prisma.certificate.count()
    const verifiedCertificates = await prisma.certificate.count({ where: { status: 'ACTIVE' } })
    const revokedCertificates = await prisma.certificate.count({ where: { status: 'REVOKED' } })
    const suspiciousActivities = await prisma.securityEvent.count()

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalCertificates,
        verifiedCertificates,
        revokedCertificates,
        suspiciousActivities
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
