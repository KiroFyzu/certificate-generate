import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

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

    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ error: 'Format file harus PDF, PNG, atau JPG' }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 })
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'events')
    fs.mkdirSync(uploadsDir, { recursive: true })

    // Clean up a previous upload with a different extension, if any.
    if (event.template_path) {
      try {
        fs.unlinkSync(path.join(process.cwd(), 'public', event.template_path))
      } catch {
        // ignore if it doesn't exist
      }
    }

    const relativePath = `uploads/events/${id}.${extension}`
    const bytes = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(path.join(process.cwd(), 'public', relativePath), bytes)

    const updated = await prisma.event.update({
      where: { id },
      data: { template_path: relativePath },
    })

    return NextResponse.json({ success: true, event: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
