import { jwtVerify, SignJWT } from 'jose'
import { NextResponse } from 'next/server'

export interface SessionPayload {
  userId: string
  role: string
}

const secretKey = process.env.JWT_SECRET
if (!secretKey) {
  throw new Error('JWT_SECRET is not defined')
}

const key = new TextEncoder().encode(secretKey)

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key)
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    })
    return payload as unknown as SessionPayload
  } catch (error) {
    return null
  }
}

/** Reads and verifies the `session` cookie from an API route's Request. */
export async function getSession(request: Request): Promise<SessionPayload | null> {
  const sessionCookie = request.headers.get('cookie')?.split('session=')[1]?.split(';')[0]
  if (!sessionCookie) return null
  return decrypt(sessionCookie)
}

type AdminGuardResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse }

/** Shared guard for admin-only API routes: verifies session + ADMIN role. */
export async function requireAdmin(request: Request): Promise<AdminGuardResult> {
  const session = await getSession(request)
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (session.role !== 'ADMIN') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { ok: true, session }
}
