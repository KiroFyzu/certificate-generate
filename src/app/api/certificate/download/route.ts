import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/auth'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'
import fs from 'fs'
import path from 'path'

export async function GET(request: Request) {
  try {
    const sessionCookie = request.headers.get('cookie')?.split('session=')[1]?.split(';')[0]
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await decrypt(sessionCookie)
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { certificate: true }
    })

    if (!user || !user.certificate) {
      return NextResponse.json({ error: 'Sertifikat tidak ditemukan' }, { status: 404 })
    }

    const cert = user.certificate
    
    // Load Template
    const templatePath = path.join(process.cwd(), 'public', 'template.pdf')
    let templateBytes: Uint8Array
    try {
      templateBytes = fs.readFileSync(templatePath)
    } catch (e) {
      return NextResponse.json({ error: 'Template not found' }, { status: 500 })
    }

    const pdfDoc = await PDFDocument.load(templateBytes)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)
    
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    // COLORS
    const navyBlue = rgb(30/255, 58/255, 138/255) // #1e3a8a
    const gold = rgb(212/255, 175/255, 55/255)   // #d4af37
    const grayText = rgb(100/255, 116/255, 139/255) // #64748b
    const white = rgb(1, 1, 1)

    // DRAW BACKGROUND (Override template if it's plain)
    firstPage.drawRectangle({
      x: 0, y: 0,
      width, height,
      color: rgb(250/255, 250/255, 250/255), // Off-white background
    })

    // DRAW BORDERS
    // Outer navy border
    firstPage.drawRectangle({
      x: 20, y: 20,
      width: width - 40, height: height - 40,
      borderColor: navyBlue,
      borderWidth: 4,
    })
    // Inner gold border
    firstPage.drawRectangle({
      x: 30, y: 30,
      width: width - 60, height: height - 60,
      borderColor: gold,
      borderWidth: 2,
    })

    // DRAW CORNER ACCENTS (Gold Rectangles)
    const cornerSize = 40
    const cornerThickness = 4
    // Top-Left
    firstPage.drawRectangle({ x: 30, y: height - 30 - cornerSize, width: cornerThickness, height: cornerSize, color: gold })
    firstPage.drawRectangle({ x: 30, y: height - 30 - cornerThickness, width: cornerSize, height: cornerThickness, color: gold })
    // Top-Right
    firstPage.drawRectangle({ x: width - 30 - cornerThickness, y: height - 30 - cornerSize, width: cornerThickness, height: cornerSize, color: gold })
    firstPage.drawRectangle({ x: width - 30 - cornerSize, y: height - 30 - cornerThickness, width: cornerSize, height: cornerThickness, color: gold })
    // Bottom-Left
    firstPage.drawRectangle({ x: 30, y: 30, width: cornerThickness, height: cornerSize, color: gold })
    firstPage.drawRectangle({ x: 30, y: 30, width: cornerSize, height: cornerThickness, color: gold })
    // Bottom-Right
    firstPage.drawRectangle({ x: width - 30 - cornerThickness, y: 30, width: cornerThickness, height: cornerSize, color: gold })
    firstPage.drawRectangle({ x: width - 30 - cornerSize, y: 30, width: cornerSize, height: cornerThickness, color: gold })


    // DRAW TEXT
    const titleText = 'CERTIFICATE OF APPRECIATION'
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

    // Line under name
    firstPage.drawLine({
      start: { x: (width - nameWidth) / 2 - 20, y: height - 290 },
      end: { x: (width + nameWidth) / 2 + 20, y: height - 290 },
      thickness: 1,
      color: navyBlue,
    })

    // Event Description
    const eventDesc = 'for outstanding participation and successfully completing'
    const eventDescSize = 14
    const eventDescWidth = fontNormal.widthOfTextAtSize(eventDesc, eventDescSize)
    firstPage.drawText(eventDesc, {
      x: (width - eventDescWidth) / 2,
      y: height - 340,
      size: eventDescSize,
      font: fontNormal,
      color: grayText,
    })

    const eventName = 'Seminar Nasional Teknologi 2026'
    const eventSize = 22
    const eventWidth = fontBold.widthOfTextAtSize(eventName, eventSize)
    firstPage.drawText(eventName, {
      x: (width - eventWidth) / 2,
      y: height - 380,
      size: eventSize,
      font: fontBold,
      color: navyBlue,
    })

    const dateIssued = cert.issued_at.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    })

    // Draw Date and Signature Line
    const dateText = `Date: ${dateIssued}`
    const dateSize = 12
    firstPage.drawText(dateText, {
      x: 100, y: 110,
      size: dateSize,
      font: fontBold,
      color: navyBlue,
    })
    firstPage.drawLine({
      start: { x: 90, y: 100 },
      end: { x: 250, y: 100 },
      thickness: 1,
      color: navyBlue,
    })
    firstPage.drawText('Authorized Signature', {
      x: 115, y: 80,
      size: 10,
      font: fontItalic,
      color: grayText,
    })

    // Draw Cert ID
    firstPage.drawText(`ID: ${cert.certificate_id}`, {
      x: 100, y: 50,
      size: 9,
      font: fontNormal,
      color: grayText,
    })

    // Generate QR Code
    const host = request.headers.get('host') || 'localhost:3000'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const verifyUrl = `${protocol}://${host}/verify/${cert.certificate_id}`
    
    // Add QR Code with navy dark color to match theme
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { 
      type: 'png', 
      margin: 1, 
      scale: 5,
      color: {
        dark: '#1e3a8a',  // navy blue
        light: '#ffffff' // white background
      }
    })
    const qrImage = await pdfDoc.embedPng(qrBuffer)
    const qrDims = qrImage.scale(0.5)
    
    // Position QR on bottom right
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
    const pdfBuffer = Buffer.from(pdfBytes)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Certificate-${cert.certificate_id}.pdf"`,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
