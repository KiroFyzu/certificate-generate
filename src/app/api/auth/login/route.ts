import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encrypt, isSecureRequest } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const isAllowed = await checkRateLimit(ip, 'login', 10, 15 * 60 * 1000)
    
    if (!isAllowed) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' }, { status: 429 })
    }

    const body = await request.json()
    const { email, password, isAdminLogin } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (isAdminLogin && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak. Anda bukan admin.' }, { status: 403 })
    }

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    // Log IP
    await prisma.securityEvent.create({
      data: {
        user_id: user.id,
        ip_address: ip,
        event_type: isAdminLogin ? 'ADMIN_LOGIN' : 'LOGIN',
      }
    })

    // Generate Session
    const session = await encrypt({ userId: user.id, role: user.role })
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      }
    })

    // Set cookie
    response.cookies.set('session', session, {
      httpOnly: true,
      secure: isSecureRequest(request),
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
