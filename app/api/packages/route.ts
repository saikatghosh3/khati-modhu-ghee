import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { getAllPackages, getStorePackages } from '@/lib/packages'
import { validatePackage } from '@/lib/package-validation'
import { PackageModel } from '@/models/Package'

export async function GET(request: Request) {
  const showAll = new URL(request.url).searchParams.get('all') === '1'
  if (showAll && !(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  }

  try {
    const packages = showAll ? await getAllPackages() : await getStorePackages()
    return NextResponse.json(showAll ? { packages, databaseConfigured: isMongoConfigured() } : { packages })
  } catch {
    return NextResponse.json({ error: 'Could not load packages. Check your MongoDB connection.' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'A MongoDB connection is required to save packages.' }, { status: 503 })

  try {
    const packageData = validatePackage(await request.json())
    await connectToDatabase()
    const created = await PackageModel.create(packageData)
    return NextResponse.json({ id: String(created._id) }, { status: 201 })
  } catch (error) {
    const invalid = error instanceof Error && error.message === 'INVALID'
    return NextResponse.json(
      { error: invalid ? 'Please complete all package fields with valid values.' : 'Could not create package.' },
      { status: invalid ? 400 : 503 },
    )
  }
}
