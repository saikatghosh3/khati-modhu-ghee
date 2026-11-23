'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, MessageCircle, Send, X } from 'lucide-react'

type Props = {
  open: boolean
  onClose: () => void
}

export function MessageSidebar({ open, onClose }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  const submitMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('sending')
    setError('')
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), message: message.trim() }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'মেসেজ পাঠানো যায়নি।')
      setName('')
      setPhone('')
      setMessage('')
      setStatus('sent')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'মেসেজ পাঠানো যায়নি।')
      setStatus('error')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="মেসেজ বন্ধ করুন" className="absolute inset-0 cursor-default bg-[#0d1b13]/60 backdrop-blur-[2px]" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-labelledby="message-sidebar-title" className="relative flex h-full w-full max-w-[480px] flex-col bg-[#fbf8ef] shadow-2xl animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between border-b border-[#e4dbc6] bg-[#143c2d] px-5 py-5 text-white sm:px-7">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-[#edc76d]"><MessageCircle className="size-3.5" /> আমাদের মেসেজ দিন</span>
            <h2 id="message-sidebar-title" className="mt-3 text-2xl font-bold">কোনো প্রশ্ন আছে?</h2>
          </div>
          <button onClick={onClose} className="grid size-10 place-items-center rounded-full border border-white/20 text-white transition hover:bg-white/10" aria-label="মেসেজ বন্ধ করুন"><X className="size-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <p className="text-sm leading-7 text-[#687168]">অর্ডার, ডেলিভারি বা পণ্য নিয়ে যেকোনো কথা জানাতে এই ফর্ম ব্যবহার করুন।</p>

          {status === 'sent' ? <div className="mt-6 rounded-2xl border border-[#c9ddc7] bg-[#eaf3e7] p-6 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#d8e9d3] text-[#2f7045]"><Check className="size-6" /></span>
            <p className="mt-4 font-bold text-[#204c31]">মেসেজ পাঠানো হয়েছে!</p>
            <p className="mt-2 text-xs leading-6 text-[#647568]">আমরা শিগগিরই আপনার সঙ্গে যোগাযোগ করব।</p>
            <button onClick={onClose} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#1d5a3b] px-6 text-sm font-bold text-white">বন্ধ করুন</button>
          </div> : <form onSubmit={submitMessage} className="mt-6 grid gap-4">
            <label className="grid gap-1.5 text-xs font-semibold text-[#4e5a50]">আপনার নাম<input required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="নাম লিখুন" className="h-12 rounded-xl border border-[#ded7c7] bg-white px-4 text-sm font-normal text-[#17241d] outline-none transition placeholder:text-[#aaa99f] focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" /></label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#4e5a50]">মোবাইল নম্বর<input required type="tel" inputMode="numeric" pattern="01[3-9][0-9]{8}" maxLength={11} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01XXXXXXXXX" className="h-12 rounded-xl border border-[#ded7c7] bg-white px-4 text-sm font-normal text-[#17241d] outline-none transition placeholder:text-[#aaa99f] focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" /></label>
            <label className="grid gap-1.5 text-xs font-semibold text-[#4e5a50]">আপনার বার্তা<textarea required minLength={5} maxLength={1000} rows={6} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="কী জানতে চাইবেন?" className="resize-none rounded-xl border border-[#ded7c7] bg-white px-4 py-3 text-sm font-normal text-[#17241d] outline-none transition placeholder:text-[#aaa99f] focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" /></label>
            {status === 'error' && <p role="alert" className="rounded-xl border border-[#e7c8bd] bg-[#fff4ef] px-4 py-3 text-sm text-[#9c442d]">{error}</p>}
            <button disabled={status === 'sending'} className="inline-flex min-h-14 items-center justify-center rounded-full bg-[#d99f39] px-6 text-sm font-bold text-[#183622] transition hover:bg-[#e7b64e] disabled:cursor-not-allowed disabled:opacity-60">{status === 'sending' ? 'পাঠানো হচ্ছে…' : 'মেসেজ পাঠান'} <Send className="ml-2 size-4" /></button>
          </form>}
        </div>

        <div className="border-t border-[#e4dbc6] bg-[#f4efdf] px-5 py-4 text-xs leading-6 text-[#778278] sm:px-7">
          সোমবার–শনিবার, সকাল ৯টা–সন্ধ্যা ৬টা · <a href="mailto:admin@gmil.com" className="font-semibold text-[#1d5a3b] hover:underline">admin@gmil.com</a> <ArrowRight className="inline size-3" />
        </div>
      </aside>
    </div>
  )
}
