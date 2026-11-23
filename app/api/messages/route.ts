import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin-auth'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { MessageModel } from '@/models/Message'

const phonePattern = /^01[3-9]\d{8}$/

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Not authorized. Please sign in again.' }, { status: 401 })
  }
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: 'MongoDB is not configured.' }, { status: 503 })
  }

  try {
    await connectToDatabase()
    const messages = await MessageModel.find().sort({ createdAt: -1 }).limit(100).lean()
    return NextResponse.json({ messages: messages.map((message) => ({
      id: String(message._id),
      name: message.name,
      phone: message.phone,
      message: message.message,
      createdAt: new Date(message.createdAt).toISOString(),
    })) })
  } catch {
    return NextResponse.json({ error: 'Could not load messages. Check your MongoDB connection.' }, { status: 503 })
  }
}

export async function POST(request: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json({ error: 'মেসেজ সংরক্ষণ করতে MongoDB সংযোগ প্রয়োজন।' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'সঠিক তথ্য পাঠান।' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'সঠিক তথ্য পাঠান।' }, { status: 400 })
  }

  const input = body as Record<string, unknown>
  const name = typeof input.name === 'string' ? input.name.trim() : ''
  const phone = typeof input.phone === 'string' ? input.phone.trim() : ''
  const message = typeof input.message === 'string' ? input.message.trim() : ''

  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: 'নাম ২ থেকে ১০০ অক্ষরের মধ্যে লিখুন।' }, { status: 400 })
  }
  if (!phonePattern.test(phone)) {
    return NextResponse.json({ error: 'সঠিক ১১ সংখ্যার মোবাইল নম্বর লিখুন।' }, { status: 400 })
  }
  if (message.length < 5 || message.length > 1000) {
    return NextResponse.json({ error: 'মেসেজ ৫ থেকে ১০০০ অক্ষরের মধ্যে লিখুন।' }, { status: 400 })
  }

  try {
    await connectToDatabase()
    await MessageModel.create({ name, phone, message })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'মেসেজটি পাঠানো যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন।' }, { status: 503 })
  }
}
