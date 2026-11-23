import { Readable } from 'node:stream'
import mongoose from 'mongoose'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!mongoose.mongo.ObjectId.isValid(id)) return new Response('Not found', { status: 404 })
  if (!isMongoConfigured()) return new Response('Not found', { status: 404 })

  try {
    await connectToDatabase()
    if (!mongoose.connection.db) return new Response('Not found', { status: 404 })
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'product_images' })
    const files = await bucket.find({ _id: new mongoose.mongo.ObjectId(id) }).limit(1).toArray()
    const file = files[0]
    if (!file) return new Response('Not found', { status: 404 })

    const metadata = file.metadata as { contentType?: string } | undefined
    const stream = bucket.openDownloadStream(file._id)
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        'Content-Type': metadata?.contentType || 'application/octet-stream',
        'Content-Disposition': 'inline',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
