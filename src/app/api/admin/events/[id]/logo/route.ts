import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { saveEventUpload, UploadValidationError } from '@/lib/event-uploads'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const event = await prisma.event.findUnique({ where: { id } })
    if (!event) {
      return NextResponse.json({ error: 'Event tidak ditemukan' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    const relativePath = await saveEventUpload({
      eventId: id,
      file,
      allowedExtensions: ['png', 'jpg', 'jpeg'],
      maxSizeBytes: 2 * 1024 * 1024,
      suffix: '-logo',
      previousPath: event.logo_path,
    })

    const updated = await prisma.event.update({
      where: { id },
      data: { logo_path: relativePath },
    })

    return NextResponse.json({ success: true, event: updated })
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
