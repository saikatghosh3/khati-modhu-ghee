'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUp,
  Clock3,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import { MessageSidebar } from '@/components/message-sidebar'

export function SiteFooter() {
  const [showTop, setShowTop] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <footer id="contact" className="relative overflow-hidden bg-[#0f3024] text-white">
        <div className="pointer-events-none absolute -left-28 -top-36 size-[420px] rounded-full bg-[#2f6b46]/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 right-0 size-[460px] rounded-full bg-[#c79435]/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#e5b858] via-[#f4db9b] to-[#e5b858]" />

        <div className="relative mx-auto max-w-7xl px-3 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pt-16">
          <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
            {[
              { icon: Truck, title: 'ক্যাশ অন ডেলিভারি', text: 'পণ্য হাতে পেয়ে টাকা দিন' },
              { icon: Sparkles, title: 'খাঁটি ও প্রাকৃতিক', text: 'মধু আর ঘি, ভেজালমুক্ত' },
              { icon: ShieldCheck, title: 'নিরাপদ প্যাকেজিং', text: 'সতেজতা থাকুক অটুট' },
            ].map(({ icon: Icon, title, text }) => <div key={title} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2.5 backdrop-blur-sm transition hover:border-[#e5b858]/40 hover:bg-white/[.07] sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3.5"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e5b858]/15 text-[#edc76d] sm:size-10 sm:rounded-xl"><Icon className="size-4 sm:size-[18px]" /></span><span><span className="block text-xs font-bold sm:text-sm">{title}</span><span className="block text-[10px] text-white/55 sm:text-[11px]">{text}</span></span></div>)}
          </div>

          <div className="mt-8 grid gap-8 border-t border-white/10 pb-10 pt-8 sm:mt-12 sm:gap-10 sm:pb-12 sm:pt-12 md:grid-cols-2 lg:grid-cols-[1.25fr_.8fr_.85fr_1.4fr]">
            <div>
              <Link href="/" className="flex items-center gap-2.5 sm:gap-3" aria-label="ঘরকথা হোম">
                <span className="grid size-9 place-items-center rounded-xl bg-[#e5b858] text-[#123526] sm:size-11 sm:rounded-2xl"><Leaf className="size-4 sm:size-5" /></span>
                <span className="leading-tight"><span className="block text-lg font-bold sm:text-xl">ঘরকথা</span><span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#e5b858] sm:text-[10px]">প্রকৃতির আপন স্বাদ</span></span>
              </Link>
              <p className="mt-4 max-w-xs text-xs leading-6 text-white/60 sm:mt-5 sm:text-sm sm:leading-7">সুন্দরবনের খাঁটি মধু আর পাবনা-সিরাজগঞ্জের গাওয়া ঘি—চেনা উৎস থেকে, আপনার পরিবারের রান্নাঘরে।</p>
              <div className="mt-5 space-y-2.5 text-[11px] text-white/65 sm:mt-6 sm:space-y-3 sm:text-xs">
                <p className="flex items-start gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-[#e5b858]" /> সুন্দরবন ও পাবনা-সিরাজগঞ্জ, বাংলাদেশ</p>
                <p className="flex items-center gap-2.5"><Clock3 className="size-4 shrink-0 text-[#e5b858]" /> সোমবার–শনিবার, সকাল ৯টা–সন্ধ্যা ৬টা</p>
                <a href="mailto:admin@gmil.com" className="flex items-center gap-2.5 transition hover:text-[#edc76d]"><Mail className="size-4 shrink-0 text-[#e5b858]" /> admin@gmil.com</a>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#edc76d] sm:text-sm">দোকান</h3>
              <ul className="mt-4 space-y-2.5 text-xs text-white/65 sm:mt-5 sm:space-y-3 sm:text-sm">
                <li><Link href="/#honey" className="transition hover:text-white">খাঁটি মধু</Link></li>
                <li><Link href="/#ghee" className="transition hover:text-white">গাওয়া ঘি</Link></li>
                <li><Link href="/#our-story" className="transition hover:text-white">আমাদের কথা</Link></li>
                <li><Link href="/#faq" className="transition hover:text-white">জিজ্ঞাসা</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#edc76d] sm:text-sm">সাহায্য</h3>
              <ul className="mt-4 space-y-2.5 text-xs text-white/65 sm:mt-5 sm:space-y-3 sm:text-sm">
                <li><Link href="/#faq" className="transition hover:text-white">অর্ডারের নিয়ম</Link></li>
                <li><Link href="/privacy-policy" className="transition hover:text-white">গোপনীয়তা নীতি</Link></li>
                <li><Link href="/terms-and-conditions" className="transition hover:text-white">শর্তাবলী</Link></li>
                <li><Link href="/admin/login" className="transition hover:text-white">অ্যাডমিন লগইন</Link></li>
              </ul>
            </div>

            <div className="rounded-[1.25rem] border border-white/10 bg-white/[.05] p-4 backdrop-blur-sm sm:rounded-[1.5rem] sm:p-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-[#e5b858]/15 px-2.5 py-1 text-[10px] font-bold text-[#edc76d] sm:px-3 sm:py-1.5 sm:text-[11px]"><MessageCircle className="size-3.5" /> আমাদের মেসেজ দিন</span>
              <h3 className="mt-2.5 text-lg font-bold sm:mt-3 sm:text-xl">কোনো প্রশ্ন আছে?</h3>
              <p className="mt-1.5 text-[11px] leading-6 text-white/60 sm:text-xs">অর্ডার, ডেলিভারি বা পণ্য নিয়ে যেকোনো কথা জানাতে এই ফর্ম ব্যবহার করুন।</p>
              <button onClick={() => setMessageOpen(true)} className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[#e5b858] px-4 text-xs font-bold text-[#123526] transition hover:bg-[#f3cf83] sm:mt-5 sm:min-h-11 sm:px-5 sm:text-sm">মেসেজ লিখুন <ArrowRight className="ml-2 size-4" /></button>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/50">© {new Date().getFullYear()} ঘরকথা। যত্নে সংগৃহীত, ভালোবাসায় পৌঁছে দেওয়া।</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
              <Link href="/privacy-policy" className="transition hover:text-[#edc76d]">গোপনীয়তা নীতি</Link>
              <Link href="/terms-and-conditions" className="transition hover:text-[#edc76d]">শর্তাবলী</Link>
              <button onClick={() => setMessageOpen(true)} className="inline-flex items-center gap-1.5 transition hover:text-[#edc76d]">যোগাযোগ <ArrowRight className="size-3.5" /></button>
            </div>
          </div>
        </div>
      </footer>

      <MessageSidebar open={messageOpen} onClose={() => setMessageOpen(false)} />

      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="পেইজের উপরে যান" className={`fixed bottom-20 right-3 z-30 grid size-10 place-items-center rounded-full bg-[#e5b858] text-[#123526] shadow-[0_12px_30px_-10px_rgba(0,0,0,.5)] transition duration-300 hover:-translate-y-1 hover:bg-[#f3cf83] sm:bottom-24 sm:right-4 sm:size-12 lg:bottom-7 lg:right-7 ${showTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}><ArrowUp className="size-4 sm:size-5" /></button>
    </>
  )
}
