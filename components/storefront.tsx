'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Leaf,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { SECTION_IMAGES, type ProductCategory, type StorePackage } from '@/lib/catalog'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

type CartLine = StorePackage & { quantity: number }
type DeliveryZone = 'dhaka' | 'outside'

const taka = (amount: number) => `৳${new Intl.NumberFormat('bn-BD').format(amount)}`

const benefits = [
  {
    icon: Leaf,
    title: 'খাঁটি ও ভেজালমুক্ত',
    description: 'কোনো কৃত্রিয় রং বা ফ্লেভার নয়—প্রাকৃতিক স্বাদ আর ঘ্রাণই আমাদের পরিচয়।',
  },
  {
    icon: MapPin,
    title: 'বিশ্বস্ত উৎস থেকে',
    description: 'সুন্দরবনের মৌয়াল ও পাবনা-সিরাজগঞ্জের দুগ্ধ খামার থেকে যত্নে সংগ্রহ।',
  },
  {
    icon: ShieldCheck,
    title: 'যত্নে প্যাক করা',
    description: 'প্রতিটি অর্ডার প্যাক করা হয় নিরাপদে, যেন পণ্য পৌঁছায় সতেজ ও অক্ষত।',
  },
]

const questions = [
  {
    question: 'পণ্য হাতে পেয়ে কি টাকা দিতে পারব?',
    answer: 'অবশ্যই। আমরা সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা দিই—পণ্য বুঝে পাওয়ার পর টাকা দিন।',
  },
  {
    question: 'ডেলিভারি চার্জ কত?',
    answer: 'ঢাকার ভেতরে ৳৬০ এবং ঢাকার বাইরে ৳১২০। ফ্রি ডেলিভারি লেখা পণ্যে কোনো ডেলিভারি চার্জ নেই।',
  },
  {
    question: 'অর্ডার পৌঁছাতে কত দিন লাগে?',
    answer: 'ঢাকায় সাধারণত ১–২ কর্মদিবস এবং ঢাকার বাইরে ২–৪ কর্মদিবসের মধ্যে পৌঁছে যায়।',
  },
  {
    question: 'মধু আর ঘি কীভাবে চিনব?',
    answer: 'প্রতিটি পণ্যের ছবি, ওজন ও বিবরণ পণ্যের কার্ডে স্পষ্টভাবে দেখানো আছে। মধু ও ঘি আলাদা সেকশনে বেছে নিতে পারবেন।',
  },
]

