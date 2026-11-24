'use client'

import { useEffect, useState } from 'react'

const KEY = 'ghorkotha_loaded'

export function InitialLoader() {
  const [show, setShow] = useState(true)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) || document.documentElement.dataset.ghLoaded === '1') {
        setShow(false)
        return
      }
    } catch {
      setShow(false)
      return
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    let done = false
    const finish = () => {
      if (done) return
      done = true
      setLeaving(true)
      window.setTimeout(() => {
        setShow(false)
        try {
          sessionStorage.setItem(KEY, '1')
          document.documentElement.dataset.ghLoaded = '1'
        } catch {}
        document.body.style.overflow = prevOverflow
      }, 650)
    }

    const minTime = window.setTimeout(finish, 2100)
    const maxTime = window.setTimeout(finish, 3600)
    const onLoad = () => {
      window.clearTimeout(minTime)
      window.setTimeout(finish, 850)
    }

    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })

    return () => {
      window.clearTimeout(minTime)
      window.clearTimeout(maxTime)
      window.removeEventListener('load', onLoad)
      document.body.style.overflow = prevOverflow
    }
  }, [])

  if (!show) return null

  return (
    <div
      aria-hidden="true"
      className={`gh-initial-loader fixed inset-0 z-[100] overflow-hidden bg-[#102f23] transition-opacity duration-700 ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(229,184,88,.16),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(244,206,123,.12),transparent_38%),linear-gradient(180deg,#163f30_0%,#102f23_55%,#0c241b_100%)]" />
      <div className="loader-grain pointer-events-none absolute inset-0 opacity-[0.05]" />
      <div className="pointer-events-none absolute -left-24 top-[-6rem] size-80 rounded-full bg-[#e5b858]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-[-7rem] size-96 rounded-full bg-[#d99f39]/10 blur-3xl" />

      <div className={`relative flex min-h-full flex-col items-center justify-center px-6 text-center transition-all duration-700 ${leaving ? 'scale-[.985] translate-y-2' : 'scale-100 translate-y-0'}`}>
        <div className="relative mb-8">
          <div className="loader-orbit absolute -inset-5 rounded-full border border-[#e5b858]/15" />
          <div className="loader-orbit-rev absolute -inset-10 rounded-full border border-[#f4ce7b]/10" />
          <div className="absolute -inset-3 rounded-[2.2rem] bg-[#e5b858]/10 blur-xl" />
          <div className="relative grid size-24 place-items-center rounded-[2rem] border border-[#e5b858]/25 bg-[#143c2d]/80 shadow-[0_20px_60px_-20px_rgba(0,0,0,.55)] backdrop-blur-sm sm:size-28">
            <div className="absolute inset-[7px] rounded-[1.55rem] border border-[#f4ce7b]/10" />
            <svg width="52" height="52" viewBox="0 0 180 180" fill="none" className="loader-mark relative" aria-hidden="true">
              <path d="M128 52C98 52 72 66 60 90C52 106 52 124 60 138C76 124 90 104 96 82C102 104 114 122 128 134C140 120 144 102 140 84C136 66 128 52 128 52Z" fill="url(#lg1)" />
              <path d="M92 138C92 138 88 112 96 92" stroke="#FFF4D3" strokeWidth="6" strokeLinecap="round" />
              <path d="M58 142C74 134 86 122 96 108" stroke="#FFF4D3" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.9" />
              <defs>
                <linearGradient id="lg1" x1="62" y1="52" x2="138" y2="140" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F4CE7B" />
                  <stop offset="1" stopColor="#D99F39" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-[#d7b15a]/85 sm:text-xs">ঘরকথা</p>
        <h1 className="mt-4 max-w-md text-3xl font-bold leading-tight tracking-tight text-[#fbf8ef] sm:text-[2.6rem]">
          খাঁটির স্বাদ, <span className="text-[#e5b858]">ঘরের কথা</span>
        </h1>
        <p className="mt-3 text-sm text-[#ddd5c2]/72 sm:text-[15px]">খাঁটি গাওয়া ঘি ও সুন্দরবনের মধু</p>

        <div className="mt-10 w-52 sm:w-60">
          <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
            <div className="loader-progress h-full rounded-full bg-gradient-to-r from-[#b8841f] via-[#e5b858] to-[#f7d889]" />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d7c79f]/55">
            <span className="size-1 rounded-full bg-[#e5b858]/70" />
            Loading
            <span className="size-1 rounded-full bg-[#e5b858]/70" />
          </div>
        </div>
      </div>
    </div>
  )
}
