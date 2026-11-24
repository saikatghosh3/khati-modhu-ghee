'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, CircleCheck, Clock3, Leaf, MapPin, PackageCheck, Phone, Search, Truck } from 'lucide-react'

type TrackedOrder = {
  orderNumber: string
  customerName: string
  phone: string
  address: string
  deliveryZone: 'dhaka' | 'outside'
  items: Array<{ title: string; quantity: number; price: number; weight: string; category: string; image: string }>
  subtotal: number
  deliveryCharge: number
  discount: number
  couponCode: string
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'fake'
  createdAt: string
}

const statusLabels: Record<TrackedOrder['status'], string> = {
  pending: 'অর্ডার গৃহীত',
  confirmed: 'অর্ডার নিশ্চিত',
  shipped: 'ডেলিভারির জন্য পাঠানো হয়েছে',
  delivered: 'ডেলিভারি সম্পন্ন',
  cancelled: 'অর্ডার বাতিল',
  fake: 'অর্ডার বাতিল',
}

const steps = ['pending', 'confirmed', 'shipped', 'delivered'] as const
const money = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`
const dateTime = (value: string) => new Intl.DateTimeFormat('bn-BD', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))

export function OrderTracker({ initialOrderNumber, initialPhone }: { initialOrderNumber: string; initialPhone: string }) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber)
  const [phone, setPhone] = useState(initialPhone)
  const [orders, setOrders] = useState<TrackedOrder[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const track = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const response = await fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber, phone }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not track order.')
      setOrders(result.orders as TrackedOrder[])
    } catch (caught) {
      setOrders([])
      setError(caught instanceof Error ? caught.message : 'Could not track order.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf8ef] px-4 pb-16 pt-8 text-[#17241d] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1c5539] hover:underline"><ArrowLeft className="size-4" /> হোমে ফিরে যান</Link>
        <div className="mt-6 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#143c2d] text-[#f4ce7b]"><Leaf className="size-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#aa7928]">ঘরকথা সার্ভিস</p><h1 className="text-2xl font-bold text-[#143c2d] sm:text-3xl">অর্ডার ট্র্যাক করুন</h1></div></div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#687168]">আপনার অর্ডার নম্বর এবং অর্ডার করা মোবাইল নম্বর দিয়ে ডেলিভারির বর্তমান অবস্থা দেখুন।</p>

        <form onSubmit={track} className="mt-7 rounded-2xl border border-[#e3d9c2] bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold text-[#4e5a50]">অর্ডার নম্বর<input required value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="GWH-XXXXXX-XXXXXX" className="h-12 rounded-xl border border-[#ded7c7] bg-[#fbfcf9] px-4 font-mono text-sm uppercase outline-none focus:border-[#5c8763]" /></label>
            <label className="grid gap-1.5 text-xs font-bold text-[#4e5a50]">মোবাইল নম্বর<input required value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="numeric" maxLength={11} placeholder="01XXXXXXXXX" className="h-12 rounded-xl border border-[#ded7c7] bg-[#fbfcf9] px-4 text-sm outline-none focus:border-[#5c8763]" /></label>
          </div>
          <button disabled={loading} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#143c2d] px-6 text-sm font-bold text-white transition hover:bg-[#20553f] disabled:opacity-60 sm:w-auto"><Search className="size-4" /> {loading ? 'খোঁজা হচ্ছে…' : 'অবস্থা দেখুন'}</button>
        </form>

        {error && <p role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p>}
        {searched && !loading && !error && orders.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-[#d8cfbb] bg-white px-6 py-12 text-center"><PackageCheck className="mx-auto size-8 text-[#9aa299]" /><h2 className="mt-4 font-bold text-[#294333]">কোনো অর্ডার পাওয়া যায়নি</h2><p className="mt-1 text-sm text-[#899289]">অর্ডার নম্বর ও মোবাইল নম্বর আবার যাচাই করে চেষ্টা করুন।</p></div>}

        <div className="mt-6 grid gap-5">
          {orders.map((order) => {
            const activeStep = steps.indexOf(order.status as (typeof steps)[number])
            const isCancelled = order.status === 'cancelled' || order.status === 'fake'
            return <section key={order.orderNumber} className="overflow-hidden rounded-2xl border border-[#e3d9c2] bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-[#eee6d5] bg-[#f8f4e8] p-5 sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#aa7928]">অর্ডার নম্বর</p><h2 className="mt-1 font-mono text-lg font-bold text-[#173c2a]">{order.orderNumber}</h2><p className="mt-1 text-xs text-[#899289]">{dateTime(order.createdAt)}</p></div><span className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${isCancelled ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>{statusLabels[order.status]}</span></div>

              <div className="p-5 sm:p-6">
                {isCancelled ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">এই অর্ডারটি বাতিল হয়েছে। সাহায্যের জন্য আমাদের মেসেজ করুন।</p> : <div className="grid gap-3 sm:grid-cols-4">{steps.map((step, index) => <div key={step} className="flex items-center gap-2"><span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${index <= activeStep ? 'bg-[#1d5a3b] text-white' : 'bg-[#edf0eb] text-[#9aa299]'}`}>{index < activeStep ? <CircleCheck className="size-4" /> : index + 1}</span><span className={`text-xs font-bold ${index <= activeStep ? 'text-[#244833]' : 'text-[#9aa299]'}`}>{statusLabels[step]}</span></div>)}</div>}

                <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
                  <div>
                    <h3 className="text-sm font-bold text-[#294333]">আপনার পণ্য</h3>
                    <div className="mt-3 divide-y divide-[#eee6d5] overflow-hidden rounded-xl border border-[#e9e1d0]">
                      {order.items.map((item, index) => <div key={`${item.title}-${index}`} className="flex items-center gap-3 p-3"><span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#f4efe2]">{item.image ? <Image src={item.image} alt="" width={56} height={56} className="size-14 object-cover" /> : <PackageCheck className="size-5 text-[#8a7754]" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#334538]">{item.title}</p><p className="mt-1 text-xs text-[#899289]">{item.weight || '—'} · পরিমাণ {item.quantity}</p></div><strong className="text-sm text-[#244833]">{money(item.price * item.quantity)}</strong></div>)}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-xl border border-[#e9e1d0] bg-[#fbfcf9] p-4 text-sm"><p className="flex items-start gap-2 font-semibold text-[#4e5f51]"><MapPin className="mt-0.5 size-4 shrink-0 text-[#3d7d51]" /> {order.address}</p><p className="mt-3 flex items-center gap-2 text-xs text-[#7b857b]"><Truck className="size-4 text-[#3d7d51]" /> {order.deliveryZone === 'dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'}</p><p className="mt-3 flex items-center gap-2 text-xs text-[#7b857b]"><Clock3 className="size-4 text-[#3d7d51]" /> সাধারণত ২–৪ কর্মদিবস</p></div>
                    <div className="rounded-xl border border-[#e9e1d0] bg-white p-4 text-sm">
                      <div className="flex justify-between text-[#697368]"><span>পণ্যের মূল্য</span><span>{money(order.subtotal)}</span></div>
                      <div className="mt-2 flex justify-between text-[#697368]"><span>ডেলিভারি</span><span>{order.deliveryCharge === 0 ? 'ফ্রি' : money(order.deliveryCharge)}</span></div>
                      {order.discount > 0 && <div className="mt-2 flex justify-between text-[#2f6b46]"><span>ডিসকাউন্ট {order.couponCode ? `(${order.couponCode})` : ''}</span><span>-{money(order.discount)}</span></div>}
                      <div className="mt-3 flex justify-between border-t border-[#eee6d5] pt-3 text-base font-bold text-[#173c2a]"><span>সর্বমোট</span><span>{money(order.total)}</span></div>
                    </div>
                    <a href={`tel:${order.phone}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dcd3bf] text-sm font-bold text-[#1c5539]"><Phone className="size-4" /> কল করুন</a>
                  </div>
                </div>
              </div>
            </section>
          })}
        </div>
      </div>
    </main>
  )
}
