import type { ReviewStatus } from '@/lib/reviews'

const phonePattern = /^01[3-9]\d{8}$/

export class ReviewInputError extends Error {}

export type ReviewSubmission = {
  name: string
  phone: string
  location: string
  rating: number
  title: string
  comment: string
}

export type ReviewChanges = Partial<ReviewSubmission & {
  status: ReviewStatus
  featured: boolean
  sortOrder: number
}>

export function validateReviewSubmission(body: unknown): ReviewSubmission {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ReviewInputError('সঠিক তথ্য পাঠান।')
  }

  const input = body as Record<string, unknown>
  const name = String(input.name ?? '').trim()
  const phone = String(input.phone ?? '').trim()
  const location = String(input.location ?? '').trim()
  const title = String(input.title ?? '').trim()
  const comment = String(input.comment ?? '').trim()
  const rating = Number(input.rating)

  if (name.length < 2 || name.length > 100) throw new ReviewInputError('নাম ২ থেকে ১০০ অক্ষরের মধ্যে লিখুন।')
  if (phone && !phonePattern.test(phone)) throw new ReviewInputError('সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন।')
  if (location.length > 80) throw new ReviewInputError('অঞ্চলের নাম ৮০ অক্ষরের কম লিখুন।')
  if (title.length > 90) throw new ReviewInputError('শিরোনাম ৯০ অক্ষরের কম লিখুন।')
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ReviewInputError('১ থেকে ৫ তারকা বেছে নিন।')
  if (comment.length < 10 || comment.length > 600) throw new ReviewInputError('মতামত ১০ থেকে ৬০০ অক্ষরের মধ্যে লিখুন।')

  return { name, phone, location, rating, title, comment }
}

export function validateReviewChanges(body: unknown): ReviewChanges {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ReviewInputError('Enter valid review details.')
  }

  const input = body as Record<string, unknown>
  const changes: Record<string, unknown> = {}

  for (const field of ['name', 'phone', 'location', 'title', 'comment'] as const) {
    if (!(field in input)) continue
    const value = String(input[field] ?? '').trim()
    const maxLength = field === 'comment' ? 600 : field === 'name' ? 100 : field === 'title' ? 90 : field === 'location' ? 80 : 20
    const minLength = field === 'comment' ? 10 : field === 'name' ? 2 : 0
    if (value.length < minLength || value.length > maxLength) throw new ReviewInputError('Enter valid review details.')
    if (field === 'phone' && value && !phonePattern.test(value)) throw new ReviewInputError('Enter a valid phone number.')
    changes[field] = value
  }

  if ('rating' in input) {
    const rating = Number(input.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new ReviewInputError('Rating must be between 1 and 5.')
    changes.rating = rating
  }

  if ('status' in input) {
    if (input.status !== 'pending' && input.status !== 'published' && input.status !== 'hidden') {
      throw new ReviewInputError('Invalid review status.')
    }
    changes.status = input.status
  }

  if ('featured' in input) {
    if (typeof input.featured !== 'boolean') throw new ReviewInputError('Invalid featured value.')
    changes.featured = input.featured
  }

  if ('sortOrder' in input) {
    const sortOrder = Number(input.sortOrder)
    if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) throw new ReviewInputError('Invalid display order.')
    changes.sortOrder = sortOrder
  }

  if (Object.keys(changes).length === 0) throw new ReviewInputError('No changes supplied.')
  return changes as ReviewChanges
}
