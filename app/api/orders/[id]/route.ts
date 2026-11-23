import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { OrderModel } from '@/models/Order'

const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'fake']

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'MongoDB is not configured.' }, { status: 503 })

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })

  try {
    const body = (await request.json()) as { status?: unknown }
    if (typeof body.status !== 'string' || !allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 })
    }
    await connectToDatabase()
    const order = await OrderModel.findByIdAndUpdate(id, { status: body.status }, { new: true, runValidators: true })
    if (!order) return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
    return NextResponse.json({ id: String(order._id), status: order.status })
  } catch {
    return NextResponse.json({ error: 'Could not update order status.' }, { status: 503 })
  }
}
