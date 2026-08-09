import prisma from './prisma'

export async function checkRateLimit(ip: string, endpoint: string, maxHits: number, windowMs: number): Promise<boolean> {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + windowMs)

  try {
    const rateLimit = await prisma.rateLimit.findUnique({
      where: {
        ip_address_endpoint: {
          ip_address: ip,
          endpoint,
        }
      }
    })

    if (!rateLimit) {
      await prisma.rateLimit.create({
        data: {
          ip_address: ip,
          endpoint,
          hits: 1,
          expires_at: expiresAt,
        }
      })
      return true
    }

    if (now > rateLimit.expires_at) {
      // Reset window
      await prisma.rateLimit.update({
        where: { id: rateLimit.id },
        data: { hits: 1, expires_at: expiresAt }
      })
      return true
    }

    if (rateLimit.hits >= maxHits) {
      return false
    }

    await prisma.rateLimit.update({
      where: { id: rateLimit.id },
      data: { hits: { increment: 1 } }
    })

    return true
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fail open in case of DB issues
    return true
  }
}
