import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { toAdminCustomer } from '@/lib/customers'
import { CustomerModel } from '@/models/Customer'

const phonePattern = /^01[3-9]\d{8}$/

export async function GET() {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'MongoDB is not configured.' }, { status: 503 })

  try {
    await connectToDatabase()
    const customers = await CustomerModel.find().sort({ createdAt: -1 }).lean()
    return NextResponse.json({ customers: customers.map((customer) => toAdminCustomer(customer as Record<string, unknown>)) })
  } catch {
    return NextResponse.json({ error: 'Could not load customers.' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'MongoDB is required to save customers.' }, { status: 503 })

  try {
    const input = await request.json() as Record<string, unknown>
    const name = String(input.name ?? '').trim()
    const phone = String(input.phone ?? '').trim()
    const address = String(input.address ?? '').trim()
    const notes = String(input.notes ?? '').trim()
    if (name.length < 2 || name.length > 100 || !phonePattern.test(phone) || address.length < 12 || address.length > 500 || notes.length > 500) {
      return NextResponse.json({ error: 'Enter valid customer details.' }, { status: 400 })
    }

    await connectToDatabase()
    const created = await CustomerModel.create({ name, phone, address, notes })
    return NextResponse.json({ customer: toAdminCustomer(created.toObject() as Record<string, unknown>) }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'A customer with this phone number already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Could not create customer.' }, { status: 503 })
  }
}
