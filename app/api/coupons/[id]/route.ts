import mongoose from 'mongoose'
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

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'MongoDB is not configured.' }, { status: 503 })
  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 })

  try {
    const body = await request.json()
    const changes = validateCouponInput(body, true)
    await connectToDatabase()
    if (changes.code) {
      const duplicate = await CouponModel.findOne({ code: changes.code, _id: { $ne: id } }).lean()
      if (duplicate) return NextResponse.json({ error: 'This coupon code already exists.' }, { status: 409 })
    }
    const coupon = await CouponModel.findByIdAndUpdate(id, { $set: changes }, { new: true, runValidators: true }).lean()
    if (!coupon) return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 })
    return NextResponse.json({ coupon: mapCoupon(coupon) })
  } catch (error) {
    if (error instanceof CouponInputError) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ error: 'Could not update coupon.' }, { status: 503 })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'MongoDB is not configured.' }, { status: 503 })
  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 })

  try {
    await connectToDatabase()
    const coupon = await CouponModel.findByIdAndDelete(id).lean()
    if (!coupon) return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Could not delete coupon.' }, { status: 503 })
  }
}
