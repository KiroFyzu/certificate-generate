import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateCertificatePdf } from '@/lib/certificate-pdf'

export async function GET(request: Request, { params }: { params: Promise<{ certificateId: string }> }) {
  try {
    const session = await getSession(request)
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { certificateId } = await params
    const certificate = await prisma.certificate.findUnique({
      where: { certificate_id: certificateId },
      include: { user: true, event: true },
    })

    if (!certificate || !certificate.user) {
      return NextResponse.json({ error: 'Sertifikat tidak ditemukan' }, { status: 404 })
    }

    const isOwner = certificate.user_id === session.userId
    if (!isOwner && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (certificate.status === 'REVOKED') {
      return NextResponse.json({ error: 'Sertifikat ini telah dicabut dan tidak dapat diunduh' }, { status: 403 })
    }

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const verifyUrl = `${protocol}://${host}/verify/${certificate.certificate_id}`

    let pdfBuffer: Buffer
    try {
      pdfBuffer = await generateCertificatePdf({
        certificate,
        user: certificate.user,
        event: certificate.event,
        verifyUrl,
      })
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: 'Gagal membuat file sertifikat' }, { status: 500 })
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Certificate-${certificate.certificate_id}.pdf"`,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
