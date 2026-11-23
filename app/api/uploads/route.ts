import { Readable } from 'node:stream'
import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'

export const runtime = 'nodejs'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const allowedTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function getBucket() {
  if (!mongoose.connection.db) throw new Error('Database is unavailable.')
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'product_images' })
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 })
  if (!isMongoConfigured()) return NextResponse.json({ error: 'MongoDB is required to upload images.' }, { status: 503 })

  try {
    const form = await request.formData()
    const candidate = form.get('file')
    if (!candidate || typeof candidate === 'string' || typeof candidate.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Choose an image file.' }, { status: 400 })
    }

    const file = candidate as File
    const extension = allowedTypes[file.type]
    if (!extension) return NextResponse.json({ error: 'Only JPG, PNG and WEBP images are allowed.' }, { status: 400 })
    if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image must be smaller than 5 MB.' }, { status: 400 })
    }

    await connectToDatabase()
    const buffer = Buffer.from(await file.arrayBuffer())
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || `product.${extension}`
    const bucket = getBucket()
    const upload = bucket.openUploadStream(originalName, {
      metadata: { originalName, size: file.size, contentType: file.type },
    })

    await new Promise<void>((resolve, reject) => {
      Readable.from(buffer).pipe(upload)
      upload.on('finish', () => resolve())
      upload.on('error', reject)
    })

    return NextResponse.json({ url: `/api/uploads/${String(upload.id)}` }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not upload image.' }, { status: 500 })
  }
}
