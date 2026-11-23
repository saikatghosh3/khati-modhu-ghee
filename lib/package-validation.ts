import { isProductCategory, isValidProductImage } from '@/lib/catalog'

export function validatePackage(body: unknown, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('INVALID')
  const input = body as Record<string, unknown>
  const result: Record<string, unknown> = {}
  const textFields = ['title', 'description', 'weight', 'image', 'badge'] as const

  for (const field of textFields) {
    if (partial && !(field in input)) continue
    if (typeof input[field] !== 'string') throw new Error('INVALID')
    const value = input[field].trim()
    const maxLength = field === 'description' ? 240 : field === 'title' ? 90 : field === 'image' ? 160 : 40
    if (value.length > maxLength || (field !== 'badge' && value.length === 0)) throw new Error('INVALID')
    if (field === 'image' && !isValidProductImage(value)) throw new Error('INVALID')
    result[field] = value
  }

  if (!partial || 'category' in input) {
    if (!isProductCategory(input.category)) throw new Error('INVALID')
    result.category = input.category
  }

  for (const field of ['price', 'originalPrice'] as const) {
    if (partial && !(field in input)) continue
    const value = Number(input[field])
    if (!Number.isInteger(value) || value < 1 || value > 1000000) throw new Error('INVALID')
    result[field] = value
  }

  for (const field of ['freeDelivery', 'active'] as const) {
    if (partial && !(field in input)) continue
    if (typeof input[field] !== 'boolean') throw new Error('INVALID')
    result[field] = input[field]
  }

  if ('sortOrder' in input || !partial) {
    const sortOrder = Number(input.sortOrder ?? 0)
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) throw new Error('INVALID')
    result.sortOrder = sortOrder
  }

  if (partial && Object.keys(result).length === 0) throw new Error('INVALID')
  return result
}