export function Storefront({ packages }: { packages: StorePackage[] }) {
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [zone, setZone] = useState<DeliveryZone>('dhaka')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [receipt, setReceipt] = useState<{ orderNumber: string; total: number; phone: string } | null>(null)

  const honeyProducts = packages.filter((product) => product.category === 'honey')
  const gheeProducts = packages.filter((product) => product.category === 'ghee')
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const freeDelivery = cart.some((item) => item.freeDelivery)
  const deliveryCharge = freeDelivery ? 0 : zone === 'dhaka' ? 60 : 120
  const total = subtotal + deliveryCharge

  useEffect(() => {
    if (!cartOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCartOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [cartOpen])

  const addToCart = (product: StorePackage) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) return current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(10, item.quantity + 1) } : item)
      return [...current, { ...product, quantity: 1 }]
    })
    setCheckoutError('')
    setCartOpen(true)
  }

  const changeQuantity = (id: string, amount: number) => {
    setCart((current) => current.flatMap((item) => {
      if (item.id !== id) return [item]
      const quantity = item.quantity + amount
      return quantity > 0 ? [{ ...item, quantity: Math.min(10, quantity) }] : []
    }))
  }

  const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setCheckoutError('')

    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = {
      customerName: String(formData.get('customerName') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      address: String(formData.get('address') ?? '').trim(),
      deliveryZone: zone,
      items: cart.map((item) => ({ packageId: item.id, quantity: item.quantity })),
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'অর্ডার জমা হয়নি। আবার চেষ্টা করুন।')
      setReceipt({ orderNumber: result.orderNumber, total: result.total, phone: payload.phone })
      setCart([])
      setCartOpen(false)
      form.reset()
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : 'অর্ডার জমা হয়নি। আবার চেষ্টা করুন।')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf8ef] pt-[100px] text-[#17241d] lg:pt-[112px]">
      <SiteHeader itemCount={itemCount} onCartOpen={() => setCartOpen(true)} />

      <section id="home" className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-6 sm:px-6 sm:pb-20 sm:pt-10 lg:grid-cols-[1.03fr_.97fr] lg:gap-14 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[#d9cba7] bg-[#f4eddc] px-3 py-1.5 text-[10px] font-semibold text-[#765c28] sm:mb-6 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"><Sparkles className="size-3 text-[#c8942f] sm:size-4" /> প্রকৃতির কাছ থেকে, আপনার পরিবারের জন্য</div>
          <h1 className="text-[1.75rem] font-bold leading-[1.28] tracking-tight text-[#143c2d] sm:text-3xl sm:leading-[1.18] lg:text-[3rem]">
            প্রতিটি চামচে <span className="text-[#bd8425]">খাঁটি স্বাদ,</span><br className="hidden sm:block" /> পরিবারের জন্য প্রকৃতির যত্ন
          </h1>
          <p className="mt-4 max-w-xl text-[13px] leading-6 text-[#5e6a60] sm:mt-6 sm:text-base sm:leading-8 lg:text-lg">
            পাবনা-সিরাজগঞ্জের গাওয়া ঘি আর সুন্দরবনের মধু—চেনা উৎস থেকে সংগৃহীত, যত্নে পৌঁছে যাবে আপনার দরজায়।
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
            <a href="#honey" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#143c2d] px-5 text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(20,60,45,.8)] transition hover:-translate-y-0.5 hover:bg-[#20553f] sm:min-h-14 sm:px-7">মধু ও ঘি দেখুন <ArrowRight className="ml-2 size-4" /></a>
            <a href="#our-story" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-[#526158] transition hover:text-[#143c2d] sm:min-h-14 sm:px-5">আমাদের পণ্য জানুন <ArrowDown className="size-4" /></a>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#d8cfbb] pt-4 text-[11px] font-medium text-[#516057] sm:mt-9 sm:gap-x-6 sm:gap-y-3 sm:pt-6 sm:text-sm">
            <span className="inline-flex items-center gap-1.5"><CircleCheck className="size-3.5 text-[#57855d] sm:size-4" /> খাঁটি ও যত্নে সংগ্রহ</span>
            <span className="inline-flex items-center gap-1.5"><CircleCheck className="size-3.5 text-[#57855d] sm:size-4" /> হাতে পেয়ে মূল্য পরিশোধ</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[420px] lg:max-w-none">
          <div className="absolute -right-4 -top-4 size-20 rounded-full bg-[#ecd99e]/50 blur-2xl sm:-right-5 sm:-top-6 sm:size-44" />
          <div className="relative aspect-[1.15/1] overflow-hidden rounded-[1.5rem] border-[6px] border-white bg-[#efe7d3] shadow-[0_24px_60px_-38px_rgba(39,54,38,.45)] sm:aspect-[1.05/1] sm:rounded-[2.5rem] sm:border-[14px]">
            <Image src="/ghee-honey-set.png" alt="ঘরকথার কাচের বয়ামে গাওয়া ঘি ও সুন্দরবনের মধু" fill priority sizes="(max-width: 768px) 92vw, 48vw" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#192c20]/65 via-[#192c20]/15 to-transparent px-4 pb-4 pt-12 text-white sm:px-8 sm:pb-8 sm:pt-20">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-2.5 py-1.5 text-[10px] font-semibold backdrop-blur sm:px-3 sm:text-xs"><Star className="size-3 fill-[#f3c46a] text-[#f3c46a] sm:size-3.5" /> আপনার ঘরের আপন স্বাদ</span>
            </div>
          </div>
          <div className="absolute -bottom-2 left-0 flex origin-bottom-left scale-90 items-center gap-2 rounded-xl border border-[#eadfc5] bg-white px-3 py-2 shadow-lg sm:-bottom-4 sm:-left-7 sm:scale-100 sm:gap-3 sm:rounded-2xl sm:px-5 sm:py-4">
            <span className="grid size-8 place-items-center rounded-lg bg-[#f6edd9] text-[#a57924] sm:size-10 sm:rounded-xl"><PackageCheck className="size-4 sm:size-5" /></span>
            <span><span className="block text-[11px] font-bold text-[#183e2c] sm:text-sm">নিরাপদ প্যাকেজিং</span><span className="block text-[10px] text-[#7b8279] sm:text-xs">সতেজতা থাকুক অটুট</span></span>
          </div>
          <div className="absolute -right-2 top-3 hidden rounded-2xl bg-[#143c2d] px-4 py-3 text-white shadow-lg sm:block sm:-right-4 sm:top-10">
            <span className="block text-2xl font-bold text-[#e7bb64]">১০০%</span><span className="text-[11px] text-white/75">প্রাকৃতিক স্বাদ</span>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7ddc7] bg-[#f4efdf]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-4 py-5 sm:grid-cols-4 sm:gap-4 sm:px-6 sm:py-7 lg:px-8">
          {[
            ['বিশ্বস্ত উৎস', 'সুন্দরবন ও পাবনা'],
            ['ঘরের স্বাদ', 'প্রাকৃতিক উপাদান'],
            ['সহজ অর্ডার', 'এক ধাপেই নিশ্চিত'],
            ['নিরাপদ পেমেন্ট', 'ক্যাশ অন ডেলিভারি'],
          ].map(([title, caption]) => <div className="text-center" key={title}><p className="text-sm font-bold text-[#143c2d] sm:text-lg lg:text-xl">{title}</p><p className="mt-0.5 text-[10px] text-[#777365] sm:mt-1 sm:text-sm">{caption}</p></div>)}
        </div>
      </section>

      <ProductSection category="honey" products={honeyProducts} onAdd={addToCart} />
      <ProductSection category="ghee" products={gheeProducts} onAdd={addToCart} />

      <section id="our-story" className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#aa7928] sm:text-xs sm:tracking-[0.22em]">আমাদের অঙ্গীকার</span>
          <h2 className="mt-2 text-[1.4rem] font-bold text-[#143c2d] sm:mt-3 sm:text-3xl lg:text-4xl">বিশুদ্ধতার স্বাদে ফিরে যাই শেকড়ে</h2>
          <p className="mt-3 text-xs leading-6 text-[#657066] sm:mt-4 sm:text-sm sm:leading-7 lg:text-base">খাবারের স্বাদ শুধু উপকরণে নয়—তার উৎস আর যত্নেও। তাই আমরা বেছে নিই পরিচিত মানুষ, পরিচিত মাটি, আর পরিচিত পদ্ধতি।</p>
        </div>
        <div className="mt-6 grid gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-5">
          {benefits.map(({ icon: Icon, title, description }, index) => <article key={title} className="rounded-[1.35rem] border border-[#e7ddc7] bg-white/75 p-4 sm:rounded-[1.75rem] sm:p-7">
            <span className={`grid size-10 place-items-center rounded-xl sm:size-12 sm:rounded-2xl ${index === 1 ? 'bg-[#f6ecd2] text-[#a57825]' : 'bg-[#e8f0e4] text-[#37704b]'}`}><Icon className="size-4 sm:size-5" /></span>
            <h3 className="mt-4 text-base font-bold text-[#193d2d] sm:mt-5 sm:text-xl">{title}</h3>
            <p className="mt-1.5 text-xs leading-6 text-[#687168] sm:mt-2 sm:text-sm sm:leading-7">{description}</p>
          </article>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-3 pb-10 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="grid gap-6 rounded-[1.5rem] bg-[#f0e8d5] p-5 sm:rounded-[2rem] sm:p-9 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:p-12">
          <div><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#aa7928] sm:text-xs">ঘরের মানুষের জন্য</span><h2 className="mt-2 text-[1.4rem] font-bold leading-tight text-[#143c2d] sm:mt-3 sm:text-3xl lg:text-4xl">অর্ডার থেকে ডেলিভারি—সবই সহজ</h2><p className="mt-3 text-xs leading-6 text-[#687168] sm:mt-4 sm:text-sm sm:leading-7">আপনার পছন্দের মধু বা ঘি বেছে নিন, ঠিকানা দিন, আর পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।</p><a href="#honey" className="mt-4 inline-flex items-center text-sm font-bold text-[#1c5539] sm:mt-6">পণ্যগুলো দেখুন <ArrowRight className="ml-2 size-4" /></a></div>
          <div className="grid gap-2.5 sm:grid-cols-3 sm:gap-3">
            {[
              { n: '০১', icon: ShoppingBag, title: 'পণ্য বেছে নিন', text: 'মধু বা ঘি কার্টে যোগ করুন' },
              { n: '০২', icon: MapPin, title: 'ঠিকানা লিখুন', text: 'নাম, মোবাইল ও ডেলিভারি ঠিকানা দিন' },
              { n: '০৩', icon: Check, title: 'হাতে পেয়ে দিন', text: 'পণ্য বুঝে নিয়ে ক্যাশে মূল্য দিন' },
            ].map(({ n, icon: Icon, title, text }) => <div key={n} className="rounded-xl border border-[#dfd3b8] bg-[#fbf8ef] p-4 sm:rounded-2xl sm:p-5"><span className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-lg bg-[#e8f0e4] text-[#286144] sm:size-10 sm:rounded-xl"><Icon className="size-4" /></span><span className="text-lg font-bold text-[#d5bd88] sm:text-xl">{n}</span></span><h3 className="mt-4 text-sm font-bold text-[#193d2d] sm:mt-5 sm:text-base">{title}</h3><p className="mt-1 text-[11px] leading-5 text-[#777c71] sm:text-xs">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7ddc7] bg-[#f4efdf] px-3 py-10 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 sm:gap-9 lg:grid-cols-[.8fr_1.2fr]">
          <div><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#aa7928] sm:text-xs sm:tracking-[0.22em]">আপনার প্রশ্নের উত্তর</span><h2 className="mt-2 text-[1.4rem] font-bold text-[#143c2d] sm:mt-3 sm:text-3xl lg:text-4xl">জানুন, তারপর নিশ্চিন্তে অর্ডার করুন</h2><p className="mt-3 text-xs leading-6 text-[#687168] sm:mt-4 sm:text-sm sm:leading-7">অর্ডার করার আগে আরও কিছু জানতে চাইলে আমাদের প্রশ্নোত্তর দেখুন।</p></div>
          <div id="faq" className="divide-y divide-[#ddd3bc] rounded-[1.35rem] border border-[#e0d6be] bg-[#fbf8ef] px-4 sm:rounded-[1.5rem] sm:px-7">
            {questions.map(({ question, answer }) => <details key={question} className="group py-4 sm:py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#213c2c] marker:hidden sm:gap-4"><span>{question}</span><ChevronDown className="size-4 shrink-0 text-[#9d772f] transition group-open:rotate-180" /></summary>
              <p className="max-w-2xl pt-3 text-xs leading-6 text-[#6d756b] sm:text-sm sm:leading-7">{answer}</p>
            </details>)}
          </div>
        </div>
      </section>

      <SiteFooter />

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-[#e2d7bf] bg-[#fbf8ef]/95 p-2 backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1"><span className="block text-[10px] text-[#777c71]">মধু ও ঘি</span><span className="block truncate text-xs font-bold text-[#143c2d]">ক্যাশ অন ডেলিভারি</span></div>
        <a href="#honey" className="inline-flex min-h-10 items-center rounded-full bg-[#d99f39] px-4 text-xs font-bold text-[#183622]">অর্ডার করুন</a>
        <button onClick={() => setCartOpen(true)} className="relative grid size-10 shrink-0 place-items-center rounded-full bg-[#143c2d] text-white" aria-label="কার্ট খুলুন"><ShoppingBag className="size-4" />{itemCount > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#d59c34] text-[9px] font-bold">{itemCount}</span>}</button>
      </div>

      {cartOpen && <div className="fixed inset-0 z-50 flex justify-end">
        <button aria-label="কার্ট বন্ধ করুন" className="absolute inset-0 cursor-default bg-[#0d1b13]/55 backdrop-blur-[2px]" onClick={() => setCartOpen(false)} />
        <aside role="dialog" aria-modal="true" aria-labelledby="cart-title" className="relative flex h-full w-full max-w-[520px] flex-col bg-[#fbf8ef] shadow-2xl animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between border-b border-[#e4dbc6] px-5 py-4 sm:px-7">
            <div><h2 id="cart-title" className="text-xl font-bold text-[#143c2d] sm:text-2xl">আপনার কার্ট</h2><p className="mt-1 text-xs text-[#777c71]">{itemCount}টি পণ্য বেছে নিয়েছেন</p></div>
            <button onClick={() => setCartOpen(false)} className="grid size-9 place-items-center rounded-full border border-[#d9cfb8] text-[#546056] transition hover:bg-[#f0e8d5] sm:size-10" aria-label="কার্ট বন্ধ করুন"><X className="size-4" /></button>
          </div>
          {cart.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-[#e8f0e4] text-[#286144]"><ShoppingBag className="size-7" /></span>
            <h3 className="mt-5 text-xl font-bold text-[#143c2d]">আপনার কার্ট এখনো খালি</h3><p className="mt-2 text-sm text-[#73796f]">পছন্দের মধু বা ঘি বেছে নিয়ে অর্ডার শুরু করুন।</p>
            <button onClick={() => { setCartOpen(false); document.getElementById('honey')?.scrollIntoView({ behavior: 'smooth' }) }} className="mt-6 rounded-full bg-[#143c2d] px-6 py-3 text-sm font-bold text-white">মধু দেখুন</button>
          </div> : <>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-3">
                {cart.map((item) => <article key={item.id} className="flex gap-4 rounded-2xl border border-[#e6ddc9] bg-white p-4">
                  <div className={`relative size-[76px] shrink-0 overflow-hidden rounded-xl ${item.category === 'honey' ? 'bg-[#fff3d6]' : 'bg-[#eef4e2]'}`}><Image src={item.image} alt="" fill sizes="76px" className="object-cover" /></div>
                  <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h3 className="font-bold text-[#193d2d]">{item.title}</h3><p className="mt-1 text-xs text-[#7b8279]">{item.category === 'honey' ? 'মধু' : 'ঘি'} · {item.weight}</p></div><button onClick={() => setCart((current) => current.filter((line) => line.id !== item.id))} className="grid size-8 place-items-center rounded-full text-[#92958a] transition hover:bg-[#f8ebe4] hover:text-[#a44731]" aria-label={`${item.title} সরান`}><Trash2 className="size-4" /></button></div>
                    <div className="mt-3 flex items-center justify-between"><div className="inline-flex items-center rounded-full border border-[#e1dccd]"><button onClick={() => changeQuantity(item.id, -1)} className="grid size-8 place-items-center text-[#526158]" aria-label={`${item.title} এর পরিমাণ কমান`}><Minus className="size-3.5" /></button><span className="min-w-7 text-center text-sm font-semibold">{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} className="grid size-8 place-items-center text-[#526158]" aria-label={`${item.title} এর পরিমাণ বাড়ান`}><Plus className="size-3.5" /></button></div><span className="font-bold text-[#9c7026]">{taka(item.price * item.quantity)}</span></div>
                  </div>
                </article>)}
              </div>
              <form className="mt-6" onSubmit={submitOrder}>
                <h3 className="text-lg font-bold text-[#173c2a]">ডেলিভারি তথ্য</h3>
                <div className="mt-4 grid gap-3">
                  <label className="grid gap-1.5 text-xs font-semibold text-[#4e5a50]">আপনার পূর্ণ নাম<input required name="customerName" autoComplete="name" minLength={2} maxLength={100} placeholder="যেমন: সুমাইয়া আক্তার" className="h-12 rounded-xl border border-[#ded7c7] bg-white px-4 text-sm font-normal text-[#17241d] outline-none transition placeholder:text-[#aaa99f] focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" /></label>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#4e5a50]">মোবাইল নম্বর<input required name="phone" type="tel" inputMode="numeric" autoComplete="tel" pattern="01[3-9][0-9]{8}" maxLength={11} title="১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন" placeholder="01XXXXXXXXX" className="h-12 rounded-xl border border-[#ded7c7] bg-white px-4 text-sm font-normal text-[#17241d] outline-none transition placeholder:text-[#aaa99f] focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" /></label>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#4e5a50]">সম্পূর্ণ ডেলিভারি ঠিকানা<textarea required name="address" autoComplete="street-address" minLength={12} maxLength={500} rows={2} placeholder="জেলা, থানা, বাসা বা রাস্তার নম্বর" className="resize-none rounded-xl border border-[#ded7c7] bg-white px-4 py-3 text-sm font-normal text-[#17241d] outline-none transition placeholder:text-[#aaa99f] focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" /></label>
                  <fieldset className="grid gap-2"><legend className="text-xs font-semibold text-[#4e5a50]">ডেলিভারি এলাকা</legend><div className="grid grid-cols-2 gap-2">
                    {([{ value: 'dhaka', label: 'ঢাকার ভিতরে', charge: '৳৬০' }, { value: 'outside', label: 'ঢাকার বাইরে', charge: '৳১২০' }] as const).map((option) => <label key={option.value} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-3 text-xs font-semibold transition ${zone === option.value ? 'border-[#4a7954] bg-[#e9f0e5] text-[#204932]' : 'border-[#ded7c7] bg-white text-[#626b60]'}`}><input type="radio" name="zone" value={option.value} checked={zone === option.value} onChange={() => setZone(option.value)} className="accent-[#287046]" /><span className="flex-1">{option.label}</span><span className="text-[10px]">{freeDelivery ? 'ফ্রি' : option.charge}</span></label>)}
                  </div></fieldset>
                  <div className="flex items-center gap-3 rounded-xl bg-[#eaf0e5] px-4 py-3"><span className="grid size-9 place-items-center rounded-full bg-white text-[#34734b]"><Check className="size-4" /></span><span><span className="block text-sm font-bold text-[#214d33]">ক্যাশ অন ডেলিভারি</span><span className="block text-[11px] text-[#667466]">পণ্য হাতে পেয়ে টাকা পরিশোধ</span></span></div>
                  {checkoutError && <p role="alert" className="rounded-xl border border-[#e7c8bd] bg-[#fff4ef] px-4 py-3 text-sm text-[#9c442d]">{checkoutError}</p>}
                  <div className="rounded-xl border border-[#e4dbc6] bg-white p-4 text-sm">
                    <div className="flex justify-between text-[#697168]"><span>পণ্যের মূল্য</span><span>{taka(subtotal)}</span></div>
                    <div className="mt-2 flex justify-between text-[#697168]"><span>ডেলিভারি</span><span>{deliveryCharge === 0 ? 'ফ্রি' : taka(deliveryCharge)}</span></div>
                    <div className="mt-3 flex justify-between border-t border-[#eee7d8] pt-3 font-bold text-[#173c2a]"><span>সর্বমোট</span><span className="text-lg">{taka(total)}</span></div>
                  </div>
                  <button disabled={isSubmitting || cart.length === 0} className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#d99f39] px-5 font-bold text-[#183622] transition hover:bg-[#e7b64e] disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? 'অর্ডার পাঠানো হচ্ছে…' : 'অর্ডার কনফার্ম করুন'} <ArrowRight className="ml-2 size-4" /></button>
                  <p className="pb-3 text-center text-[11px] text-[#898b80]">আপনার তথ্য শুধু অর্ডার পৌঁছে দিতে ব্যবহার করা হবে।</p>
                </div>
              </form>
            </div>
          </>}
        </aside>
      </div>}

      {receipt && <div className="fixed inset-0 z-[60] grid place-items-center bg-[#0d1b13]/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
        <div className="w-full max-w-md rounded-[2rem] bg-[#fbf8ef] p-7 text-center shadow-2xl sm:p-9">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-[#e7f1e4] text-[#2e774a]"><CircleCheck className="size-8" /></span>
          <span className="mt-5 block text-xs font-bold uppercase tracking-[0.2em] text-[#a77b2d]">অর্ডার সফল</span>
          <h2 id="receipt-title" className="mt-2 text-2xl font-bold text-[#143c2d]">ধন্যবাদ, আপনার অর্ডারটি পেয়েছি!</h2>
          <p className="mt-3 text-sm leading-6 text-[#687168]">আমাদের টিম শিগগিরই আপনার সঙ্গে যোগাযোগ করে অর্ডার নিশ্চিত করবে।</p>
          <div className="mt-6 rounded-2xl border border-[#e3d8bf] bg-white p-4"><span className="block text-xs text-[#7b8279]">আপনার অর্ডার নম্বর</span><strong className="mt-1 block text-lg tracking-wide text-[#173c2a]">{receipt.orderNumber}</strong><span className="mt-2 block text-sm font-semibold text-[#a77b2d]">সর্বমোট {taka(receipt.total)}</span></div>
          <a href={`/track?order=${encodeURIComponent(receipt.orderNumber)}&phone=${encodeURIComponent(receipt.phone)}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#143c2d] px-6 text-sm font-bold text-[#143c2d] transition hover:bg-[#eef3ea]">অর্ডার ট্র্যাক করুন</a>
          <button onClick={() => setReceipt(null)} className="mt-3 min-h-12 w-full rounded-full bg-[#143c2d] px-6 font-bold text-white transition hover:bg-[#20553f]">ঠিক আছে</button>
        </div>
      </div>}
    </main>
  )
}

function ProductSection({ category, products, onAdd }: { category: ProductCategory; products: StorePackage[]; onAdd: (product: StorePackage) => void }) {
  const isHoney = category === 'honey'
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const tone = isHoney
    ? {
        section: 'bg-[#fffaf0]',
        eyebrow: 'border-[#e8c887] bg-[#f8e9c9] text-[#8a5c13]',
        title: 'text-[#6d450e]',
        body: 'text-[#786c54]',
        banner: 'from-[#6b3c07]/95 via-[#6b3c07]/55 to-transparent',
        bannerBadge: 'bg-[#f6d38a] text-[#5b3a0d]',
        count: 'border-[#e6c98e] bg-white/70 text-[#8a5c13]',
      }
    : {
        section: 'bg-[#f4f8ec]',
        eyebrow: 'border-[#bdd6ae] bg-[#e3efd7] text-[#2f6b46]',
        title: 'text-[#24563a]',
        body: 'text-[#627565]',
        banner: 'from-[#143c2d]/95 via-[#143c2d]/55 to-transparent',
        bannerBadge: 'bg-[#d8edbe] text-[#204b31]',
        count: 'border-[#bfd5b1] bg-white/70 text-[#2f6b46]',
      }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const getStep = () => {
      const card = track.querySelector<HTMLElement>('[data-product-card]')
      const gap = Number.parseFloat(window.getComputedStyle(track).columnGap || '0')
      return card ? card.offsetWidth + gap : track.clientWidth
    }
    const update = () => {
      const maxScroll = track.scrollWidth - track.clientWidth
      setAtStart(track.scrollLeft <= 2)
      setAtEnd(maxScroll <= 2 || track.scrollLeft >= maxScroll - 2)
      setActiveIndex(Math.min(products.length - 1, Math.max(0, Math.round(track.scrollLeft / Math.max(getStep(), 1)))))
    }

    update()
    track.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      track.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [products.length])

  const slide = (direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    const card = track.querySelector<HTMLElement>('[data-product-card]')
    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap || '0')
    const step = card ? card.offsetWidth + gap : track.clientWidth
    track.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  return (
    <section id={category} className={`${tone.section} px-3 py-10 sm:px-6 sm:py-16 lg:px-8 lg:py-24`}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end sm:gap-5">
          <div className="max-w-2xl">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold sm:gap-2 sm:px-4 sm:py-2 sm:text-xs ${tone.eyebrow}`}>{isHoney ? <Sparkles className="size-3.5 sm:size-4" /> : <Leaf className="size-3.5 sm:size-4" />}{isHoney ? 'সুন্দরবনের মৌচাক থেকে' : 'পাবনা-সিরাজগঞ্জের খামার থেকে'}</span>
            <h2 className={`mt-3 text-[1.4rem] font-bold leading-tight sm:mt-4 sm:text-3xl lg:text-4xl ${tone.title}`}>{isHoney ? 'মধুর স্বাদে, প্রকৃতির আশীর্বাদ' : 'ঘির সুবাসে, ঘরের পুরোনো স্বাদ'}</h2>
            <p className={`mt-2 max-w-xl text-xs leading-6 sm:mt-3 sm:text-sm sm:leading-7 ${tone.body}`}>{isHoney ? 'খাঁটি মধুর প্রতিটি বয়াম সংগৃহীত হয় বিশ্বস্ত মৌয়াল থেকে—ঘন স্বাদ, প্রাকৃতিক ঘ্রাণ আর কোনো ভেজাল ছাড়া।' : 'দেশি গরুর দুধ থেকে ঐতিহ্যবাহী পদ্ধতিতে তৈরি গাওয়া ঘি—রান্না হোক বা নাশতা, স্বাদ থাকবে অটুট।'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[10px] font-semibold sm:px-4 sm:py-2 sm:text-xs ${tone.count}`}>{products.length}টি পণ্য</span>
            {products.length > 1 && <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-[10px] font-bold sm:px-4 sm:py-2 sm:text-xs ${tone.count}`}>{activeIndex + 1}/{products.length}</span>}
          </div>
        </div>

        <div className="relative mt-6 h-[170px] overflow-hidden rounded-[1.35rem] bg-[#ead6a6] shadow-[0_20px_50px_-40px_rgba(48,40,20,.6)] sm:mt-9 sm:h-[240px] sm:rounded-[2rem] lg:h-[280px]">
          <Image src={SECTION_IMAGES[category]} alt={isHoney ? 'মধুর বয়াম ও মৌচাক' : 'গাওয়া ঘির বাটি ও প্যাক'} fill sizes="(max-width: 768px) 92vw, 80vw" className="object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-r ${tone.banner}`} />
          <div className="relative flex h-full max-w-lg flex-col justify-center px-5 text-white sm:px-12">
            <span className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold sm:px-3 sm:py-1.5 sm:text-xs ${tone.bannerBadge}`}>{isHoney ? 'মৌচাক থেকে সরাসরি' : 'দুধ থেকে ঘি, হাতে তৈরি'}</span>
            <h3 className="mt-2.5 text-lg font-bold leading-tight sm:mt-3 sm:text-2xl lg:text-3xl">{isHoney ? 'প্রতিটি ফোঁটা বিশুদ্ধ মধু' : 'সোনালি ঘি, খাঁটি স্বাদ'}</h3>
            <p className="mt-1.5 max-w-sm text-[11px] leading-5 text-white/85 sm:mt-2 sm:text-sm sm:leading-6">{isHoney ? 'সুন্দরবনের মৌয়ালদের হাতে সংগৃহীত মধু, নিরাপদ বয়ামে প্যাক করা।' : 'পাবনা-সিরাজগঞ্জের দুগ্ধ খামার থেকে আসা ঘি, যত্নে পৌঁছে যাবে আপনার ঘরে।'}</p>
          </div>
        </div>

        {products.length > 0 && <div className="relative mt-6 sm:mt-8">
          {products.length > 1 && <>
            <button
              onClick={() => slide(-1)}
              disabled={atStart}
              aria-label="আগের পণ্য"
              aria-controls={`${category}-slider`}
              title="আগের পণ্য"
              className="absolute left-1 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-[#143c2d]/90 text-white shadow-[0_10px_25px_-8px_rgba(0,0,0,.55)] backdrop-blur-sm transition hover:bg-[#1d5a3b] disabled:cursor-not-allowed disabled:opacity-30 sm:size-10"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={() => slide(1)}
              disabled={atEnd}
              aria-label="পরের পণ্য"
              aria-controls={`${category}-slider`}
              title="পরের পণ্য"
              className="absolute right-1 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-[#143c2d]/90 text-white shadow-[0_10px_25px_-8px_rgba(0,0,0,.55)] backdrop-blur-sm transition hover:bg-[#1d5a3b] disabled:cursor-not-allowed disabled:opacity-30 sm:size-10"
            >
              <ChevronRight className="size-5" />
            </button>
          </>}
          <div
            id={`${category}-slider`}
            ref={trackRef}
            role="region"
            aria-label={`${isHoney ? 'মধু' : 'ঘি'} পণ্য স্লাইডার`}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') { event.preventDefault(); slide(1) }
              if (event.key === 'ArrowLeft') { event.preventDefault(); slide(-1) }
            }}
            className="product-slider flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 sm:gap-5"
          >
            {products.map((product) => <div key={product.id} data-product-card className="w-[84%] max-w-[340px] shrink-0 snap-center sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.833rem)]"><ProductCard product={product} onAdd={onAdd} /></div>)}
          </div>
          <div className="mt-1 flex justify-center" aria-hidden="true">
            <div className="h-1 w-24 overflow-hidden rounded-full bg-[#ddd4c1] sm:w-32">
              <div className="h-full rounded-full bg-[#d99f39] transition-all duration-300" style={{ width: `${((activeIndex + 1) / products.length) * 100}%` }} />
            </div>
          </div>
        </div>}
        {products.length === 0 && <p className={`mt-7 rounded-2xl border border-dashed p-8 text-center text-xs sm:text-sm ${isHoney ? 'border-[#e6c98e] text-[#8a5c13]' : 'border-[#bfd5b1] text-[#2f6b46]'}`}>{isHoney ? 'নতুন মধু শিগগিরই আসছে।' : 'নতুন ঘি শিগগিরই আসছে।'}</p>}
      </div>
    </section>
  )
}

function ProductCard({ product, onAdd }: { product: StorePackage; onAdd: (product: StorePackage) => void }) {
  const isHoney = product.category === 'honey'
  const tone = isHoney
    ? {
        frame: 'border-[#edcf96] bg-[#fffdf6]',
        media: 'from-[#fff6df] to-[#f5d798]',
        chip: 'bg-[#f7e6bf] text-[#8a5c13]',
        price: 'text-[#a96a12]',
        strike: 'text-[#a59a83]',
        button: 'bg-[#b7791f] text-white hover:bg-[#c98a2a]',
        icon: 'bg-[#fdf1d6] text-[#b7791f]',
      }
    : {
        frame: 'border-[#cfe0bb] bg-[#fdfff9]',
        media: 'from-[#f3f8e8] to-[#d8e9bd]',
        chip: 'bg-[#e2efd5] text-[#2f6b46]',
        price: 'text-[#2f6b46]',
        strike: 'text-[#98a693]',
        button: 'bg-[#1d5a3b] text-white hover:bg-[#28734c]',
        icon: 'bg-[#e9f2e0] text-[#2f6b46]',
      }

  return (
    <article className={`group relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border shadow-[0_18px_45px_-36px_rgba(30,45,25,.55)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_55px_-34px_rgba(30,45,25,.5)] sm:rounded-[1.75rem] ${tone.frame}`}>
      <div className={`relative h-36 overflow-hidden bg-gradient-to-br sm:h-52 ${tone.media}`}>
        <Image src={product.image} alt={product.title} fill sizes="(max-width: 640px) 84vw, (max-width: 1024px) 46vw, 30vw" className="object-cover transition duration-500 group-hover:scale-[1.05]" />
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[11px] ${tone.chip}`}>{isHoney ? 'খাঁটি মধু' : 'গাওয়া ঘি'}</span>
        {product.badge && <span className="absolute right-3 top-3 max-w-[42%] truncate rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-[#5c512f] shadow-sm sm:right-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-[11px]">{product.badge}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <h3 className={`text-base font-bold leading-snug sm:text-xl ${isHoney ? 'text-[#5d3d10]' : 'text-[#1d4730]'}`}>{product.title}</h3>
          <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold sm:px-2.5 sm:text-[11px] ${tone.icon}`}>{product.weight}</span>
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-[#687168] sm:min-h-12 sm:text-sm sm:leading-6">{product.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-[#6f7a6d] sm:mt-4 sm:gap-2 sm:text-[11px]">
          <span className="inline-flex items-center gap-1"><CircleCheck className="size-3 text-[#57855d] sm:size-3.5" /> ভেজালমুক্ত</span>
          <span className="inline-flex items-center gap-1"><PackageCheck className="size-3 text-[#57855d] sm:size-3.5" /> নিরাপদ প্যাক</span>
          {product.freeDelivery && <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f0e4] px-2 py-1 text-[#286144]"><Truck className="size-3 sm:size-3.5" /> ফ্রি ডেলিভারি</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4 sm:gap-3 sm:pt-6">
          <div>
            <span className={`block text-[11px] line-through sm:text-xs ${tone.strike}`}>{taka(product.originalPrice)}</span>
            <span className={`mt-0.5 block text-xl font-extrabold sm:text-2xl ${tone.price}`}>{taka(product.price)}</span>
          </div>
          <button onClick={() => onAdd(product)} className={`inline-flex min-h-10 items-center justify-center rounded-full px-3 text-xs font-bold transition sm:min-h-11 sm:px-4 sm:text-sm ${tone.button}`}><ShoppingBag className="mr-1.5 size-3.5 sm:mr-2 sm:size-4" /> কার্টে যোগ করুন</button>
        </div>
      </div>
    </article>
  )
}
