import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const messageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
)

export type MessageRecord = InferSchemaType<typeof messageSchema>
export const MessageModel = mongoose.models.Message || mongoose.model('Message', messageSchema)
