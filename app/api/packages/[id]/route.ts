import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { PackageModel } from '@/models/Package'
import { validatePackage } from '@/lib/package-validation'

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'A MongoDB connection is required to save packages.' }, { status: 503 })

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Package not found.' }, { status: 404 })

  try {
    const changes = validatePackage(await request.json(), true)
    await connectToDatabase()
    const updated = await PackageModel.findByIdAndUpdate(id, changes, { new: true, runValidators: true })
    if (!updated) return NextResponse.json({ error: 'Package not found.' }, { status: 404 })
    return NextResponse.json({ id: String(updated._id) })
  } catch (error) {
    const invalid = error instanceof Error && error.message === 'INVALID'
    return NextResponse.json({ error: invalid ? 'Package details are invalid.' : 'Could not update package.' }, { status: invalid ? 400 : 503 })
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'A MongoDB connection is required to delete packages.'}, { status: 503 })

  const { id } = await context.params
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Package not found.' }, { status: 404 })

  try {
    await connectToDatabase()
    const deleted = await PackageModel.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ error: 'Package not found.' }, { status: 404 })
    return NextResponse.json({ id: String(deleted._id) })
  } catch {
    return NextResponse.json({ error: 'Could not delete package.'}, { status: 503 })
  }
}
