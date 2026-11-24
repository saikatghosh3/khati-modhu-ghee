import { NextResponse } from 'next/server'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { getCouponQuote } from '@/lib/coupons'

export async function POST(request: Request) {
  if (!isMongoConfigured()) return NextResponse.json({ error: 'MongoDB is not configured.' }, { status: 503 })
  try {
    const body = await request.json() as Record<string, unknown>
    const subtotal = Number(body.subtotal)
    await connectToDatabase()
    const quote = await getCouponQuote(body.code, subtotal)
    if (!quote.ok) return NextResponse.json({ error: quote.error }, { status: 400 })
    return NextResponse.json({ coupon: quote.coupon })
  } catch {
    return NextResponse.json({ error: 'Could not validate coupon.' }, { status: 503 })
  }
}
