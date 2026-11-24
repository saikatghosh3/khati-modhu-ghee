import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const reviewSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    location: { type: String, trim: true, maxlength: 80, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    title: { type: String, trim: true, maxlength: 90, default: '' },
    comment: { type: String, required: true, trim: true, maxlength: 600 },
    status: { type: String, enum: ['pending', 'published', 'hidden'], default: 'pending', index: true },
    featured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export type ReviewRecord = InferSchemaType<typeof reviewSchema>
export const ReviewModel = mongoose.models.Review || mongoose.model('Review', reviewSchema)
