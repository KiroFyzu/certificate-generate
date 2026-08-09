import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const events = await prisma.event.findMany({
      orderBy: { created_at: 'desc' },
      include: { _count: { select: { certificates: true } } },
    })
    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const body = await request.json()
    const {
      name,
      description,
      event_date,
      organizer_name,
      signer_name,
      signer_title,
      certificate_title,
      completion_text,
      issuance_mode,
      logo_position,
    } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Nama event wajib diisi' }, { status: 400 })
    }

    if (issuance_mode && !['OPEN', 'CLAIM'].includes(issuance_mode)) {
      return NextResponse.json({ error: 'Mode penerbitan tidak valid' }, { status: 400 })
    }

    if (logo_position && !['top-left', 'top-center', 'top-right'].includes(logo_position)) {
      return NextResponse.json({ error: 'Posisi logo tidak valid' }, { status: 400 })
    }

    const event = await prisma.event.create({
      data: {
        name: name.trim(),
        description: description || null,
        event_date: event_date ? new Date(event_date) : null,
        organizer_name: organizer_name || null,
        signer_name: signer_name || null,
        signer_title: signer_title || null,
        certificate_title: certificate_title || undefined,
        completion_text: completion_text || undefined,
        issuance_mode: issuance_mode || 'OPEN',
        logo_position: logo_position || undefined,
        created_by: auth.session.userId,
      },
    })

    return NextResponse.json({ success: true, event })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
