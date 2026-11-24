import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { ReviewInputError, validateReviewChanges } from '@/lib/review-validation'
import { toAdminReview } from '@/lib/reviews'
import { ReviewModel } from '@/models/Review'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'A MongoDB connection is required to save reviews.' }, { status: 503 })

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Review not found.' }, { status: 404 })

  try {
    const changes = validateReviewChanges(await request.json())
    await connectToDatabase()
    const updated = await ReviewModel.findByIdAndUpdate(id, changes, { new: true, runValidators: true })
    if (!updated) return NextResponse.json({ error: 'Review not found.' }, { status: 404 })
    return NextResponse.json({ review: toAdminReview(updated.toObject() as Record<string, unknown>) })
  } catch (error) {
    if (error instanceof ReviewInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Could not update review.' }, { status: 503 })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'A MongoDB connection is required to delete reviews.' }, { status: 503 })

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Review not found.' }, { status: 404 })

  try {
    await connectToDatabase()
    const deleted = await ReviewModel.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ error: 'Review not found.' }, { status: 404 })
    return NextResponse.json({ id: String(deleted._id) })
  } catch {
    return NextResponse.json({ error: 'Could not delete review.' }, { status: 503 })
  }
}
