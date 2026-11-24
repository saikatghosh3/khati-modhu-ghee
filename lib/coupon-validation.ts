export class CouponInputError extends Error {}

export type CouponInput = {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minSubtotal: number
  maxDiscount: number
  usageLimit: number
  active: boolean
  expiresAt: Date | null
}

const codePattern = /^[A-Z0-9][A-Z0-9_-]{1,23}$/

function asNumber(value: unknown, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

export function normalizeCouponCode(value: unknown) {
  return String(value ?? '').trim().toUpperCase()
}

export function validateCouponInput(body: unknown, partial = false): Partial<CouponInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new CouponInputError('Invalid coupon data.')
  const input = body as Record<string, unknown>
  const result: Partial<CouponInput> = {}

  if (!partial || 'code' in input) {
    const code = normalizeCouponCode(input.code)
    if (!codePattern.test(code)) throw new CouponInputError('Coupon code must be 2-24 chars: A-Z, 0-9, _ or -.')
    result.code = code
  }

  if (!partial || 'type' in input) {
    if (input.type !== 'percent' && input.type !== 'fixed') throw new CouponInputError('Coupon type must be percent or fixed.')
    result.type = input.type
  }

  const type = (result.type ?? (input.type === 'percent' || input.type === 'fixed' ? input.type : undefined)) as CouponInput['type'] | undefined

  if (!partial || 'value' in input) {
    const value = Math.floor(asNumber(input.value, NaN))
    if (!Number.isInteger(value) || value < 1) throw new CouponInputError('Coupon value must be at least 1.')
    if (type === 'percent' && value > 100) throw new CouponInputError('Percent coupon cannot exceed 100%.')
    if (type === 'fixed' && value > 100000) throw new CouponInputError('Fixed coupon value is too large.')
    result.value = value
  }

  for (const field of ['minSubtotal', 'maxDiscount', 'usageLimit'] as const) {
    if (partial && !(field in input)) continue
    const value = Math.floor(asNumber(input[field], 0))
    const max = field === 'usageLimit' ? 100000 : 1000000
    if (!Number.isInteger(value) || value < 0 || value > max) throw new CouponInputError(`Invalid ${field}.`)
    result[field] = value
  }

  if (!partial || 'active' in input) {
    if (typeof input.active !== 'boolean') throw new CouponInputError('Invalid active value.')
    result.active = input.active
  }

  if (!partial || 'expiresAt' in input) {
    const raw = input.expiresAt
    if (raw === null || raw === '' || raw === undefined) {
      result.expiresAt = null
    } else {
      const date = new Date(String(raw))
      if (Number.isNaN(date.getTime())) throw new CouponInputError('Invalid expiry date.')
      result.expiresAt = date
    }
  }

  if (partial && Object.keys(result).length === 0) throw new CouponInputError('No coupon changes supplied.')
  return result
}
