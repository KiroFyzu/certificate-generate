import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { generateClaimCode } from '@/lib/certificate-id'

const MAX_USES_CAP = 10000

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { id: eventId } = await params
    const claimCodes = await prisma.claimCode.findMany({
      where: { event_id: eventId },
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json({ success: true, claimCodes })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

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
    const maxUses = Math.max(1, Math.min(MAX_USES_CAP, Number(body.max_uses) || 1))

    const claimCode = await prisma.claimCode.create({
      data: {
        event_id: eventId,
        code: generateClaimCode(),
        max_uses: maxUses,
        note,
        created_by: auth.session.userId,
      },
    })

    await prisma.securityEvent.create({
      data: {
        user_id: auth.session.userId,
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        event_type: 'CREATE_CLAIM_CODE',
        metadata: JSON.stringify({ event_id: eventId, max_uses: maxUses }),
      },
    })

    return NextResponse.json({ success: true, claimCode })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
