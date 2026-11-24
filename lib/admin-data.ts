import { PREVIEW_PACKAGES, type ProductCategory, type StorePackage } from '@/lib/catalog'
import { isMongoConfigured } from '@/lib/db'
import { type AdminCustomer, toAdminCustomer } from '@/lib/customers'
import { getAllPackages } from '@/lib/packages'
import { ensureSeedReviews, toAdminReview, type AdminReview } from '@/lib/reviews'
import { CouponModel } from '@/models/Coupon'
import { CustomerModel } from '@/models/Customer'
import { MessageModel } from '@/models/Message'
import { OrderModel } from '@/models/Order'
import { ReviewModel } from '@/models/Review'

export type { AdminCustomer } from '@/lib/customers'
export type { AdminReview } from '@/lib/reviews'

export type AdminOrder = {
  id: string
  orderNumber: string
  customerName: string
  phone: string
  address: string
  deliveryZone: 'dhaka' | 'outside'
  items: Array<{ packageId: string; title: string; price: number; quantity: number; category?: ProductCategory; weight?: string; image?: string; gheeWeight?: string; honeyWeight?: string }>
  subtotal: number
  deliveryCharge: number
  discount: number
  couponCode: string
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'fake'
  createdAt: string
}

export type AdminCoupon = {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  minSubtotal: number
  maxDiscount: number
  usageLimit: number
  usedCount: number
  active: boolean
  expiresAt: string | null
  createdAt: string
}

export type AdminMessage = {
  id: string
  name: string
  phone: string
  message: string
  createdAt: string
}

export type AdminDashboardData = {
  orders: AdminOrder[]
  packages: StorePackage[]
  messages: AdminMessage[]
  customers: AdminCustomer[]
  reviews: AdminReview[]
  coupons: AdminCoupon[]
  databaseConfigured: boolean
  databaseError: boolean
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  if (!isMongoConfigured()) {
    return { orders: [], packages: PREVIEW_PACKAGES, messages: [], customers: [], reviews: [], coupons: [], databaseConfigured: false, databaseError: false }
  }

  try {
    await ensureSeedReviews()
    const [orders, packages, messages, customers, reviews, coupons] = await Promise.all([
      OrderModel.find().sort({ createdAt: -1 }).limit(250).lean(),
      getAllPackages(),
      MessageModel.find().sort({ createdAt: -1 }).limit(100).lean(),
      CustomerModel.find().sort({ createdAt: -1 }).lean(),
      ReviewModel.find().sort({ createdAt: -1 }).limit(250).lean(),
      CouponModel.find().sort({ createdAt: -1 }).limit(200).lean(),
    ])

    return {
      orders: orders.map((order) => ({
        id: String(order._id),
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        deliveryZone: order.deliveryZone,
        items: order.items.map((item: { packageId: string; title: string; price: number; quantity: number; category?: ProductCategory; weight?: string; image?: string; gheeWeight?: string; honeyWeight?: string }) => ({
          packageId: item.packageId,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          category: item.category,
          weight: item.weight,
          image: item.image,
          gheeWeight: item.gheeWeight,
          honeyWeight: item.honeyWeight,
        })),
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        discount: order.discount ?? 0,
        couponCode: order.couponCode ?? '',
        total: order.total,
        status: order.status,
        createdAt: new Date(order.createdAt).toISOString(),
      })),
      packages,
      messages: messages.map((message) => ({
        id: String(message._id),
        name: message.name,
        phone: message.phone,
        message: message.message,
        createdAt: new Date(message.createdAt).toISOString(),
      })),
      customers: customers.map((customer) => toAdminCustomer(customer as Record<string, unknown>)),
      reviews: reviews.map((review) => toAdminReview(review as Record<string, unknown>)),
      coupons: coupons.map((coupon) => ({
        id: String(coupon._id),
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minSubtotal: coupon.minSubtotal ?? 0,
        maxDiscount: coupon.maxDiscount ?? 0,
        usageLimit: coupon.usageLimit ?? 0,
        usedCount: coupon.usedCount ?? 0,
        active: Boolean(coupon.active),
        expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString() : null,
        createdAt: new Date(coupon.createdAt).toISOString(),
      })),
      databaseConfigured: true,
      databaseError: false,
    }
  } catch {
    return { orders: [], packages: PREVIEW_PACKAGES, messages: [], customers: [], reviews: [], coupons: [], databaseConfigured: true, databaseError: true }
  }
}
