import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { ReviewModel } from '@/models/Review'

export type ReviewStatus = 'pending' | 'published' | 'hidden'

export type StoreReview = {
  id: string
  name: string
  location: string
  rating: number
  title: string
  comment: string
  createdAt: string
}

export type AdminReview = StoreReview & {
  phone: string
  status: ReviewStatus
  featured: boolean
  sortOrder: number
  updatedAt: string
}

const toDateString = (value: unknown) => new Date(value as string | number | Date).toISOString()

export function toStoreReview(record: Record<string, unknown>): StoreReview {
  return {
    id: String(record._id),
    name: String(record.name),
    location: String(record.location ?? ''),
    rating: Number(record.rating),
    title: String(record.title ?? ''),
    comment: String(record.comment),
    createdAt: toDateString(record.createdAt),
  }
}

export function toAdminReview(record: Record<string, unknown>): AdminReview {
  return {
    ...toStoreReview(record),
    phone: String(record.phone ?? ''),
    status: (['pending', 'published', 'hidden'].includes(String(record.status)) ? record.status : 'pending') as ReviewStatus,
    featured: Boolean(record.featured),
    sortOrder: Number(record.sortOrder ?? 0),
    updatedAt: toDateString(record.updatedAt),
  }
}

export const PREVIEW_REVIEWS: StoreReview[] = [
  {
    id: 'preview-review-1',
    name: 'সুমাইয়া আক্তার',
    location: 'ঢাকা',
    rating: 5,
    title: 'আসল মধুর স্বাদ পেলাম',
    comment: 'অর্ডার দিয়ে ভাবছিলাম সাধারণ মধু হবে—কিন্তু বয়াম খোলার সাথে সাথেই গন্ধে বুঝলাম এটা আসল। ঘন, পরিষ্কার আর মুখে লেগে থাকে। ক্যাশ অন ডেলিভারিও ছিল ঝটপট।',
    createdAt: '2026-10-18T10:30:00.000Z',
  },
  {
    id: 'preview-review-2',
    name: 'মোঃ রাশেদুল ইসলাম',
    location: 'চট্টগ্রাম',
    rating: 5,
    title: 'শৈশবের ঘির স্বাদ ফিরে পেলাম',
    comment: 'মায়ের রান্নার গন্ধ মনে পড়ে গেল এই ঘি দিয়ে রান্না করে। রঙ সোনালি, সুবাস খাঁটি—পড়াশোনার নাশতায় দিয়ে বাচ্চারা দুইবার করে খেয়েছে। পরের বার অবশ্যই আবার অর্ডার দেব।',
    createdAt: '2026-10-12T16:45:00.000Z',
  },
  {
    id: 'preview-review-3',
    name: 'ফারজানা ইয়াসমিন',
    location: 'নারায়ণগঞ্জ',
    rating: 4,
    title: 'প্যাকেজিং দারুণ, পণ্য পরিচ্ছন্ন',
    comment: 'বয়াম ভেঙে পৌঁছায়নি, সিল একদম আগের মতোই ছিল। মধু খেয়ে ভালো লাগলো, শুধু ডেলিভারি দুই দিন দেরি হয়েছিল—তবে পণ্যের মানের কারণে অভিযোগ নেই।',
    createdAt: '2026-09-29T09:15:00.000Z',
  },
  {
    id: 'preview-review-4',
    name: 'আব্দুল্লাহ আল মামুন',
    location: 'পাবনা',
    rating: 5,
    title: 'বিশ্বস্ত উৎস, নিশ্চিন্তে খাচ্ছি',
    comment: 'আমরা পাবনায় থাকি, তাই উৎসের কথা শুনে অর্ডার দিয়েছিলাম। ঘি একদম গাওয়া—কচুতে দিলে আলাদা করে বুঝা যায়। দামও সাজুক, যোগাযোগও ছিল ভালো।',
    createdAt: '2026-09-20T12:00:00.000Z',
  },
  {
    id: 'preview-review-5',
    name: 'শারমিন সুলতানা',
    location: 'সিলেট',
    rating: 5,
    title: 'উপহার দেওয়ার মতো সুন্দর',
    comment: 'বাড়ির বড়দের জন্য উপহার হিসেবে কিনেছিলাম। বয়াম ও প্যাকিং দেখে সবাই প্রশংসা করেছে। ভেতরের মধুও তেমনি খাঁটি—এক কথায় সন্তুষ্ট।',
    createdAt: '2026-09-08T18:20:00.000Z',
  },
  {
    id: 'preview-review-6',
    name: 'তানভীর হোসেন',
    location: 'গাজীপুর',
    rating: 4,
    title: 'মূল্যের সাথে মান মিলেছে',
    comment: 'প্রথমবার অর্ডার করলাম, অভিজ্ঞতা ভালো। অর্ডার নম্বর দিয়ে ট্র্যাকও করতে পেরেছি। মধু একটু কম মিষ্টি লাগলো, তবে স্বাদ প্রাকৃতিক—বেশ ভালো।',
    createdAt: '2026-08-27T14:10:00.000Z',
  },
]

export const DEFAULT_REVIEWS: Omit<StoreReview, 'id'>[] = PREVIEW_REVIEWS.map(({ id: _id, ...review }) => review)

export const DEFAULT_REVIEW_RECORDS = DEFAULT_REVIEWS.map((review, index) => ({
  ...review,
  status: 'published' as ReviewStatus,
  featured: index === 0,
  sortOrder: index + 1,
}))

let seedPromise: Promise<void> | null = null

export function ensureSeedReviews(): Promise<void> {
  if (!isMongoConfigured()) return Promise.resolve()
  if (!seedPromise) {
    seedPromise = (async () => {
      await connectToDatabase()
      if (await ReviewModel.countDocuments() === 0) {
        await ReviewModel.insertMany(DEFAULT_REVIEW_RECORDS)
      }
    })().catch((error) => {
      seedPromise = null
      throw error
    })
  }
  return seedPromise
}

async function loadReviews(publishedOnly: true): Promise<StoreReview[]>
async function loadReviews(publishedOnly: false): Promise<AdminReview[]>
async function loadReviews(publishedOnly: boolean): Promise<StoreReview[] | AdminReview[]> {
  if (!isMongoConfigured()) return publishedOnly ? PREVIEW_REVIEWS : []

  await ensureSeedReviews()
  const records = publishedOnly
    ? await ReviewModel.find({ status: 'published' }).sort({ featured: -1, sortOrder: 1, createdAt: -1 }).limit(50).lean()
    : await ReviewModel.find().sort({ createdAt: -1 }).limit(250).lean()

  return publishedOnly
    ? records.map((record) => toStoreReview(record as Record<string, unknown>))
    : records.map((record) => toAdminReview(record as Record<string, unknown>))
}

export function getStoreReviews(): Promise<StoreReview[]> {
  return loadReviews(true)
}

export function getAllReviews(): Promise<AdminReview[]> {
  return loadReviews(false)
}
