import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { requireAdmin } from '@/lib/auth'
import { generateCertificatePdf } from '@/lib/certificate-pdf'
import { saveEventUpload, UploadValidationError } from '@/lib/event-uploads'

/**
 * Renders a one-off certificate PDF from whatever the admin currently has typed/
 * picked in the event form — including files not saved yet — using placeholder
 * name/ID data. Nothing here touches the database or persists any file.
 */
export async function POST(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  const previewId = `_preview-${crypto.randomUUID()}`
  const tempFiles: string[] = []

  try {
    const formData = await request.formData()
    const str = (key: string) => {
      const v = formData.get(key)
      return typeof v === 'string' && v.trim() ? v : null
    }

    const logoPosition = str('logo_position') || 'top-center'
    if (!['top-left', 'top-center', 'top-right'].includes(logoPosition)) {
      return NextResponse.json({ error: 'Posisi logo tidak valid' }, { status: 400 })
    }

    let templatePath = str('template_path')
    const templateFile = formData.get('template')
    if (templateFile instanceof File && templateFile.size > 0) {
      templatePath = await saveEventUpload({
        eventId: previewId,
        file: templateFile,
        allowedExtensions: ['pdf', 'png', 'jpg', 'jpeg'],
        maxSizeBytes: 5 * 1024 * 1024,
      })
      tempFiles.push(templatePath)
    }

    let logoPath = str('logo_path')
    const logoFile = formData.get('logo')
    if (logoFile instanceof File && logoFile.size > 0) {
      logoPath = await saveEventUpload({
        eventId: previewId,
        file: logoFile,
        allowedExtensions: ['png', 'jpg', 'jpeg'],
        maxSizeBytes: 2 * 1024 * 1024,
        suffix: '-logo',
      })
      tempFiles.push(logoPath)
    }

    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'

    const pdfBuffer = await generateCertificatePdf({
      certificate: { certificate_id: 'CERT-PREVIEW01', issued_at: new Date() },
      user: { full_name: 'Nama Peserta Contoh' },
      event: {
        name: str('name') || 'Nama Event Contoh',
        event_date: null,
        certificate_title: str('certificate_title') || 'CERTIFICATE OF APPRECIATION',
        completion_text: str('completion_text') || 'for outstanding participation and successfully completing',
        signer_name: str('signer_name'),
        signer_title: str('signer_title'),
        template_path: templatePath,
        logo_path: logoPath,
        logo_position: logoPosition,
      },
      verifyUrl: `${protocol}://${host}/verify/CERT-PREVIEW01`,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="preview.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Gagal membuat preview' }, { status: 500 })
  } finally {
    for (const relativePath of tempFiles) {
      try {
        fs.unlinkSync(path.join(process.cwd(), 'public', relativePath))
      } catch {
        // ignore
      }
    }
  }
}
