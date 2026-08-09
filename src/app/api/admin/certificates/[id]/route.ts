import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const certificate = await prisma.certificate.findUnique({ where: { id } })
    if (!certificate) {
      return NextResponse.json({ error: 'Sertifikat tidak ditemukan' }, { status: 404 })
    }

    await prisma.certificate.delete({ where: { id } })

    await prisma.securityEvent.create({
      data: {
        user_id: auth.session.userId,
        ip_address: request.headers.get('x-forwarded-for') || '127.0.0.1',
        event_type: 'DELETE_CERTIFICATE',
        metadata: JSON.stringify({
          certificate_id: certificate.certificate_id,
          event_id: certificate.event_id,
          had_owner: !!certificate.user_id,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
