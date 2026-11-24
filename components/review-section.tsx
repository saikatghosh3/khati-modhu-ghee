'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  PenLine,
  Quote,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react'
import type { StoreReview } from '@/lib/reviews'

const banglaDate = (value: string) => new Intl.DateTimeFormat('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0] ?? '').join('')

function Stars({ rating, className = 'size-3.5' }: { rating: number; className?: string }) {
  return <span className="inline-flex items-center gap-0.5" aria-label={`৫ এর মধ্যে ${rating} তারকা`}>
    {[1, 2, 3, 4, 5].map((value) => <Star key={value} className={`${className} ${value <= rating ? 'fill-[#e5b858] text-[#e5b858]' : 'text-white/25'}`} />)}
  </span>
}

export function ReviewSection({ reviews }: { reviews: StoreReview[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  return <>
    <section id="reviews" className="relative overflow-hidden bg-[#0f3024] px-3 py-12 text-white sm:px-6 sm:py-16 lg:px-8 lg:py-24">
      <div className="pointer-events-none absolute -right-32 -top-40 size-[420px] rounded-full bg-[#2f6b46]/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-24 size-[460px] rounded-full bg-[#c79435]/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#e5b858]/20 via-[#e5b858] to-[#e5b858]/20" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:gap-12">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5b858]/25 bg-[#e5b858]/10 px-3 py-1.5 text-[10px] font-bold text-[#edc76d] sm:gap-2 sm:px-4 sm:py-2 sm:text-xs"><Star className="size-3 fill-[#e5b858] sm:size-3.5" /> কাস্টমারের কথা</span>
            <h2 className="mt-3 text-[1.5rem] font-bold leading-tight sm:mt-4 sm:text-3xl lg:text-4xl">যারা চেখে দেখেছেন, <span className="text-[#e5b858]">তাদের কথা</span></h2>
            <p className="mt-3 text-xs leading-6 text-white/60 sm:mt-4 sm:text-sm sm:leading-7">আসল মানুষের আসল অভিজ্ঞতা—মধু আর ঘির স্বাদ, প্যাকেজিং আর ডেলিভারি, সব কিছু তাদের কথায়।</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[.05] p-4 backdrop-blur-sm sm:rounded-[1.5rem] sm:p-5">
              <div className="flex items-center gap-4">
                <div className="shrink-0 text-center">
                  <span className="block text-3xl font-extrabold leading-none text-[#edc76d] sm:text-4xl">{reviews.length ? average.toFixed(1) : '—'}</span>
                  <span className="mt-2 block"><Stars rating={Math.round(average)} /></span>
                  <span className="mt-1.5 block text-[10px] text-white/50">{reviews.length}টি মতামত</span>
                </div>
                <span className="hidden h-16 w-px bg-white/10 sm:block" />
                <div className="flex-1 space-y-1.5">
                  {[5, 4, 3].map((value) => {
                    const count = reviews.filter((review) => review.rating === value).length
                    const percent = reviews.length ? (count / reviews.length) * 100 : 0
                    return <div key={value} className="flex items-center gap-2">
                      <span className="w-3 text-[10px] font-semibold text-white/55">{value}</span>
                      <Star className="size-2.5 shrink-0 fill-[#e5b858]/70 text-[#e5b858]/70" />
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-[#e5b858] transition-all duration-500" style={{ width: `${percent}%` }} /></span>
                    </div>
                  })}
                </div>
              </div>
            </div>
            <button onClick={() => setDrawerOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#e5b858] px-5 text-xs font-bold text-[#123526] transition hover:-translate-y-0.5 hover:bg-[#f3cf83] sm:min-h-12 sm:px-6 sm:text-sm"><PenLine className="size-4" /> রিভিউ দিন <ArrowRight className="size-4" /></button>
          </div>
        </div>

        <ReviewSlider reviews={reviews} onWrite={() => setDrawerOpen(true)} />
      </div>
    </section>

    {drawerOpen && <ReviewDrawer onClose={() => setDrawerOpen(false)} />}
  </>
}

function ReviewSlider({ reviews, onWrite }: { reviews: StoreReview[]; onWrite: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)
  const [paused, setPaused] = useState(false)

  const getStep = useCallback(() => {
    const track = trackRef.current
    if (!track) return 0
    const card = track.querySelector<HTMLElement>('[data-review-card]')
    const gap = Number.parseFloat(window.getComputedStyle(track).columnGap || '0')
    return card ? card.offsetWidth + gap : track.clientWidth
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track || reviews.length === 0) return

    const update = () => {
      const step = getStep()
      const maxScroll = track.scrollWidth - track.clientWidth
      const index = Math.min(reviews.length - 1, Math.max(0, Math.round(track.scrollLeft / Math.max(step, 1))))
      activeRef.current = index
      setActiveIndex(index)
      setAtStart(track.scrollLeft <= 2)
      setAtEnd(maxScroll <= 2 || track.scrollLeft >= maxScroll - 2)
    }

    update()
    track.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      track.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [getStep, reviews.length])

  useEffect(() => {
    const track = trackRef.current
    if (!track || paused || reviews.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timer = window.setInterval(() => {
      const next = (activeRef.current + 1) % reviews.length
      track.scrollTo({ left: next * getStep(), behavior: 'smooth' })
    }, 6500)
    return () => window.clearInterval(timer)
  }, [getStep, paused, reviews.length])

  const slide = (direction: -1 | 1) => {
    const track = trackRef.current
    if (!track) return
    const step = getStep()
    const target = Math.min(reviews.length - 1, Math.max(0, activeRef.current + direction))
    track.scrollTo({ left: target * step, behavior: 'smooth' })
  }

  if (reviews.length === 0) {
    return <div className="mt-8 flex flex-col items-center rounded-[1.5rem] border border-dashed border-white/15 bg-white/[.04] px-6 py-12 text-center sm:mt-10 sm:rounded-[2rem]">
      <span className="grid size-14 place-items-center rounded-full bg-[#e5b858]/15 text-[#edc76d]"><Quote className="size-6" /></span>
      <h3 className="mt-4 text-lg font-bold">এখনো কোনো রিভিউ নেই</h3>
      <p className="mt-2 max-w-sm text-xs leading-6 text-white/60 sm:text-sm">প্রথম রিভিউ দিয়ে অন্যদের জন্য পথ দেখিয়ে দিন—আপনার মতামত যাচাইয়ের পর এখানে দেখা যাবে।</p>
      <button onClick={onWrite} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e5b858] px-6 text-sm font-bold text-[#123526] transition hover:bg-[#f3cf83]"><PenLine className="size-4" /> প্রথম রিভিউ দিন</button>
    </div>
  }

  return <div className="relative mt-8 sm:mt-10" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
    {reviews.length > 1 && <>
      <button onClick={() => slide(-1)} disabled={atStart} aria-label="আগের রিভিউ" aria-controls="review-slider" className="absolute left-1 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-[#e5b858] text-[#123526] shadow-[0_10px_25px_-8px_rgba(0,0,0,.55)] transition hover:bg-[#f3cf83] disabled:cursor-not-allowed disabled:opacity-35 sm:size-10"><ChevronLeft className="size-5" /></button>
      <button onClick={() => slide(1)} disabled={atEnd} aria-label="পরের রিভিউ" aria-controls="review-slider" className="absolute right-1 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full border border-white/60 bg-[#e5b858] text-[#123526] shadow-[0_10px_25px_-8px_rgba(0,0,0,.55)] transition hover:bg-[#f3cf83] disabled:cursor-not-allowed disabled:opacity-35 sm:size-10"><ChevronRight className="size-5" /></button>
    </>}

    <div
      id="review-slider"
      ref={trackRef}
      role="region"
      aria-label="কাস্টমার রিভিউ স্লাইডার"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') { event.preventDefault(); slide(1) }
        if (event.key === 'ArrowLeft') { event.preventDefault(); slide(-1) }
      }}
      className="product-slider flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 sm:gap-5"
    >
      {reviews.map((review, index) => <div key={review.id} data-review-card className="w-[88%] max-w-[430px] shrink-0 snap-center sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.833rem)]">
        <article className="relative flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[.06] p-5 backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#e5b858]/40 hover:bg-white/[.09] sm:min-h-[280px] sm:rounded-[1.75rem] sm:p-7">
          <Quote className="absolute right-5 top-5 size-9 text-[#e5b858]/15 sm:size-11" />
          <Stars rating={review.rating} className="size-4 sm:size-[18px]" />
          {review.title && <h3 className="mt-4 pr-8 text-base font-bold leading-snug sm:mt-5 sm:text-lg">{review.title}</h3>}
          <p className="mt-2 flex-1 text-[13px] leading-6 text-white/70 sm:mt-3 sm:text-sm sm:leading-7">“{review.comment}”</p>
          <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e5b858]/15 text-sm font-bold text-[#edc76d]">{initials(review.name)}</span>
            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 text-sm font-bold"><span className="truncate">{review.name}</span><ShieldCheck className="size-3.5 shrink-0 text-[#7fc08b]" aria-label="যাচাইকৃত" /></span>
              <span className="mt-0.5 block truncate text-[11px] text-white/50">{review.location || 'ঘরকথা কাস্টমার'} · {banglaDate(review.createdAt)}</span>
            </div>
            {index === 0 && <span className="hidden rounded-full border border-[#e5b858]/25 bg-[#e5b858]/10 px-2.5 py-1 text-[10px] font-bold text-[#edc76d] sm:inline-block">ফিচার্ড</span>}
          </div>
        </article>
      </div>)}
    </div>

    <div className="mt-4 flex items-center justify-center gap-3" aria-hidden="true">
      <span className="text-[11px] font-bold text-white/50">{String(activeIndex + 1).padStart(2, '0')}</span>
      <span className="h-1 w-28 overflow-hidden rounded-full bg-white/15 sm:w-40"><span className="block h-full rounded-full bg-[#e5b858] transition-all duration-300" style={{ width: `${((activeIndex + 1) / reviews.length) * 100}%` }} /></span>
      <span className="text-[11px] font-bold text-white/50">{String(reviews.length).padStart(2, '0')}</span>
    </div>
  </div>
}

function ReviewDrawer({ onClose }: { onClose: () => void }) {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = event.currentTarget
    const formData = new FormData(form)
    const payload = {
      name: String(formData.get('name') ?? '').trim(),
      phone: String(formData.get('phone') ?? '').trim(),
      location: String(formData.get('location') ?? '').trim(),
      title: String(formData.get('title') ?? '').trim(),
      comment: String(formData.get('comment') ?? '').trim(),
      rating,
    }

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'রিভিউটি পাঠানো যায়নি। আবার চেষ্টা করুন।')
      setSuccess(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'রিভিউটি পাঠানো যায়নি। আবার চেষ্টা করুন।')
    } finally {
      setBusy(false)
    }
  }

  return <div className="fixed inset-0 z-50 flex justify-end">
    <button aria-label="রিভিউ ফর্ম বন্ধ করুন" className="absolute inset-0 cursor-default bg-[#0d1b13]/60 backdrop-blur-[2px]" onClick={onClose} />
    <aside role="dialog" aria-modal="true" aria-labelledby="review-drawer-title" className="relative flex h-full w-full max-w-[520px] flex-col bg-[#fbf8ef] shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="flex items-start justify-between gap-4 border-b border-[#e4dbc6] bg-[#143c2d] px-5 py-5 text-white sm:px-7">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5b858]/15 px-2.5 py-1 text-[10px] font-bold text-[#edc76d]"><PenLine className="size-3" /> আপনার অভিজ্ঞতা শেয়ার করুন</span>
          <h2 id="review-drawer-title" className="mt-2.5 text-xl font-bold sm:text-2xl">রিভিউ দিন</h2>
          <p className="mt-1 text-xs text-white/60">কয়েকটি কথায় আপনার অভিজ্ঞতা আমাদের সাহায্য করে।</p>
        </div>
        <button onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10 sm:size-10" aria-label="রিভিউ ফর্ম বন্ধ করুন"><X className="size-4" /></button>
      </div>

      {success ? <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-[#e7f1e4] text-[#2e774a]"><Check className="size-8" /></span>
        <h3 className="mt-5 text-xl font-bold text-[#143c2d]">ধন্যবাদ, আপনার রিভিউ পেয়েছি!</h3>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#687168]">আপনার মতামতটি যাচাইয়ের পর রিভিউ সেকশনে প্রকাশ করা হবে। সময় দেওয়ার জন্য আবারো ধন্যবাদ।</p>
        <button onClick={onClose} className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#143c2d] px-7 text-sm font-bold text-white transition hover:bg-[#20553f]">ঠিক আছে</button>
      </div> : <form onSubmit={submit} className="flex flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
          <fieldset>
            <legend className="text-xs font-bold text-[#4e5a50]">আপনার রেটিং <span className="text-[#b44832]">*</span></legend>
            <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setRating(value)} onMouseEnter={() => setHoverRating(value)} aria-label={`${value} তারকা`} aria-pressed={rating === value} className="grid size-9 place-items-center rounded-lg transition hover:scale-110 sm:size-10"><Star className={`size-7 sm:size-8 ${value <= (hoverRating || rating) ? 'fill-[#d99f39] text-[#d99f39]' : 'text-[#c7c6b8]'}`} /></button>)}
              <span className="ml-2 text-xs font-bold text-[#7b6a3e]">{rating}/৫</span>
            </div>
          </fieldset>
          <label className="grid gap-1.5 text-xs font-bold text-[#4e5a50]">আপনার নাম <span className="text-[#b44832]">*</span><input required name="name" autoComplete="name" minLength={2} maxLength={100} placeholder="যেমন: সুমাইয়া আক্তার" className="h-12 rounded-xl border border-[#ded7c7] bg-white px-4 text-sm font-normal text-[#17241d] outline-none transition placeholder:text-[#aaa99f] focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-bold text-[#4e5a50]">মোবাইল নম্বর <span className="font-normal text-[#92958a]">(ঐচ্ছিক)</span><input name="phone" type="tel" inputMode="numeric" pattern="01[3-9][0-9]{8}" maxLength={11} title="১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন" placeholder="01XXXXXXXXX" className="h-12 rounded-xl border border-[#ded7c7] bg-white px-4 text-sm font-normal text-[#17241d] outline-none transition placeholder:text-[#aaa99f] focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" /></label>
            <label className="grid gap-1.5 text-xs font-bold text-[#4e5a50]">আপনার এলাকা <span className="font-normal text-[#92958a]">(ঐচ্ছিক)</span><input name="location" maxLength={80} placeholder="যেমন: ঢাকা" className="h-12 rounded-xl border border-[#ded7c7] bg-white px-4 text-sm font-normal text-[#17241d] outline-none transition placeholder:text-[#aaa99f] focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" /></label>
          </div>
          <label className="grid gap-1.5 text-xs font-bold text-[#4e5a50]">শিরোনাম <span className="font-normal text-[#92958a]">(ঐচ্ছিক)</span><input name="title" maxLength={90} placeholder="যেমন: আসল মধুর স্বাদ পেলাম" className="h-12 rounded-xl border border-[#ded7c7] bg-white px-4 text-sm font-normal text-[#17241d] outline-none transition placeholder:text-[#aaa99f] focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" /></label>
          <label className="grid gap-1.5 text-xs font-bold text-[#4e5a50]">আপনার মতামত <span className="text-[#b44832]">*</span><textarea required name="comment" minLength={10} maxLength={600} rows={5} placeholder="পণ্যের স্বাদ, প্যাকেজিং বা ডেলিভারি—যেকোনো কথা লিখুন" className="resize-none rounded-xl border border-[#ded7c7] bg-white px-4 py-3 text-sm font-normal leading-6 text-[#17241d] outline-none transition placeholder:text-[#aaa99f] focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" /></label>
          {error && <p role="alert" className="rounded-xl border border-[#e7c8bd] bg-[#fff4ef] px-4 py-3 text-sm text-[#9c442d]">{error}</p>}
          <p className="flex items-start gap-2 rounded-xl bg-[#eaf0e5] px-4 py-3 text-[11px] leading-5 text-[#526158]"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#34734b]" /> আপনার রিভিউটি যাচাইয়ের পর প্রকাশ করা হয়। মোবাইল নম্বর শুধু যাচাইয়ের জন্য ব্যবহার করা হবে, সার্ভারে প্রকাশ করা হবে না।</p>
        </div>
        <div className="border-t border-[#e4dbc6] bg-white/60 px-5 py-4 sm:px-7">
          <button disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#d99f39] px-6 text-sm font-bold text-[#183622] transition hover:bg-[#e7b64e] disabled:cursor-not-allowed disabled:opacity-60">{busy ? 'পাঠানো হচ্ছে…' : 'রিভিউ জমা দিন'}</button>
        </div>
      </form>}
    </aside>
  </div>
}
