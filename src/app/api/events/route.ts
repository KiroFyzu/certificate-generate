import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/** Public list of events open for self-service certificate generation. */
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { is_active: true, issuance_mode: 'OPEN' },
      select: { id: true, name: true, description: true, event_date: true },
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json({ success: true, events })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
