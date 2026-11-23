import {
  DEFAULT_PACKAGES,
  PREVIEW_PACKAGES,
  isProductCategory,
  resolveProductImage,
  type ProductCategory,
  type StorePackage,
} from '@/lib/catalog'
import { connectToDatabase, isMongoConfigured } from '@/lib/db'
import { PackageModel } from '@/models/Package'

function toStorePackage(record: Record<string, unknown>): StorePackage {
  const rawCategory = record.category
  const category: ProductCategory = isProductCategory(rawCategory)
    ? rawCategory
    : String(record.honeyWeight ?? '') === 'নেই' ? 'ghee' : 'honey'
  const legacyWeight = category === 'honey' ? record.honeyWeight : record.gheeWeight
  const image = resolveProductImage(record.image, category)

  return {
    id: String(record._id),
    category,
    title: String(record.title),
    description: String(record.description),
    weight: String(record.weight || legacyWeight || ''),
    image,
    price: Number(record.price),
    originalPrice: Number(record.originalPrice),
    badge: String(record.badge ?? ''),
    freeDelivery: Boolean(record.freeDelivery),
    active: Boolean(record.active),
    sortOrder: Number(record.sortOrder ?? 0),
  }
}

async function loadPackages(activeOnly: boolean): Promise<StorePackage[]> {
  if (!isMongoConfigured()) return PREVIEW_PACKAGES

  await connectToDatabase()
  if (await PackageModel.countDocuments() === 0) {
    await PackageModel.insertMany(DEFAULT_PACKAGES)
  }

  const records = await PackageModel.find(activeOnly ? { active: true } : {})
    .sort({ category: 1, sortOrder: 1, createdAt: 1 })
    .lean()
  return records.map((record) => toStorePackage(record as Record<string, unknown>))
}

export function getStorePackages(): Promise<StorePackage[]> {
  return loadPackages(true)
}

export function getAllPackages(): Promise<StorePackage[]> {
  return loadPackages(false)
}
