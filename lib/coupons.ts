import { CouponModel } from '@/models/Coupon'
import { normalizeCouponCode } from '@/lib/coupon-validation'

export type CouponApplication = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  discount: number
  minSubtotal: number
  maxDiscount: number
}

export type CouponQuote =
  | { ok: true; coupon: CouponApplication }
  | { ok: false; error: string }

function expired(expiresAt: unknown) {
  if (!expiresAt) return false
  const date = new Date(expiresAt as string | number | Date)
  return !Number.isNaN(date.getTime()) && date.getTime() < Date.now()
}

export async function getCouponQuote(codeInput: unknown, subtotal: number): Promise<CouponQuote> {
  const code = normalizeCouponCode(codeInput)
  if (!code) return { ok: false, error: 'কুপন কোড লিখুন।' }
  if (!Number.isFinite(subtotal) || subtotal <= 0) return { ok: false, error: 'কার্ট খালি আছে।' }

  const coupon = await CouponModel.findOne({ code }).lean()
  if (!coupon) return { ok: false, error: 'কুপন কোডটি সঠিক নয়।' }
  if (!coupon.active) return { ok: false, error: 'এই কুপনটি বর্তমানে সক্রিয় নয়।' }
  if (expired(coupon.expiresAt)) return { ok: false, error: 'এই কুপনের মেয়াদ শেষ হয়েছে।' }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, error: 'এই কুপনের ব্যবহার সীমা পূর্ণ হয়েছে।' }
  }
  if (subtotal < (coupon.minSubtotal ?? 0)) {
    return { ok: false, error: `এই কুপন ব্যবহার করতে কমপক্ষে ৳${coupon.minSubtotal} অর্ডার করতে হবে।` }
  }

  const rawDiscount = coupon.type === 'percent' ? Math.floor((subtotal * coupon.value) / 100) : coupon.value
  const capped = coupon.maxDiscount > 0 ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount
  const discount = Math.max(0, Math.min(subtotal, Math.floor(capped)))

  return {
    ok: true,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount,
      minSubtotal: coupon.minSubtotal ?? 0,
      maxDiscount: coupon.maxDiscount ?? 0,
    },
  }
}
