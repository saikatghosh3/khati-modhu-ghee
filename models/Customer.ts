import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const customerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, unique: true, index: true },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    notes: { type: String, default: '', trim: true, maxlength: 500 },
  },
  { timestamps: true },
)

export type CustomerRecord = InferSchemaType<typeof customerSchema>
export const CustomerModel = mongoose.models.Customer || mongoose.model('Customer', customerSchema)
