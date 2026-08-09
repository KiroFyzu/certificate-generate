import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ certificateId: string }> }) {
  try {
    const { certificateId } = await params

    if (!certificateId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 })
    }

    const certificate = await prisma.certificate.findUnique({
      where: { certificate_id: certificateId },
      include: {
        user: {
          select: { full_name: true }
        }
      }
    })

    if (!certificate) {
      return NextResponse.json({ error: 'Sertifikat tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.certificate_id,
        status: certificate.status,
        issued_at: certificate.issued_at,
        user: {
          full_name: certificate.user.full_name
        }
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
