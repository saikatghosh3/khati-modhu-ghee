import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { CouponInputError, validateCouponInput } from '@/lib/coupon-validation'
import { CouponModel } from '@/models/Coupon'

function mapCoupon(coupon: any) {
  return {
    id: String(coupon._id),
    code: coupon.code,
    type: coupon.type,
    value: coupon.value,
    minSubtotal: coupon.minSubtotal ?? 0,
    maxDiscount: coupon.maxDiscount ?? 0,
    usageLimit: coupon.usageLimit ?? 0,
    usedCount: coupon.usedCount ?? 0,
    active: Boolean(coupon.active),
    expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString() : null,
    createdAt: new Date(coupon.createdAt).toISOString(),
  }
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'MongoDB is not configured.' }, { status: 503 })

  try {
    await connectToDatabase()
    const coupons = await CouponModel.find().sort({ createdAt: -1 }).limit(200).lean()
    return NextResponse.json({ coupons: coupons.map(mapCoupon) })
  } catch {
    return NextResponse.json({ error: 'Could not load coupons.' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'MongoDB is not configured.' }, { status: 503 })

  try {
    const body = await request.json()
    const input = validateCouponInput(body)
    await connectToDatabase()
    const existing = await CouponModel.findOne({ code: input.code }).lean()
    if (existing) return NextResponse.json({ error: 'This coupon code already exists.' }, { status: 409 })
    const coupon = await CouponModel.create({ ...input, usedCount: 0 })
    return NextResponse.json({ coupon: mapCoupon(coupon.toObject()) }, { status: 201 })
  } catch (error) {
    if (error instanceof CouponInputError) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: 'Could not create coupon.' }, { status: 503 })
  }
}
