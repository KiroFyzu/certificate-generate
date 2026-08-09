import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { certificates: true } } },
    })
    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

const EDITABLE_FIELDS = [
  'name',
  'description',
  'organizer_name',
  'signer_name',
  'signer_title',
  'certificate_title',
  'completion_text',
  'issuance_mode',
  'is_active',
] as const

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const body = await request.json()

    if (body.issuance_mode && !['OPEN', 'CLAIM'].includes(body.issuance_mode)) {
      return NextResponse.json({ error: 'Mode penerbitan tidak valid' }, { status: 400 })
    }
    if (typeof body.name === 'string' && !body.name.trim()) {
      return NextResponse.json({ error: 'Nama event tidak boleh kosong' }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    for (const field of EDITABLE_FIELDS) {
      if (field in body) data[field] = body[field]
    }
    if ('event_date' in body) {
      data.event_date = body.event_date ? new Date(body.event_date) : null
    }

    const event = await prisma.event.update({ where: { id }, data })
    return NextResponse.json({ success: true, event })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
