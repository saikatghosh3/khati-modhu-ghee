import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { isProductCategory } from '@/lib/catalog'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { getCouponQuote } from '@/lib/coupons'
import { syncCustomerFromOrder } from '@/lib/customers'
import { CouponModel } from '@/models/Coupon'
import { OrderModel } from '@/models/Order'
import { PackageModel } from '@/models/Package'

const phonePattern = /^01[3-9]\d{8}$/
const orderStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'fake'] as const

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Not authorized. Please sign in again.' }, { status: 401 })
  }
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: 'MongoDB is not configured.' }, { status: 503 })
  }

  try {
    await connectToDatabase()
    const searchParams = new URL(request.url).searchParams
    const search = searchParams.get('search')?.trim().slice(0, 100)
    const status = searchParams.get('status')
    const filter: Record<string, unknown> = {}

    if (status && orderStatuses.includes(status as (typeof orderStatuses)[number])) {
      filter.status = status
    }
    if (search) {
      filter.$or = [
        { phone: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
        { orderNumber: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      ]
    }

    const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).limit(250).lean()
    return NextResponse.json({ orders: orders.map((order) => ({
      id: String(order._id),
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      phone: order.phone,
      address: order.address,
      deliveryZone: order.deliveryZone,
      items: order.items.map((item: { packageId: string; title: string; price: number; quantity: number; gheeWeight: string; honeyWeight: string }) => ({ ...item })),
      subtotal: order.subtotal,
      deliveryCharge: order.deliveryCharge,
      discount: order.discount ?? 0,
      couponCode: order.couponCode ?? '',
      total: order.total,
      status: order.status,
      createdAt: new Date(order.createdAt).toISOString(),
    })) })
  } catch {
    return NextResponse.json({ error: 'Could not load orders. Check your MongoDB connection.' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: 'অর্ডার নিতে MongoDB সংযোগ প্রয়োজন।' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'সঠিক অর্ডার তথ্য পাঠান।' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'সঠিক অর্ডার তথ্য পাঠান।' }, { status: 400 })
  }

  const input = body as Record<string, unknown>
  const customerName = typeof input.customerName === 'string' ? input.customerName.trim() : ''
  const phone = typeof input.phone === 'string' ? input.phone.trim() : ''
  const address = typeof input.address === 'string' ? input.address.trim() : ''
  const deliveryZone = input.deliveryZone
  const requestedItems = input.items
  const couponCode = typeof input.couponCode === 'string' ? input.couponCode.trim().toUpperCase() : ''

  if (customerName.length < 2 || customerName.length > 100) {
    return NextResponse.json({ error: 'পূর্ণ নাম ২ থেকে ১০০ অক্ষরের মধ্যে লিখুন।' }, { status: 400 })
  }
  if (!phonePattern.test(phone)) {
    return NextResponse.json({ error: 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন।' }, { status: 400 })
  }
  if (address.length < 12 || address.length > 500) {
    return NextResponse.json({ error: 'সম্পূর্ণ ঠিকানা ১২ থেকে ৫০০ অক্ষরের মধ্যে লিখুন।' }, { status: 400 })
  }
  if (deliveryZone !== 'dhaka' && deliveryZone !== 'outside') {
    return NextResponse.json({ error: 'ডেলিভারি এলাকা নির্বাচন করুন।' }, { status: 400 })
  }
  if (!Array.isArray(requestedItems) || requestedItems.length < 1 || requestedItems.length > 20) {
    return NextResponse.json({ error: 'কার্টে অন্তত একটি পণ্য থাকতে হবে।' }, { status: 400 })
  }

  const quantities = new Map<string, number>()
  for (const item of requestedItems) {
    if (!item || typeof item !== 'object') {
      return NextResponse.json({ error: 'কার্টের পণ্যের তথ্য সঠিক নয়।' }, { status: 400 })
    }
    const candidate = item as Record<string, unknown>
    const packageId = typeof candidate.packageId === 'string' ? candidate.packageId : ''
    const quantity = Number(candidate.quantity)
    if (!packageId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return NextResponse.json({ error: 'প্রতি পণ্যের পরিমাণ ১ থেকে ১০-এর মধ্যে হতে হবে।' }, { status: 400 })
    }
    const nextQuantity = (quantities.get(packageId) ?? 0) + quantity
    if (nextQuantity > 10) {
      return NextResponse.json({ error: 'একই পণ্যের সর্বোচ্চ পরিমাণ ১০টি।' }, { status: 400 })
    }
    quantities.set(packageId, nextQuantity)
  }

  try {
    await connectToDatabase()
    const packages = await PackageModel.find({ _id: { $in: [...quantities.keys()] }, active: true }).lean()
    if (packages.length !== quantities.size) {
      return NextResponse.json({ error: 'কার্টের একটি প্যাকেজ আর পাওয়া যাচ্ছে না। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।' }, { status: 409 })
    }

    const items = packages.map((product) => {
      const category = isProductCategory(product.category) ? product.category : 'ghee'
      const weight = String(product.weight || '')
      return {
        packageId: String(product._id),
        title: product.title,
        price: product.price,
        quantity: quantities.get(String(product._id)) ?? 1,
        category,
        weight,
        image: String(product.image || ''),
        gheeWeight: category === 'ghee' ? weight : 'নেই',
        honeyWeight: category === 'honey' ? weight : 'নেই',
      }
    })
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const hasFreeDelivery = packages.some((product) => product.freeDelivery)
    const deliveryCharge = hasFreeDelivery ? 0 : deliveryZone === 'dhaka' ? 60 : 120
    let discount = 0
    let appliedCouponCode = ''

    if (couponCode) {
      const quote = await getCouponQuote(couponCode, subtotal)
      if (!quote.ok) return NextResponse.json({ error: quote.error }, { status: 400 })
      const consumed = await CouponModel.findOneAndUpdate(
        {
          code: quote.coupon.code,
          active: true,
          $and: [
            { $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
            { $or: [{ usageLimit: 0 }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }] },
          ],
        },
        { $inc: { usedCount: 1 } },
        { new: true },
      ).lean()
      if (!consumed) return NextResponse.json({ error: 'এই কুপনটি এখন আর ব্যবহারযোগ্য নয়।' }, { status: 400 })
      discount = quote.coupon.discount
      appliedCouponCode = quote.coupon.code
    }

    const orderNumber = `GWH-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString('hex').toUpperCase()}`
    const order = await OrderModel.create({
      orderNumber,
      customerName,
      phone,
      address,
      deliveryZone,
      items,
      subtotal,
      deliveryCharge,
      discount,
      couponCode: appliedCouponCode,
      total: Math.max(0, subtotal - discount + deliveryCharge),
      status: 'pending',
    })
    await syncCustomerFromOrder({ name: customerName, phone, address })

    return NextResponse.json({ orderNumber: order.orderNumber, total: order.total, discount: order.discount, couponCode: order.couponCode }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'অর্ডার সংরক্ষণ করা যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।' }, { status: 503 })
  }
}
