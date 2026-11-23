export type ProductCategory = 'honey' | 'ghee'

export type StorePackage = {
  id: string
  category: ProductCategory
  title: string
  description: string
  weight: string
  image: string
  price: number
  originalPrice: number
  badge: string
  freeDelivery: boolean
  active: boolean
  sortOrder: number
}

export const SECTION_IMAGES: Record<ProductCategory, string> = {
  honey: '/images/honey-banner.jpg',
  ghee: '/images/ghee-banner.jpg',
}

export const PRODUCT_IMAGES: { path: string; label: string; category: ProductCategory }[] = [
  { path: '/images/honey-glass-jar.jpg', label: 'মধু — কাচের বয়াম', category: 'honey' },
  { path: '/images/honey-dipper.jpg', label: 'মধু — ডিপার', category: 'honey' },
  { path: '/images/honeycomb.jpg', label: 'মধু — হানিকম্ব', category: 'honey' },
  { path: '/images/ghee-glass-jar.jpg', label: 'ঘি — কাচের বয়াম', category: 'ghee' },
  { path: '/images/ghee-bowl.jpg', label: 'ঘি — পিতলের বাটি', category: 'ghee' },
  { path: '/images/ghee-tin.jpg', label: 'ঘি — টিন প্যাক', category: 'ghee' },
]

export const DEFAULT_IMAGE: Record<ProductCategory, string> = {
  honey: PRODUCT_IMAGES[0].path,
  ghee: PRODUCT_IMAGES[3].path,
}

export const UPLOAD_IMAGE_PREFIX = '/api/uploads/'

const LEGACY_IMAGE_MAP: Record<string, string> = {
  '/images/honey-glass-jar.svg': '/images/honey-glass-jar.jpg',
  '/images/honey-dipper.svg': '/images/honey-dipper.jpg',
  '/images/honeycomb.svg': '/images/honeycomb.jpg',
  '/images/ghee-glass-jar.svg': '/images/ghee-glass-jar.jpg',
  '/images/ghee-bowl.svg': '/images/ghee-bowl.jpg',
  '/images/ghee-tin.svg': '/images/ghee-tin.jpg',
}

export function resolveProductImage(value: unknown, category: ProductCategory): string {
  if (isValidProductImage(value)) return value
  if (typeof value === 'string' && LEGACY_IMAGE_MAP[value]) return LEGACY_IMAGE_MAP[value]
  return DEFAULT_IMAGE[category]
}

export function isProductCategory(value: unknown): value is ProductCategory {
  return value === 'honey' || value === 'ghee'
}

export function isValidProductImage(value: unknown): value is string {
  if (typeof value !== 'string') return false
  if (PRODUCT_IMAGES.some((image) => image.path === value)) return true
  if (!value.startsWith(UPLOAD_IMAGE_PREFIX)) return false
  return /^[a-f0-9]{24}$/i.test(value.slice(UPLOAD_IMAGE_PREFIX.length))
}

