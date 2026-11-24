import { NextResponse } from 'next/server'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { OrderModel } from '@/models/Order'

const phonePattern = /^01[3-9]\d{8}$/

export async function POST(request: Request) {
  if (!isMongoConfigured()) return NextResponse.json({ error: 'Tracking is unavailable right now.' }, { status: 503 })

  try {
    const input = await request.json() as Record<string, unknown>
    const phone = String(input.phone ?? '').trim()
    const orderNumber = String(input.orderNumber ?? '').trim().toUpperCase()
    if (!phonePattern.test(phone) || orderNumber.length < 6 || orderNumber.length > 60) {
      return NextResponse.json({ error: 'Enter a valid phone number and order number.' }, { status: 400 })
    }

    await connectToDatabase()
    const orders = await OrderModel.find({ phone, orderNumber }).sort({ createdAt: -1 }).limit(20).lean()
    return NextResponse.json({
      orders: orders.map((order) => ({
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        deliveryZone: order.deliveryZone,
        items: order.items.map((item: { title: string; quantity: number; price: number; weight?: string; category?: string; image?: string }) => ({
          title: item.title,
          quantity: item.quantity,
          price: item.price,
          weight: item.weight,
          category: item.category,
          image: item.image,
        })),
        subtotal: order.subtotal,
        deliveryCharge: order.deliveryCharge,
        discount: order.discount ?? 0,
        couponCode: order.couponCode ?? '',
        total: order.total,
        status: order.status,
        createdAt: new Date(order.createdAt).toISOString(),
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Could not load tracking details.' }, { status: 503 })
  }
}
