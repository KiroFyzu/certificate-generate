import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

// Default page size, taken from public/template.pdf (A4 landscape). Used whenever
// there's no PDF template to inherit a page size from (default design, or a custom
// image background).
const PAGE_WIDTH = 841.89
const PAGE_HEIGHT = 595.28

export interface CertificatePdfEvent {
  name: string
  event_date: Date | null
  certificate_title: string
  completion_text: string
  signer_name: string | null
  signer_title: string | null
  template_path: string | null
  logo_path: string | null
  logo_position: string
}

export interface CertificatePdfInput {
  certificate: { certificate_id: string; issued_at: Date }
  user: { full_name: string }
  event: CertificatePdfEvent
  verifyUrl: string
}

/**
 * Renders a certificate PDF for one (certificate, user, event) combination.
 * `event.template_path` (if set) points to an admin-uploaded background under
 * /public — a `.pdf` is used as the base document as-is, an image (.png/.jpg/.jpeg)
 * is drawn full-bleed. With no template_path, falls back to the original built-in
 * navy/gold design drawn on top of public/template.pdf.
 */
export async function generateCertificatePdf({ certificate, user, event, verifyUrl }: CertificatePdfInput): Promise<Buffer> {
  const templateKind = classifyTemplate(event.template_path)

  let pdfDoc: PDFDocument
  let firstPage: PDFPage

  if (templateKind === 'pdf') {
    const bytes = fs.readFileSync(path.join(process.cwd(), 'public', event.template_path as string))
    pdfDoc = await PDFDocument.load(bytes)
    firstPage = pdfDoc.getPages()[0]
  } else if (templateKind === 'image') {
    pdfDoc = await PDFDocument.create()
    firstPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  } else {
    const bytes = fs.readFileSync(path.join(process.cwd(), 'public', 'template.pdf'))
    pdfDoc = await PDFDocument.load(bytes)
    firstPage = pdfDoc.getPages()[0]
  }

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  const { width, height } = firstPage.getSize()

  // COLORS
  const navyBlue = rgb(30 / 255, 58 / 255, 138 / 255) // #1e3a8a
  const gold = rgb(212 / 255, 175 / 255, 55 / 255) // #d4af37
  const grayText = rgb(100 / 255, 116 / 255, 139 / 255) // #64748b

  if (templateKind === 'image') {
    const imageBytes = fs.readFileSync(path.join(process.cwd(), 'public', event.template_path as string))
    const isPng = (event.template_path as string).toLowerCase().endsWith('.png')
    const image = isPng ? await pdfDoc.embedPng(imageBytes) : await pdfDoc.embedJpg(imageBytes)
    firstPage.drawImage(image, { x: 0, y: 0, width, height })
  } else if (templateKind === 'default') {
    // DRAW BACKGROUND (Override template if it's plain)
    firstPage.drawRectangle({
      x: 0, y: 0,
      width, height,
      color: rgb(250 / 255, 250 / 255, 250 / 255), // Off-white background
    })

    // DRAW BORDERS
    firstPage.drawRectangle({
      x: 20, y: 20,
      width: width - 40, height: height - 40,
      borderColor: navyBlue,
      borderWidth: 4,
    })
    firstPage.drawRectangle({
      x: 30, y: 30,
      width: width - 60, height: height - 60,
      borderColor: gold,
      borderWidth: 2,
    })

    // DRAW CORNER ACCENTS (Gold Rectangles)
    const cornerSize = 40
    const cornerThickness = 4
    firstPage.drawRectangle({ x: 30, y: height - 30 - cornerSize, width: cornerThickness, height: cornerSize, color: gold })
    firstPage.drawRectangle({ x: 30, y: height - 30 - cornerThickness, width: cornerSize, height: cornerThickness, color: gold })
    firstPage.drawRectangle({ x: width - 30 - cornerThickness, y: height - 30 - cornerSize, width: cornerThickness, height: cornerSize, color: gold })
    firstPage.drawRectangle({ x: width - 30 - cornerSize, y: height - 30 - cornerThickness, width: cornerSize, height: cornerThickness, color: gold })
    firstPage.drawRectangle({ x: 30, y: 30, width: cornerThickness, height: cornerSize, color: gold })
    firstPage.drawRectangle({ x: 30, y: 30, width: cornerSize, height: cornerThickness, color: gold })
    firstPage.drawRectangle({ x: width - 30 - cornerThickness, y: 30, width: cornerThickness, height: cornerSize, color: gold })
    firstPage.drawRectangle({ x: width - 30 - cornerSize, y: 30, width: cornerSize, height: cornerThickness, color: gold })
  }
  // templateKind === 'pdf': admin's own template is assumed to already carry the
  // visual design, so we only draw text/QR on top of it below.

  // DRAW LOGO (optional, top corner/center)
  if (event.logo_path) {
    const logoBytes = fs.readFileSync(path.join(process.cwd(), 'public', event.logo_path))
    const isPngLogo = event.logo_path.toLowerCase().endsWith('.png')
    const logoImage = isPngLogo ? await pdfDoc.embedPng(logoBytes) : await pdfDoc.embedJpg(logoBytes)

    const maxLogoHeight = 70
    const maxLogoWidth = 180
    const scale = Math.min(maxLogoHeight / logoImage.height, maxLogoWidth / logoImage.width, 1)
    const logoWidth = logoImage.width * scale
    const logoHeight = logoImage.height * scale
    const topMargin = 20
    const sideMargin = 85 // clears the corner accents on the default design

    let logoX: number
    if (event.logo_position === 'top-left') {
      logoX = sideMargin
    } else if (event.logo_position === 'top-right') {
      logoX = width - sideMargin - logoWidth
    } else {
      logoX = (width - logoWidth) / 2
    }

    firstPage.drawImage(logoImage, {
      x: logoX,
      y: height - topMargin - logoHeight,
      width: logoWidth,
      height: logoHeight,
    })
  }

  // DRAW TEXT
  const titleText = event.certificate_title
  const titleSize = 32
  const titleWidth = fontBold.widthOfTextAtSize(titleText, titleSize)
  firstPage.drawText(titleText, {
    x: (width - titleWidth) / 2,
    y: height - 150,
    size: titleSize,
    font: fontBold,
    color: navyBlue,
  })

  const subtitleText = 'This certificate is proudly presented to'
  const subtitleSize = 16
  const subtitleWidth = fontItalic.widthOfTextAtSize(subtitleText, subtitleSize)
  firstPage.drawText(subtitleText, {
    x: (width - subtitleWidth) / 2,
    y: height - 210,
    size: subtitleSize,
    font: fontItalic,
    color: grayText,
  })

  // Center Name
  const nameText = user.full_name.toUpperCase()
  const nameSize = 42
  const nameWidth = fontBold.widthOfTextAtSize(nameText, nameSize)
  firstPage.drawText(nameText, {
    x: (width - nameWidth) / 2,
    y: height - 280,
    size: nameSize,
    font: fontBold,
    color: gold,
  })

  firstPage.drawLine({
    start: { x: (width - nameWidth) / 2 - 20, y: height - 290 },
    end: { x: (width + nameWidth) / 2 + 20, y: height - 290 },
    thickness: 1,
    color: navyBlue,
  })

  // Event Description
  const eventDesc = event.completion_text
  const eventDescSize = 14
  const eventDescWidth = fontNormal.widthOfTextAtSize(eventDesc, eventDescSize)
  firstPage.drawText(eventDesc, {
    x: (width - eventDescWidth) / 2,
    y: height - 340,
    size: eventDescSize,
    font: fontNormal,
    color: grayText,
  })

  const eventName = event.name
  const eventSize = 22
  const eventWidth = fontBold.widthOfTextAtSize(eventName, eventSize)
  firstPage.drawText(eventName, {
    x: (width - eventWidth) / 2,
    y: height - 380,
    size: eventSize,
    font: fontBold,
    color: navyBlue,
  })

  const dateIssued = certificate.issued_at.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // Draw Date (well above the signature block so the two never collide)
  const dateText = `Date: ${dateIssued}`
  firstPage.drawText(dateText, {
    x: 100, y: 140,
    size: 12,
    font: fontBold,
    color: navyBlue,
  })

  // Signature block: signer name (if any) sits right above the line, like a
  // signature; the line's caption below it is the signer's title, or a
  // generic "Authorized Signature" when no signer is configured.
  if (event.signer_name) {
    firstPage.drawText(event.signer_name, {
      x: 100, y: 104,
      size: 11,
      font: fontBold,
      color: navyBlue,
    })
  }
  firstPage.drawLine({
    start: { x: 90, y: 100 },
    end: { x: 250, y: 100 },
    thickness: 1,
    color: navyBlue,
  })
  firstPage.drawText(event.signer_name ? (event.signer_title || 'Penanggung Jawab') : 'Authorized Signature', {
    x: 115, y: 80,
    size: 10,
    font: fontItalic,
    color: grayText,
  })

  // Draw Cert ID
  firstPage.drawText(`ID: ${certificate.certificate_id}`, {
    x: 100, y: 50,
    size: 9,
    font: fontNormal,
    color: grayText,
  })

  // Generate QR Code
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    type: 'png',
    margin: 1,
    scale: 5,
    color: {
      dark: '#1e3a8a',
      light: '#ffffff',
    },
  })
  const qrImage = await pdfDoc.embedPng(qrBuffer)
  const qrDims = qrImage.scale(0.5)

  firstPage.drawImage(qrImage, {
    x: width - 100 - qrDims.width,
    y: 60,
    width: qrDims.width,
    height: qrDims.height,
  })
  firstPage.drawText('Scan to Verify', {
    x: width - 92 - qrDims.width,
    y: 45,
    size: 8,
    font: fontNormal,
    color: grayText,
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

function classifyTemplate(templatePath: string | null): 'pdf' | 'image' | 'default' {
  if (!templatePath) return 'default'
  const lower = templatePath.toLowerCase()
  if (lower.endsWith('.pdf')) return 'pdf'
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image'
  return 'default'
}
