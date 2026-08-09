import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const totalUsers = await prisma.user.count()
    const totalEvents = await prisma.event.count()
    const totalCertificates = await prisma.certificate.count()
    const verifiedCertificates = await prisma.certificate.count({ where: { status: 'ACTIVE' } })
    const revokedCertificates = await prisma.certificate.count({ where: { status: 'REVOKED' } })
    const activeClaimCodes = await prisma.claimCode.count({ where: { is_active: true } })
    const suspiciousActivities = await prisma.securityEvent.count()

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        totalCertificates,
        verifiedCertificates,
        revokedCertificates,
        activeClaimCodes,
        suspiciousActivities
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
