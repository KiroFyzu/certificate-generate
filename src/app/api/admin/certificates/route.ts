import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    const status = searchParams.get('status')
    const q = searchParams.get('q')?.trim()

    const where: Record<string, unknown> = {}
    if (eventId) where.event_id = eventId
    if (status) where.status = status
    if (q) {
      where.OR = [
        { certificate_id: { contains: q } },
        { claim_code: { contains: q } },
        { user: { full_name: { contains: q } } },
        { user: { email: { contains: q } } },
      ]
    }

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        event: { select: { id: true, name: true } },
        user: { select: { id: true, full_name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 500,
    })

    return NextResponse.json({ success: true, certificates })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
