import type { Metadata } from 'next'
import { OrderTracker } from '@/components/order-tracker'

export const metadata: Metadata = { title: 'অর্ডার ট্র্যাক | ঘরকথা' }

export default async function TrackPage({ searchParams }: { searchParams: Promise<{ order?: string; phone?: string }> }) {
  const params = await searchParams
  return <OrderTracker initialOrderNumber={params.order ?? ''} initialPhone={params.phone ?? ''} />
}
