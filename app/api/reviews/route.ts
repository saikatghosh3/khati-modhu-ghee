import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { ReviewInputError, validateReviewChanges, validateReviewSubmission } from '@/lib/review-validation'
import { getAllReviews, getStoreReviews } from '@/lib/reviews'
import { ReviewModel } from '@/models/Review'

export async function GET(request: Request) {
  const showAll = new URL(request.url).searchParams.get('all') === '1'
  if (showAll && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  }

  try {
    const reviews = showAll ? await getAllReviews() : await getStoreReviews()
    return NextResponse.json(showAll ? { reviews, databaseConfigured: isMongoConfigured() } : { reviews })
  } catch {
    return NextResponse.json({ error: 'Could not load reviews.' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: 'রিভিউ সংরক্ষণ করতে MongoDB সংযোগ প্রয়োজন।' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const submission = validateReviewSubmission(body)
    const moderation: Record<string, unknown> = {}
    if (await isAdminAuthenticated()) {
      const input = body as Record<string, unknown>
      for (const field of ['status', 'featured', 'sortOrder'] as const) {
        if (field in input) moderation[field] = input[field]
      }
    }
    const changes = Object.keys(moderation).length ? validateReviewChanges(moderation) : {}
    await connectToDatabase()
    await ReviewModel.create({ ...submission, status: 'pending', featured: false, sortOrder: 0, ...changes })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    if (error instanceof ReviewInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'রিভিউটি পাঠানো যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।' }, { status: 503 })
  }
}
