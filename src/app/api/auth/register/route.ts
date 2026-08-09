import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { encrypt, isSecureRequest } from '@/lib/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1'
    const isAllowed = await checkRateLimit(ip, 'register', 5, 15 * 60 * 1000)
    
    if (!isAllowed) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Silakan coba lagi nanti.' }, { status: 429 })
    }

    const body = await request.json()
    const { fullName, email, password, confirmPassword } = body

    if (!fullName || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    try {
      const user = await prisma.user.create({
        data: {
          full_name: fullName,
          email,
          password_hash: passwordHash,
          registration_ip: ip,
        },
      })

      // Generate Session
      const session = await encrypt({ userId: user.id, role: user.role })
      
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
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
    } catch (e: any) {
      if (e.code === 'P2002') {
        return NextResponse.json({ error: 'Email sudah terdaftar.' }, { status: 400 })
      }
      throw e
    }
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
