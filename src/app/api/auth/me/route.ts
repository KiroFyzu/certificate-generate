import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { decrypt } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const sessionCookie = request.headers.get('cookie')?.split('session=')[1]?.split(';')[0]
    if (!sessionCookie) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const session = await decrypt(sessionCookie)
    if (!session || !session.userId) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        certificates: {
          include: { event: { select: { id: true, name: true } } },
          orderBy: { issued_at: 'desc' },
        }
      }
    })

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
