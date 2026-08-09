import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

/** Toggle a claim code's active state — deactivating stops further redemptions without deleting its history. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(request)
  if (!auth.ok) return auth.response

  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    if (typeof body.is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active wajib diisi (boolean)' }, { status: 400 })
    }

    const claimCode = await prisma.claimCode.update({
      where: { id },
      data: { is_active: body.is_active },
    })

    return NextResponse.json({ success: true, claimCode })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Kode klaim tidak ditemukan' }, { status: 404 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
