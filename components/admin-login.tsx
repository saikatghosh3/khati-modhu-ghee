'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, Leaf, LockKeyhole } from 'lucide-react'

export function AdminLogin() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    const data = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.get('email'), password: data.get('password') }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not sign in.')
      router.replace('/admin/dashboard')
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-[#fbf8ef] lg:grid-cols-[1fr_.85fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#143c2d] p-10 text-white lg:flex xl:p-16">
        <div className="absolute -right-32 top-1/4 size-96 rounded-full border border-white/10" /><div className="absolute -right-20 top-[29%] size-72 rounded-full border border-white/10" />
        <a href="/" className="relative z-10 flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[#edc76d]"><Leaf className="size-5" /></span><span className="text-xl font-bold">GhorKotha</span></a>
        <div className="relative z-10 max-w-xl pb-10"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-4 py-2 text-xs font-medium text-[#edc76d]"><LockKeyhole className="size-3.5" /> Secure admin area</span><h1 className="mt-6 text-5xl font-bold leading-tight">Your business, <span className="text-[#edc76d]">in one place.</span></h1><p className="mt-5 max-w-md leading-7 text-white/65">Manage incoming orders, update packages, and get your products to customers with care.</p></div>
        <p className="relative z-10 text-xs text-white/45">© {new Date().getFullYear()} GhorKotha admin</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <a href="/" className="mb-12 inline-flex items-center gap-2 text-sm font-medium text-[#667267] transition hover:text-[#143c2d] lg:hidden"><Leaf className="size-4 text-[#9b792f]" /> Back to storefront</a>
          <div className="grid size-12 place-items-center rounded-2xl bg-[#e8f0e4] text-[#286144]"><LockKeyhole className="size-5" /></div>
          <span className="mt-7 block text-xs font-bold uppercase tracking-[0.2em] text-[#a77b2d]">Admin portal</span>
          <h2 className="mt-2 text-3xl font-bold text-[#143c2d]">Welcome back</h2>
          <p className="mt-2 text-sm leading-6 text-[#73796f]">Sign in with your admin credentials to manage orders and packages.</p>
          <form onSubmit={submit} className="mt-8 grid gap-5">
            <label className="grid gap-2 text-sm font-semibold text-[#384b3d]">Email address<input name="email" type="email" required autoComplete="email" className="h-12 rounded-xl border border-[#ded7c7] bg-white px-4 text-sm font-normal outline-none focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" placeholder="admin@gmil.com" /></label>
            <label className="grid gap-2 text-sm font-semibold text-[#384b3d]">Password<span className="relative block"><input name="password" required autoComplete="current-password" type={showPassword ? 'text' : 'password'} className="h-12 w-full rounded-xl border border-[#ded7c7] bg-white px-4 pr-12 text-sm font-normal outline-none focus:border-[#5c8763] focus:ring-2 focus:ring-[#5c8763]/15" placeholder="Your password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-[#7b8279] hover:bg-[#f0e8d5]" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>
            {error && <p role="alert" className="rounded-xl border border-[#e7c8bd] bg-[#fff4ef] px-4 py-3 text-sm text-[#9c442d]">{error}</p>}
            <button disabled={isSubmitting} className="mt-1 inline-flex min-h-13 items-center justify-center rounded-full bg-[#143c2d] px-6 font-bold text-white transition hover:bg-[#20553f] disabled:opacity-60">{isSubmitting ? 'Signing in…' : 'Sign in securely'} {!isSubmitting && <ArrowRight className="ml-2 size-4" />}</button>
          </form>
          <p className="mt-6 text-center text-xs leading-5 text-[#96958b]">This area is restricted to authorized administrators.</p>
        </div>
      </section>
    </main>
  )
}
