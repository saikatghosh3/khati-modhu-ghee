'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Leaf,
  Menu,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react'

const navLinks = [
  { href: '#honey', label: 'মধু' },
  { href: '#ghee', label: 'ঘি' },
  { href: '#our-story', label: 'আমাদের কথা' },
  { href: '#faq', label: 'জিজ্ঞাসা' },
]

const announcementItems = [
  'সারা বাংলাদেশে ক্যাশ অন ডেলিভারি',
  'অর্ডারে ২–৪ কর্মদিবসের মধ্যে পৌঁছানো',
  'ভেজালমুক্ত মধু, নিরাপদ প্যাকেজিং',
  'দেশি গরুর দুধ থেকে তৈরি গাওয়া ঘি',
  'নির্বাচিত পণ্যে ফ্রি ডেলিভারি সুবিধা',
]

function AnnouncementBar() {
  return (
    <div className="relative flex h-9 items-center overflow-hidden bg-[#0f3024] text-[#f8e9c8] lg:h-10">
      <span className="relative z-10 flex h-full shrink-0 items-center gap-1.5 bg-[#d99f39] px-2.5 text-[10px] font-bold tracking-wide text-[#183622] sm:px-4 sm:text-xs">
        <Sparkles className="size-3 shrink-0 text-[#183622] sm:size-3.5" />
        বিশেষ সুবিধা
      </span>
      <div className="announcement-mask relative flex-1 overflow-hidden">
        <div className="announcement-track flex w-max items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {announcementItems.map((item) => (
                <span key={`${copy}-${item}`} className="flex shrink-0 items-center gap-2 whitespace-nowrap px-4 text-[11px] font-medium sm:px-6 sm:text-xs">
                  <Sparkles className="size-3 text-[#e5b858]" />
                  {item}
                  <span className="text-[#e5b858]/60">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SiteHeader({ itemCount, onCartOpen }: { itemCount: number; onCartOpen: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="fixed inset-x-0 top-0 z-40 border-b border-[#d8cfbb]/70 shadow-[0_10px_30px_-24px_rgba(20,60,45,.7)]">
      <AnnouncementBar />
      <header className="bg-[#fbf8ef]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 lg:h-[72px] lg:px-8">
          <a href="#home" onClick={closeMenu} className="flex min-w-0 items-center gap-2" aria-label="ঘরকথা হোম">
            <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#143c2d] text-[#f4ce7b] sm:size-10 sm:rounded-2xl"><Leaf className="size-4 sm:size-5" /></span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-base font-bold tracking-tight text-[#143c2d] sm:text-xl">ঘরকথা</span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a7754] sm:block">প্রকৃতির আপন স্বাদ</span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 md:flex" aria-label="প্রধান নেভিগেশন">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="rounded-full border-b-2 border-transparent px-4 py-2 text-sm font-semibold text-[#526158] transition hover:border-[#d99f39] hover:text-[#143c2d]">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button onClick={onCartOpen} className="relative grid size-9 place-items-center rounded-full border border-[#143c2d]/15 bg-white text-[#143c2d] transition hover:bg-[#f3ecdb] sm:size-11" aria-label={`কার্ট খুলুন, ${itemCount}টি পণ্য`}>
              <ShoppingBag className="size-4 sm:size-[19px]" />
              {itemCount > 0 && <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#d59c34] text-[9px] font-bold text-white sm:size-5 sm:text-[10px]">{itemCount}</span>}
            </button>
            <a href="#honey" className="hidden rounded-full bg-[#d99f39] px-5 py-2.5 text-sm font-bold text-[#183622] shadow-sm transition hover:bg-[#e6b752] lg:inline-flex">
              অর্ডার করুন <ArrowRight className="ml-2 size-4" />
            </a>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="grid size-9 place-items-center rounded-full border border-[#143c2d]/15 bg-white text-[#143c2d] transition hover:bg-[#f3ecdb] md:hidden"
              aria-label={menuOpen ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {menuOpen && <nav id="mobile-navigation" className="animate-in slide-in-from-top border-t border-[#e4dbc6] bg-[#fbf8ef]/98 px-3 pb-4 pt-2 shadow-lg backdrop-blur-md md:hidden" aria-label="মোবাইল নেভিগেশন">
          <div className="grid gap-1">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} onClick={closeMenu} className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold text-[#294333] transition hover:bg-[#f0e8d5]">
                {link.label}
                <ArrowRight className="size-4 text-[#aa7928]" />
              </a>
            ))}
          </div>
          <a href="#honey" onClick={closeMenu} className="mt-2 flex min-h-11 items-center justify-center rounded-full bg-[#d99f39] text-sm font-bold text-[#183622]">
            অর্ডার করুন <ArrowRight className="ml-2 size-4" />
          </a>
        </nav>}
      </header>
    </div>
  )
}
