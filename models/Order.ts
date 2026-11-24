import mongoose, { Schema, type InferSchemaType } from 'mongoose'

const orderItemSchema = new Schema(
  {
    packageId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 1 },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    category: { type: String, enum: ['honey', 'ghee'], default: 'ghee' },
    weight: { type: String, default: '' },
    image: { type: String, default: '' },
    gheeWeight: { type: String, default: '' },
    honeyWeight: { type: String, default: '' },
  },
  { _id: false },
)

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, index: true },
    address: { type: String, required: true, trim: true, maxlength: 500 },
    deliveryZone: { type: String, enum: ['dhaka', 'outside'], required: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 1 },
    deliveryCharge: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: '', trim: true, uppercase: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'fake'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true },
)

export type OrderRecord = InferSchemaType<typeof orderSchema>
export const OrderModel = mongoose.models.Order || mongoose.model('Order', orderSchema)
