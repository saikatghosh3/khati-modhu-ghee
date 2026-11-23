import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { toAdminCustomer } from '@/lib/customers'
import { CustomerModel } from '@/models/Customer'

const phonePattern = /^01[3-9]\d{8}$/

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'MongoDB is required to save customers.' }, { status: 503 })

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })

  try {
    const input = await request.json() as Record<string, unknown>
    const changes: Record<string, string> = {}
    for (const field of ['name', 'phone', 'address', 'notes'] as const) {
      if (!(field in input)) continue
      const value = String(input[field] ?? '').trim()
      const maxLength = field === 'address' || field === 'notes' ? 500 : 100
      if (value.length > maxLength || (field !== 'notes' && value.length === 0)) {
        return NextResponse.json({ error: 'Enter valid customer details.' }, { status: 400 })
      }
      if (field === 'phone' && !phonePattern.test(value)) return NextResponse.json({ error: 'Enter a valid phone number.' }, { status: 400 })
      changes[field] = value
    }
    if (Object.keys(changes).length === 0) return NextResponse.json({ error: 'No changes supplied.' }, { status: 400 })

    await connectToDatabase()
    const updated = await CustomerModel.findByIdAndUpdate(id, changes, { new: true, runValidators: true })
    if (!updated) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })
    return NextResponse.json({ customer: toAdminCustomer(updated.toObject() as Record<string, unknown>) })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json({ error: 'A customer with this phone number already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Could not update customer.' }, { status: 503 })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'MongoDB is required to delete customers.' }, { status: 503 })

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })

  try {
    await connectToDatabase()
    const deleted = await CustomerModel.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })
    return NextResponse.json({ id: String(deleted._id) })
  } catch {
    return NextResponse.json({ error: 'Could not delete customer.' }, { status: 503 })
  }
}
