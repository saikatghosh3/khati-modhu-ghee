import Link from 'next/link'
import { ArrowLeft, FileText, Leaf, ShieldCheck } from 'lucide-react'

type LegalSection = {
  heading: string
  paragraphs?: string[]
  items?: { title: string; text: string }[]
}

export function LegalPage({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro: string; sections: LegalSection[] }) {
  return (
    <main className="min-h-screen bg-[#fbf8ef] text-[#17241d]">
      <section className="relative overflow-hidden bg-[#143c2d] px-4 py-14 text-white sm:px-6 sm:py-20 lg:px-8">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-32 right-1/4 size-72 rounded-full bg-[#e5b858]/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#e8c477] transition hover:text-white"><ArrowLeft className="size-4" /> হোমে ফিরে যান</Link>
          <span className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-4 py-2 text-[11px] font-bold tracking-wide text-[#edc76d]"><FileText className="size-4" /> {eyebrow}</span>
          <h1 className="mt-5 text-3xl font-bold sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">{intro}</p>
          <p className="mt-6 text-xs text-white/50">সর্বশেষ হালনাগাদ: {new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-[#e5dcc6] bg-white p-5">
            <span className="grid size-10 place-items-center rounded-xl bg-[#e8f0e4] text-[#286144]"><ShieldCheck className="size-5" /></span>
            <p className="mt-4 text-sm font-bold text-[#173c2a]">আপনার তথ্য, আমাদের দায়িত্ব</p>
            <p className="mt-2 text-xs leading-6 text-[#728072]">ঘরকথা কেবল অর্ডার পৌঁছে দেওয়া ও আপনার প্রশ্নের উত্তর দেওয়ার জন্য তথ্য ব্যবহার করে।</p>
            <Link href="/#contact" className="mt-4 inline-flex items-center font-bold text-[#1c5539]">আমাদের মেসেজ দিন <ArrowLeft className="ml-2 size-4 rotate-180" /></Link>
          </div>
        </aside>

        <div className="space-y-5">
          {sections.map((section, index) => <section key={section.heading} className="rounded-[1.5rem] border border-[#e5dcc6] bg-white p-6 sm:p-8">
            <div className="flex items-start gap-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f6ecd2] text-sm font-bold text-[#a57924]">{String(index + 1).padStart(2, '0')}</span><div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-[#173c2a]">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-3 text-sm leading-7 text-[#657066]">{paragraph}</p>)}
              {section.items?.map((item) => <div key={item.title} className="mt-4 border-t border-[#eee7d8] pt-4"><h3 className="text-sm font-bold text-[#2c4d38]">{item.title}</h3><p className="mt-1.5 text-sm leading-7 text-[#657066]">{item.text}</p></div>)}
            </div></div>
          </section>)}
          <div className="flex items-center gap-3 rounded-2xl bg-[#f0e8d5] p-5 text-sm text-[#5e6b60]"><Leaf className="size-5 shrink-0 text-[#a57924]" /> এই নীতি সম্পর্কে প্রশ্ন থাকলে নিচের ফুটারের মেসেজ ফর্ম ব্যবহার করে আমাদের জানাতে পারেন।</div>
        </div>
      </div>
    </main>
  )
}
