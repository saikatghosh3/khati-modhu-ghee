import { PREVIEW_PACKAGES, type ProductCategory, type StorePackage } from '@/lib/catalog'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { getAllPackages } from '@/lib/packages'
import { MessageModel } from '@/models/Message'
import { OrderModel } from '@/models/Order'

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
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'fake'
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
  databaseConfigured: boolean
  databaseError: boolean
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  if (!isMongoConfigured()) {
    return { orders: [], packages: PREVIEW_PACKAGES, messages: [], databaseConfigured: false, databaseError: false }
  }

  try {
    await connectToDatabase()
    const [orders, packages, messages] = await Promise.all([
      OrderModel.find().sort({ createdAt: -1 }).limit(250).lean(),
      getAllPackages(),
      MessageModel.find().sort({ createdAt: -1 }).limit(100).lean(),
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
      databaseConfigured: true,
      databaseError: false,
    }
  } catch {
    return { orders: [], packages: PREVIEW_PACKAGES, messages: [], databaseConfigured: true, databaseError: true }
  }
}