export const DEFAULT_PACKAGES: Omit<StorePackage, 'id'>[] = [
  {
    category: 'honey',
    title: 'সুন্দরবনের মধু ২৫০ গ্রাম',
    description: 'মৌচাক থেকে সংগৃহীত হালকা স্বাদের খাঁটি মধু—সকালের নাশতার সঙ্গী।',
    weight: '২৫০ গ্রাম',
    image: '/images/honey-glass-jar.jpg',
    price: 620,
    originalPrice: 750,
    badge: 'প্রথম পছন্দ',
    freeDelivery: false,
    active: true,
    sortOrder: 1,
  },
  {
    category: 'honey',
    title: 'খাঁটি মধু ৫০০ গ্রাম',
    description: 'ঘন স্বাদ আর প্রাকৃতিক ঘ্রাণে ভরপুর, পরিবারের জন্য উপযোগী বয়াম।',
    weight: '৫০০ গ্রাম',
    image: '/images/honey-dipper.jpg',
    price: 1150,
    originalPrice: 1350,
    badge: 'বেস্ট সেলার',
    freeDelivery: true,
    active: true,
    sortOrder: 2,
  },
  {
    category: 'honey',
    title: 'হানিকম্ব মধু ১ কেজি',
    description: 'মৌচাকের প্রাকৃতিক মধু, বেশি পরিমাণে কম দামে—ফ্রি ডেলিভারি সহ।',
    weight: '১ কেজি',
    image: '/images/honeycomb.jpg',
    price: 2150,
    originalPrice: 2500,
    badge: 'ফ্যামিলি সাইজ',
    freeDelivery: true,
    active: true,
    sortOrder: 3,
  },
  {
    category: 'honey',
    title: 'সুন্দরবন স্পেশাল মধু ৩৫০ গ্রাম',
    description: 'সুন্দরবনের মৌয়ালদের হাতে সংগৃহীত, হালকা স্বাদ আর প্রাকৃতিক ঘ্রাণে ভরপুর।',
    weight: '৩৫০ গ্রাম',
    image: '/images/honey-glass-jar.jpg',
    price: 850,
    originalPrice: 1000,
    badge: 'নতুন',
    freeDelivery: false,
    active: true,
    sortOrder: 4,
  },
  {
    category: 'honey',
    title: 'মৌচাক হানিকম্ব ৫০০ গ্রাম',
    description: 'প্রাকৃতিক মৌচাকের টুকরাসহ মধু—উপহার হিসেবেও দিতে পারেন পরিচিতজনকে।',
    weight: '৫০০ গ্রাম',
    image: '/images/honeycomb.jpg',
    price: 1350,
    originalPrice: 1550,
    badge: 'প্রিমিয়াম',
    freeDelivery: true,
    active: true,
    sortOrder: 5,
  },
  {
    category: 'honey',
    title: 'ডিপারসহ খাঁটি মধু ১ কেজি',
    description: 'বড় বয়াম, সঙ্গে কাঠের ডিপার—দৈনিক ব্যবহারে সুবিধাজনক আর ক্রয়ে সাশ্রয়ী।',
    weight: '১ কেজি',
    image: '/images/honey-dipper.jpg',
    price: 2250,
    originalPrice: 2600,
    badge: 'গিফট প্যাক',
    freeDelivery: true,
    active: true,
    sortOrder: 6,
  },
  {
    category: 'ghee',
    title: 'গাওয়া ঘি ২৫০ গ্রাম',
    description: 'দেশি গরুর দুধ থেকে তৈরি ছোট বয়াম—চা ও রুটির স্বাদ বাড়ায়।',
    weight: '২৫০ গ্রাম',
    image: '/images/ghee-bowl.jpg',
    price: 520,
    originalPrice: 620,
    badge: 'ছোট বয়াম',
    freeDelivery: false,
    active: true,
    sortOrder: 1,
  },
  {
    category: 'ghee',
    title: 'গাওয়া ঘি ৫০০ গ্রাম',
    description: 'পাবনা-সিরাজগঞ্জের খামার থেকে আসা ঐতিহ্যবাহী ঘি, দৈনিক রান্নার জন্য।',
    weight: '৫০০ গ্রাম',
    image: '/images/ghee-glass-jar.jpg',
    price: 980,
    originalPrice: 1150,
    badge: 'বেস্ট সেলার',
    freeDelivery: true,
    active: true,
    sortOrder: 2,
  },
  {
    category: 'ghee',
    title: 'গাওয়া ঘি ১ কেজি',
    description: 'বড় পরিবারের জন্য সাশ্রয়ী প্যাক—খাঁটি স্বাদ, নিরাপদ প্যাকেজিং।',
    weight: '১ কেজি',
    image: '/images/ghee-tin.jpg',
    price: 1850,
    originalPrice: 2200,
    badge: 'ফ্যামিলি সাইজ',
    freeDelivery: true,
    active: true,
    sortOrder: 3,
  },
  {
    category: 'ghee',
    title: 'দেশি ঘি স্পেশাল ৩৫০ গ্রাম',
    description: 'দেশি গরুর দুধ থেকে তৈরি ছোট প্যাক—নাশতা ও রান্নার জন্য দারুণ।',
    weight: '৩৫০ গ্রাম',
    image: '/images/ghee-glass-jar.jpg',
    price: 720,
    originalPrice: 850,
    badge: 'নতুন',
    freeDelivery: false,
    active: true,
    sortOrder: 4,
  },
  {
    category: 'ghee',
    title: 'পিতলের বাটি ঘি ৫০০ গ্রাম',
    description: 'ঐতিহ্যবাহী পদ্ধতিতে তৈরি ঘি, সুবাস আর স্বাদে ভরপুর।',
    weight: '৫০০ গ্রাম',
    image: '/images/ghee-bowl.jpg',
    price: 1080,
    originalPrice: 1250,
    badge: 'ট্রাডিশনাল',
    freeDelivery: true,
    active: true,
    sortOrder: 5,
  },
  {
    category: 'ghee',
    title: 'গাওয়া ঘি ২ কেজি টিন',
    description: 'মানিব্যাগে সাশ্রয়ী বড় প্যাক—পুরো পরিবারের রান্নার জন্য উপযোগী।',
    weight: '২ কেজি',
    image: '/images/ghee-tin.jpg',
    price: 3450,
    originalPrice: 3900,
    badge: 'বড় প্যাক',
    freeDelivery: true,
    active: true,
    sortOrder: 6,
  },
]

export const PREVIEW_PACKAGES: StorePackage[] = DEFAULT_PACKAGES.map((item, index) => ({
  ...item,
  id: `preview-package-${index + 1}`,
}))
