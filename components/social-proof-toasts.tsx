'use client'

import { useEffect, useRef, useState } from 'react'
import { ShoppingBag, X } from 'lucide-react'

type Toast = {
  id: string
  name: string
  location: string
  product: string
  minutesAgo: number
}

const MESSAGES: Omit<Toast, 'id' | 'minutesAgo'>[] = [
  { name: 'সাব্বির', location: 'ঢাকা', product: '৫০০ গ্রাম গাওয়া ঘি অর্ডার করেছেন' },
  { name: 'নুসরাত', location: 'চট্টগ্রাম', product: '১ কেজি সুন্দরবনের মধু অর্ডার করেছেন' },
  { name: 'রাকিব', location: 'সিলেট', product: '১ লিটার গাওয়া ঘি অর্ডার করেছেন' },
  { name: 'মাহমুদা', location: 'রাজশাহী', product: '৫০০ গ্রাম সুন্দরবনের মধু অর্ডার করেছেন' },
  { name: 'তানভীর', location: 'খুলনা', product: 'গাওয়া ঘি ও মধু কম্বো প্যাক অর্ডার করেছেন' },
  { name: 'ফারহানা', location: 'বরিশাল', product: '২৫০ গ্রাম গাওয়া ঘি অর্ডার করেছেন' },
  { name: 'ইমরান', location: 'কুমিল্লা', product: '২ কেজি সুন্দরবনের মধু অর্ডার করেছেন' },
  { name: 'সুমাইয়া', location: 'গাজীপুর', product: '৫০০ গ্রাম গাওয়া ঘি অর্ডার করেছেন' },
  { name: 'আриф', location: 'নারায়ণগঞ্জ', product: '১ কেজি গাওয়া ঘি অর্ডার করেছেন' },
  { name: 'জান্নাতুল', location: 'ময়মনসিংহ', product: '৫০০ গ্রাম কালোজিরা মধু অর্ডার করেছেন' },
  { name: 'হাসান', location: 'রংপুর', product: '১ লিটার গাওয়া ঘি অর্ডার করেছেন' },
  { name: 'মিতু', location: 'বগুড়া', product: 'সুন্দরবনের মধু ১ কেজি অর্ডার করেছেন' },
  { name: 'সজিব', location: 'ফরিদপুর', product: '২৫০ গ্রাম গাওয়া ঘি অর্ডার করেছেন' },
  { name: 'রুমানা', location: 'দিনাজপুর', product: '৫০০ গ্রাম সুন্দরবনের মধু অর্ডার করেছেন' },
  { name: 'নাহিদ', location: 'যশোর', product: 'গাওয়া ঘি ৫০০ গ্রাম অর্ডার করেছেন' },
  { name: 'শারমিন', location: 'টাঙ্গাইল', product: '১ কেজি গাওয়া ঘি অর্ডার করেছেন' },
  { name: 'ফয়সাল', location: 'পাবনা', product: 'সুন্দরবনের মধু ৫০০ গ্রাম অর্ডার করেছেন' },
  { name: 'আয়েশা', location: 'কুষ্টিয়া', product: 'গাওয়া ঘি ও মধু সেট অর্ডার করেছেন' },
  { name: 'মামুন', location: 'নোয়াখালী', product: '১ লিটার গাওয়া ঘি অর্ডার করেছেন' },
  { name: 'লাবনী', location: 'ঢাকা', product: '৫০০ গ্রাম সুন্দরবনের মধু অর্ডার করেছেন' },
]

export function SocialProofToasts() {
  const [toast, setToast] = useState<Toast | null>(null)
  const [visible, setVisible] = useState(false)
  const lastIndex = useRef(-1)
  const hideTimer = useRef<number | null>(null)
  const nextTimer = useRef<number | null>(null)

  useEffect(() => {
    const clearTimers = () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current)
      if (nextTimer.current) window.clearTimeout(nextTimer.current)
    }

    const scheduleNext = (delay: number) => {
      nextTimer.current = window.setTimeout(showToast, delay)
    }

    const showToast = () => {
      let index = Math.floor(Math.random() * MESSAGES.length)
      if (index === lastIndex.current) index = (index + 1) % MESSAGES.length
      lastIndex.current = index
      const msg = MESSAGES[index]
      setToast({
        id: `${Date.now()}-${index}`,
        ...msg,
        minutesAgo: Math.floor(Math.random() * 12) + 1,
      })
      setVisible(true)

      hideTimer.current = window.setTimeout(() => {
        setVisible(false)
        scheduleNext(8000 + Math.floor(Math.random() * 9000))
      }, 4500)
    }

    scheduleNext(4000)
    return clearTimers
  }, [])

  if (!toast) return null

  return (
    <div className="pointer-events-none fixed bottom-[5.25rem] left-3 z-[45] sm:left-4 md:bottom-5" aria-live="polite" aria-atomic="true">
      <div
        className={`pointer-events-auto flex w-[min(calc(100vw-1.5rem),292px)] items-start gap-2.5 rounded-xl border border-[#ddd4c1] bg-white/96 px-3 py-2.5 shadow-[0_10px_30px_-18px_rgba(20,60,45,.35)] backdrop-blur transition-all duration-500 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        }`}
        role="status"
      >
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-[#edf3e8] text-[#2f6b46]">
          <ShoppingBag className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] leading-4 text-[#143c2d]">
            <span className="font-bold">{toast.name}</span>
            <span className="text-[#7a8478]"> • {toast.location}</span>
          </p>
          <p className="mt-0.5 truncate text-[11px] leading-4 text-[#526158]">{toast.product}</p>
          <p className="mt-1 text-[10px] text-[#8b9388]">{toast.minutesAgo} মিনিট আগে</p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="grid size-6 shrink-0 place-items-center rounded-full text-[#96a093] transition hover:bg-[#f3ecdb] hover:text-[#526158]"
          aria-label="বন্ধ করুন"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
