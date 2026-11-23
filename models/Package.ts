import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const packageSchema = new Schema(
  {
    category: { type: String, enum: ['honey', 'ghee'], default: 'ghee', index: true },
    title: { type: String, required: true, trim: true, maxlength: 90 },
    description: { type: String, required: true, trim: true, maxlength: 240 },
    weight: { type: String, trim: true, maxlength: 40, default: '' },
    image: { type: String, trim: true, maxlength: 160, default: '' },
    gheeWeight: { type: String, trim: true, maxlength: 40, default: '' },
    honeyWeight: { type: String, trim: true, maxlength: 40, default: '' },
    price: { type: Number, required: true, min: 1 },
    originalPrice: { type: Number, required: true, min: 1 },
    badge: { type: String, default: '', trim: true, maxlength: 40 },
    freeDelivery: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export type PackageRecord = InferSchemaType<typeof packageSchema>
export const PackageModel = mongoose.models.Package || mongoose.model('Package', packageSchema)
