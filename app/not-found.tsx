import Link from 'next/link'
import { ArrowLeft, ArrowRight, Leaf, PackageSearch, ShieldCheck, ShoppingBag, Sparkles, Truck } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fbf8ef] px-4 py-16 text-[#17241d] sm:px-6 sm:py-20">
      <div className="pointer-events-none absolute -left-24 -top-32 size-96 rounded-full bg-[#ecd99e]/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 size-[420px] rounded-full bg-[#2f6b46]/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#e5b858]/25 via-[#e5b858] to-[#e5b858]/25" />

      <div className="relative w-full max-w-2xl text-center">
        <Link href="/" className="inline-flex items-center gap-2.5" aria-label="ঘরকথা হোম পেইজে যান">
          <span className="grid size-9 place-items-center rounded-xl bg-[#143c2d] text-[#e5b858] sm:size-10"><Leaf className="size-4 sm:size-5" /></span>
          <span className="text-left leading-tight"><span className="block text-base font-bold text-[#143c2d] sm:text-lg">ঘরকথা</span><span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-[#aa7928]">প্রকৃতির আপন স্বাদ</span></span>
        </Link>

        <div className="relative mx-auto mt-8 w-fit">
          <div className="grid size-36 place-items-center rounded-full border border-[#e7ddc7] bg-[#f4efdf] shadow-[0_20px_60px_-35px_rgba(39,54,38,.5)] sm:size-44">
            <span className="text-6xl font-extrabold tracking-tight text-[#143c2d] sm:text-7xl">৪০৪</span>
          </div>
          <span className="absolute -right-1 top-1 grid size-10 place-items-center rounded-full bg-[#e5b858] text-[#123526] shadow-lg sm:-right-3 sm:size-12"><PackageSearch className="size-5 sm:size-6" /></span>
          <span className="absolute -bottom-2 -left-2 grid size-10 place-items-center rounded-full bg-white text-[#2f6b46] shadow-lg sm:-left-4 sm:size-12"><ShoppingBag className="size-4 sm:size-5" /></span>
        </div>

        <span className="mt-8 inline-flex items-center gap-1.5 rounded-full border border-[#e8c887] bg-[#f8e9c9] px-3 py-1.5 text-[10px] font-bold text-[#8a5c13] sm:px-4 sm:py-2 sm:text-xs"><Sparkles className="size-3 sm:size-3.5" /> পেইজটি পাওয়া যায়নি</span>
        <h1 className="mx-auto mt-4 max-w-xl text-2xl font-bold leading-tight text-[#143c2d] sm:mt-5 sm:text-4xl">আপনি যা খুঁজছেন, তা এখানে নেই</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#687168]">লিংকটি ভুল হতে পারে অথবা পেইজটি সরানো হয়েছে। চিন্তা করবেন না—হোম পেইজে ফিরে খাঁটি মধু আর গাওয়া ঘি দেখতে পারেন।</p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#143c2d] px-6 text-sm font-bold text-white shadow-[0_12px_28px_-14px_rgba(20,60,45,.8)] transition hover:-translate-y-0.5 hover:bg-[#20553f] sm:min-h-14 sm:px-7"><ArrowLeft className="mr-2 size-4" /> হোম পেইজে ফিরুন</Link>
          <Link href="/#honey" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#d9cba7] bg-white/70 px-6 text-sm font-bold text-[#143c2d] transition hover:-translate-y-0.5 hover:bg-white sm:min-h-14 sm:px-7">মধু ও ঘি দেখুন <ArrowRight className="ml-2 size-4" /></Link>
        </div>

        <div className="mx-auto mt-10 grid max-w-lg grid-cols-1 gap-2 border-t border-[#e7ddc7] pt-6 sm:grid-cols-3">
          {[
            { icon: Leaf, text: 'খাঁটি ও প্রাকৃতিক' },
            { icon: Truck, text: 'ক্যাশ অন ডেলিভারি' },
            { icon: ShieldCheck, text: 'নিরাপদ প্যাকেজিং' },
          ].map(({ icon: Icon, text }) => <span key={text} className="inline-flex items-center justify-center gap-2 rounded-full bg-white/60 px-3 py-2 text-[11px] font-semibold text-[#526158] sm:text-xs"><Icon className="size-3.5 text-[#a77b2d]" /> {text}</span>)}
        </div>
      </div>
    </main>
  )
}
