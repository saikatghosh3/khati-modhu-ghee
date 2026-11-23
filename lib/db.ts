import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI

type MongooseCache = {
  connection: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  var _mongooseCache: MongooseCache | undefined
}

const cache = global._mongooseCache ?? { connection: null, promise: null }
global._mongooseCache = cache

export function isMongoConfigured() {
  return Boolean(uri?.trim())
}

export async function connectToDatabase() {
  if (!uri?.trim()) {
    throw new Error('MongoDB is not configured. Add MONGODB_URI to your environment.')
  }

  if (cache.connection) return cache.connection

  if (!cache.promise) {
    cache.promise = mongoose.connect(uri, { bufferCommands: false }).catch((error) => {
      cache.promise = null
      throw error
    })
  }

  cache.connection = await cache.promise
  return cache.connection
}
