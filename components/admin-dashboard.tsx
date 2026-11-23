'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Archive,
  CalendarDays,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Filter,
  Leaf,
  LogOut,
  MessageCircle,
  Package,
  Pencil,
  Phone,
  Sparkles,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from 'lucide-react'
import type { AdminDashboardData, AdminMessage, AdminOrder } from '@/lib/admin-data'
import { DEFAULT_IMAGE, PRODUCT_IMAGES, type ProductCategory, type StorePackage } from '@/lib/catalog'

type OrderStatus = AdminOrder['status']
type PackageDraft = Omit<StorePackage, 'id'>

const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-sky-100 text-sky-800' },
  { value: 'shipped', label: 'Shipped', color: 'bg-violet-100 text-violet-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-rose-100 text-rose-800' },
  { value: 'fake', label: 'Fake', color: 'bg-slate-100 text-slate-700' },
]

const emptyDraft: PackageDraft = {
  category: 'honey',
  title: '',
  description: '',
  weight: '',
  image: DEFAULT_IMAGE.honey,
  price: 0,
  originalPrice: 0,
  badge: '',
  freeDelivery: false,
  active: true,
  sortOrder: 0,
}

const money = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`
const dateTime = (value: string) => new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

export function AdminDashboard({ initialData }: { initialData: AdminDashboardData }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialData.orders)
  const [packages, setPackages] = useState(initialData.packages)
  const [messages, setMessages] = useState(initialData.messages)
  const [tab, setTab] = useState<'orders' | 'packages' | 'messages'>('orders')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [productFilter, setProductFilter] = useState<'all' | ProductCategory>('all')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [draft, setDraft] = useState<PackageDraft>(emptyDraft)
  const [editingId, setEditingId] = useState('')
  const [showForm, setShowForm] = useState(false)

  const todayKey = new Date().toDateString()
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === todayKey).length
  const pendingOrders = orders.filter((order) => order.status === 'pending').length
  const completedOrders = orders.filter((order) => ['confirmed', 'shipped', 'delivered'].includes(order.status)).length
  const revenue = orders.filter((order) => !['cancelled', 'fake'].includes(order.status)).reduce((sum, order) => sum + order.total, 0)

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const matchesSearch = !query || order.orderNumber.toLowerCase().includes(query) || order.phone.toLowerCase().includes(query) || order.customerName.toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [orders, search, statusFilter])

  const visibleProducts = useMemo(
    () => packages.filter((product) => productFilter === 'all' || product.category === productFilter),
    [packages, productFilter],
  )

  const setBanner = (message: string, isError = false) => {
    setNotice(isError ? '' : message)
    setError(isError ? message : '')
    window.setTimeout(() => { setNotice(''); setError('') }, 4500)
  }

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setBusyId(orderId)
    setNotice('')
    setError('')
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not update order status.')
      setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order))
      setBanner('Order status updated.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not update order status.', true)
    } finally {
      setBusyId('')
    }
  }

  const refreshOrders = async () => {
    setBusyId('orders-refresh')
    setError('')
    try {
      const response = await fetch('/api/orders', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not refresh orders.')
      setOrders(result.orders as AdminOrder[])
      setBanner('Orders refreshed.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not refresh orders.', true)
    } finally {
      setBusyId('')
    }
  }

  const refreshPackages = async () => {
    const response = await fetch('/api/packages?all=1', { cache: 'no-store' })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error ?? 'Could not load packages.')
    setPackages(result.packages as StorePackage[])
  }

  const refreshMessages = async () => {
    setBusyId('messages-refresh')
    setError('')
    try {
      const response = await fetch('/api/messages', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not refresh messages.')
      setMessages(result.messages as AdminMessage[])
      setBanner('Messages refreshed.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not refresh messages.', true)
    } finally {
      setBusyId('')
    }
  }

  const startNewPackage = (category: ProductCategory = 'honey') => {
    setDraft({ ...emptyDraft, category, image: DEFAULT_IMAGE[category] })
    setEditingId('')
    setShowForm(true)
    setNotice('')
    setError('')
  }

  const editPackage = (product: StorePackage) => {
    const { id, ...values } = product
    setDraft(values)
    setEditingId(id)
    setShowForm(true)
    setNotice('')
    setError('')
  }

  const savePackage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusyId('package-form')
    setError('')
    const payload = {
      ...draft,
      price: Number(draft.price),
      originalPrice: Number(draft.originalPrice),
      sortOrder: Number(draft.sortOrder),
    }
    try {
      const response = await fetch(editingId ? `/api/packages/${editingId}` : '/api/packages', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not save package.')
      await refreshPackages()
      setShowForm(false)
      setDraft({ ...emptyDraft })
      setBanner(editingId ? 'Package updated.' : 'Package created.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not save package.', true)
    } finally {
      setBusyId('')
    }
  }

  const togglePackage = async (product: StorePackage) => {
    setBusyId(product.id)
    try {
      const response = await fetch(`/api/packages/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not update package.')
      await refreshPackages()
      setBanner(product.active ? 'Package is now hidden.' : 'Package is now live.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not update package.', true)
    } finally {
      setBusyId('')
    }
  }

  const deletePackage = async (product: StorePackage) => {
    if (!window.confirm(`Delete “${product.title}”? Existing orders will remain unchanged.`)) return
    setBusyId(product.id)
    try {
      const response = await fetch(`/api/packages/${product.id}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not delete package.')
      setPackages((current) => current.filter((item) => item.id !== product.id))
      setBanner('Package deleted.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not delete package.', true)
    } finally {
      setBusyId('')
    }
  }

  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' })
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-[#17241d]">
      <header className="sticky top-0 z-30 border-b border-[#dfe7df] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-7 lg:px-10">
          <a href="/" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#143c2d] text-[#edc76d]"><Leaf className="size-5" /></span><span><span className="block text-lg font-bold text-[#143c2d]">GhorKotha</span><span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-[#879086]">Store admin</span></span></a>
          <div className="flex items-center gap-3"><span className="hidden text-sm text-[#748076] sm:block">Operations dashboard</span><button onClick={logout} className="inline-flex size-10 items-center justify-center rounded-xl border border-[#e1e6df] text-[#68736a] transition hover:bg-[#f4f6f1]" aria-label="Log out"><LogOut className="size-4" /></button></div>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#9b772f]">Store operations</p><h1 className="mt-2 text-3xl font-bold text-[#143c2d] sm:text-4xl">Overview</h1><p className="mt-2 text-sm text-[#748076]">Manage incoming orders and your storefront packages.</p></div><div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#dce5da] bg-white px-4 py-2 text-xs font-semibold text-[#4e6852]"><span className="size-2 rounded-full bg-[#4b9b62]" /> Admin session active</div></div>

        {!initialData.databaseConfigured && <div role="status" className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Database not configured.</strong> Add <code className="rounded bg-white/70 px-1.5 py-0.5">MONGODB_URI</code> to connect order and package management. Preview packages are read-only.</div>}
        {initialData.databaseError && <div role="alert" className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><strong>Could not connect to MongoDB.</strong> Check your Atlas connection string and network access.</div>}
        {(notice || error) && <div role={error ? 'alert' : 'status'} className={`mt-5 flex items-center justify-between rounded-xl px-4 py-3 text-sm ${error ? 'border border-rose-200 bg-rose-50 text-rose-800' : 'border border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{error || notice}<button onClick={() => { setError(''); setNotice('') }} className="grid size-7 place-items-center rounded-lg" aria-label="Dismiss message"><X className="size-4" /></button></div>}

        <section aria-label="Store metrics" className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <MetricCard title="Total orders" value={orders.length.toLocaleString('en-BD')} detail="All time" icon={ShoppingBag} tone="green" trend="Live" />
          <MetricCard title="Pending" value={pendingOrders.toLocaleString('en-BD')} detail="Need attention" icon={Clock3} tone="amber" trend={pendingOrders ? 'Action needed' : 'Up to date'} />
          <MetricCard title="Confirmed / shipped" value={completedOrders.toLocaleString('en-BD')} detail="In progress or complete" icon={Truck} tone="blue" trend="Orders" />
          <MetricCard title="Today&apos;s orders" value={todayOrders.toLocaleString('en-BD')} detail="Placed today" icon={CalendarDays} tone="gold" trend="Today" />
          <MetricCard title="Revenue" value={money(revenue)} detail="Excluding cancelled / fake" icon={CircleDollarSign} tone="green" trend="All time" />
        </section>

        <div className="mt-8 flex items-center gap-2 border-b border-[#dfe5dd]">
          <button onClick={() => setTab('orders')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${tab === 'orders' ? 'border-[#1a5a3a] text-[#16472f]' : 'border-transparent text-[#7b857b] hover:text-[#36463a]'}`}><ShoppingBag className="size-4" /> Orders <span className={`rounded-full px-2 py-0.5 text-[10px] ${tab === 'orders' ? 'bg-[#e8f0e4] text-[#326647]' : 'bg-[#e9ece6] text-[#778077]'}`}>{orders.length}</span></button>
          <button onClick={() => setTab('packages')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${tab === 'packages' ? 'border-[#1a5a3a] text-[#16472f]' : 'border-transparent text-[#7b857b] hover:text-[#36463a]'}`}><Package className="size-4" /> Products <span className={`rounded-full px-2 py-0.5 text-[10px] ${tab === 'packages' ? 'bg-[#e8f0e4] text-[#326647]' : 'bg-[#e9ece6] text-[#778077]'}`}>{packages.length}</span></button>
          <button onClick={() => setTab('messages')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${tab === 'messages' ? 'border-[#1a5a3a] text-[#16472f]' : 'border-transparent text-[#7b857b] hover:text-[#36463a]'}`}><MessageCircle className="size-4" /> Messages <span className={`rounded-full px-2 py-0.5 text-[10px] ${tab === 'messages' ? 'bg-[#e8f0e4] text-[#326647]' : 'bg-[#e9ece6] text-[#778077]'}`}>{messages.length}</span></button>
        </div>

        {tab === 'orders' ? <section className="pt-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h2 className="text-xl font-bold text-[#1a3828]">Recent orders</h2><p className="mt-1 text-xs text-[#80897f]">Review customer details and update fulfillment status.</p></div>          <div className="flex flex-col gap-2 sm:flex-row">
            <button onClick={refreshOrders} disabled={busyId === 'orders-refresh'} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe5dc] bg-white px-3 text-sm font-semibold text-[#526458] hover:bg-[#f5f7f2] disabled:opacity-60"><RefreshCw className={`size-4 ${busyId === 'orders-refresh' ? 'animate-spin' : ''}`} /> Refresh</button>
            <label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#929a90]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, phone, order ID" className="h-10 w-full rounded-xl border border-[#dfe5dc] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#75a17d] sm:w-64" /></label>
            <label className="relative"><Filter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#929a90]" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-[#dfe5dc] bg-white pl-9 pr-9 text-sm outline-none focus:border-[#75a17d] sm:w-44"><option value="all">All statuses</option>{statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-[#929a90]" /></label>
          </div></div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#e0e6dd] bg-white shadow-sm shadow-[#223c27]/[.03]">
            {visibleOrders.length === 0 ? <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-[#edf2e9] text-[#66866a]"><Archive className="size-5" /></span><h3 className="mt-4 font-semibold text-[#294333]">{orders.length ? 'No matching orders' : 'No orders yet'}</h3><p className="mt-1 max-w-sm text-sm text-[#7d877d]">{orders.length ? 'Try changing your search or status filter.' : 'New customer orders will appear here as soon as they are placed.'}</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1020px] border-collapse text-left text-sm"><thead className="bg-[#f7f8f4] text-[11px] uppercase tracking-wide text-[#758075]"><tr><th className="px-5 py-3.5 font-semibold">Order / date</th><th className="px-5 py-3.5 font-semibold">Customer</th><th className="px-5 py-3.5 font-semibold">Items</th><th className="px-5 py-3.5 font-semibold">Delivery address</th><th className="px-5 py-3.5 font-semibold">Total</th><th className="px-5 py-3.5 font-semibold">Status</th></tr></thead><tbody className="divide-y divide-[#edf0eb]">{visibleOrders.map((order) => <tr key={order.id} className="align-top transition hover:bg-[#fbfcf9]"><td className="px-5 py-4"><span className="block font-bold text-[#244833]">{order.orderNumber}</span><span className="mt-1 block whitespace-nowrap text-xs text-[#899187]">{dateTime(order.createdAt)}</span></td><td className="px-5 py-4"><span className="block font-semibold text-[#334538]">{order.customerName}</span><span className="mt-1 flex items-center gap-1.5 text-xs text-[#778278]"><Phone className="size-3" />{order.phone}</span><div className="mt-2 flex gap-2"><a className="text-[11px] font-semibold text-[#326b48] hover:underline" href={`tel:${order.phone}`}>Call</a><a className="text-[11px] font-semibold text-[#326b48] hover:underline" href={`https://wa.me/${order.phone.replace(/^0/, '88')}`} target="_blank" rel="noreferrer">WhatsApp</a></div></td><td className="max-w-[210px] px-5 py-4"><span className="block text-xs leading-5 text-[#5f6c61]">{order.items.map((item) => `${item.title} × ${item.quantity}`).join(', ')}</span><span className="mt-1 block text-[11px] text-[#929a90]">{order.deliveryZone === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'}</span></td><td className="max-w-[230px] px-5 py-4 text-xs leading-5 text-[#647065]">{order.address}</td><td className="whitespace-nowrap px-5 py-4"><span className="font-bold text-[#244833]">{money(order.total)}</span><span className="mt-1 block text-[11px] text-[#8b9389]">COD</span></td><td className="px-5 py-4"><div className="relative"><select disabled={busyId === order.id} aria-label={`Status for ${order.orderNumber}`} value={order.status} onChange={(event) => updateStatus(order.id, event.target.value as OrderStatus)} className={`h-9 appearance-none rounded-full border-0 pl-3 pr-8 text-xs font-bold outline-none ring-1 ring-inset ring-black/5 disabled:opacity-60 ${statusOptions.find((item) => item.value === order.status)?.color}`}>
              {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 opacity-60" /></div></td></tr>)}</tbody></table></div>}
          </div>
          <p className="mt-3 text-xs text-[#8c948a]">Showing {visibleOrders.length} of {orders.length} orders. The dashboard loads the latest 250 orders.</p>
        </section> : tab === 'packages' ? <section className="pt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold text-[#1a3828]">Product manager</h2><p className="mt-1 text-xs text-[#80897f]">Create honey and ghee products, then publish or hide them on the storefront.</p></div><div className="flex gap-2"><button onClick={() => startNewPackage('honey')} disabled={!initialData.databaseConfigured || initialData.databaseError} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#b7791f] px-4 text-sm font-semibold text-white transition hover:bg-[#c98a2a] disabled:cursor-not-allowed disabled:opacity-50"><Sparkles className="mr-2 size-4" /> Add honey</button><button onClick={() => startNewPackage('ghee')} disabled={!initialData.databaseConfigured || initialData.databaseError} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#1d5a3b] px-4 text-sm font-semibold text-white transition hover:bg-[#28734c] disabled:cursor-not-allowed disabled:opacity-50"><Leaf className="mr-2 size-4" /> Add ghee</button></div></div>
          <div className="mt-5 flex flex-wrap gap-2">{([{ value: 'all', label: 'All products' }, { value: 'honey', label: 'Honey' }, { value: 'ghee', label: 'Ghee' }] as const).map((option) => <button key={option.value} onClick={() => setProductFilter(option.value)} className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${productFilter === option.value ? 'border-[#174a31] bg-[#174a31] text-white' : 'border-[#dfe5dc] bg-white text-[#617064] hover:bg-[#f5f7f2]'}`}>{option.label} <span className="ml-1 opacity-70">{option.value === 'all' ? packages.length : packages.filter((product) => product.category === option.value).length}</span></button>)}</div>
          {showForm && <form onSubmit={savePackage} className="mt-5 rounded-2xl border border-[#dfe6dc] bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between"><div><h3 className="font-semibold text-[#244833]">{editingId ? 'Edit product' : 'Create a product'}</h3><p className="mt-1 text-xs text-[#7c867d]">This information appears in the honey or ghee section of the storefront.</p></div><button type="button" onClick={() => setShowForm(false)} className="grid size-8 place-items-center rounded-lg text-[#879087] hover:bg-[#f3f5f0]" aria-label="Close product form"><X className="size-4" /></button></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-1.5 text-xs font-semibold text-[#5e6b60]">Category<select value={draft.category} onChange={(event) => { const category = event.target.value as ProductCategory; setDraft({ ...draft, category, image: DEFAULT_IMAGE[category] }) }} className="h-10 rounded-xl border border-[#dfe5dc] px-3 text-sm font-normal text-[#283b2e] outline-none focus:border-[#75a17d]"><option value="honey">Honey section</option><option value="ghee">Ghee section</option></select></label>
              <AdminInput label="Product title" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} required maxLength={90} />
              <AdminInput label="Weight / size" value={draft.weight} onChange={(value) => setDraft({ ...draft, weight: value })} required placeholder="500g / ১ কেজি" />
              <fieldset className="grid gap-2 sm:col-span-2 lg:col-span-3"><legend className="text-xs font-semibold text-[#5e6b60]">Product image</legend><div className="flex flex-wrap gap-2">{PRODUCT_IMAGES.filter((image) => image.category === draft.category).map((image) => <button type="button" key={image.path} onClick={() => setDraft({ ...draft, image: image.path })} className={`flex items-center gap-2 rounded-xl border px-2 py-2 text-left text-[11px] font-semibold transition ${draft.image === image.path ? 'border-[#174a31] bg-[#eaf2e8] text-[#1d5a3b] ring-2 ring-[#174a31]/15' : 'border-[#dfe5dc] bg-white text-[#617064] hover:bg-[#f5f7f2]'}`}><span className={`grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg ${image.category === 'honey' ? 'bg-[#fff3d6]' : 'bg-[#eef4e2]'}`}><Image src={image.path} alt="" width={48} height={48} className="size-12 object-cover" /></span>{image.label}</button>)}</div></fieldset>
              <AdminInput label="Offer price (BDT)" type="number" min={1} value={String(draft.price || '')} onChange={(value) => setDraft({ ...draft, price: Number(value) })} required />
              <AdminInput label="Regular price (BDT)" type="number" min={1} value={String(draft.originalPrice || '')} onChange={(value) => setDraft({ ...draft, originalPrice: Number(value) })} required />
              <AdminInput label="Badge label" value={draft.badge} onChange={(value) => setDraft({ ...draft, badge: value })} maxLength={40} placeholder="Best seller" />
              <AdminInput label="Display order" type="number" min={0} value={String(draft.sortOrder)} onChange={(value) => setDraft({ ...draft, sortOrder: Number(value) })} />
              <label className="grid gap-1.5 text-xs font-semibold text-[#5e6b60] sm:col-span-2 lg:col-span-2">Description<textarea required value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} maxLength={240} rows={2} className="resize-y rounded-xl border border-[#dfe5dc] px-3 py-2.5 text-sm font-normal text-[#283b2e] outline-none focus:border-[#75a17d]" /></label>
              <div className="flex flex-wrap items-center gap-5 sm:col-span-2 lg:col-span-3"><label className="inline-flex items-center gap-2 text-sm text-[#4f5f52]"><input type="checkbox" checked={draft.freeDelivery} onChange={(event) => setDraft({ ...draft, freeDelivery: event.target.checked })} className="size-4 accent-[#267047]" /> Free delivery</label><label className="inline-flex items-center gap-2 text-sm text-[#4f5f52]"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} className="size-4 accent-[#267047]" /> Visible on storefront</label></div>
            </div>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-[#dfe5dc] px-4 py-2.5 text-sm font-semibold text-[#617064] hover:bg-[#f6f7f3]">Cancel</button><button disabled={busyId === 'package-form'} className="rounded-xl bg-[#174a31] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#205b3d] disabled:opacity-60">{busyId === 'package-form' ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}</button></div>
          </form>}
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleProducts.map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-[#e0e6dd] bg-white shadow-sm shadow-[#223c27]/[.03]">
            <div className={`relative h-32 ${product.category === 'honey' ? 'bg-[#fff5dc]' : 'bg-[#edf4e3]'}`}>
              <Image src={product.image} alt="" fill sizes="(max-width: 768px) 90vw, 30vw" className="object-cover" />
              <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold ${product.category === 'honey' ? 'bg-[#f7e6bf] text-[#8a5c13]' : 'bg-[#e2efd5] text-[#2f6b46]'}`}>{product.category === 'honey' ? 'Honey' : 'Ghee'}</span>
              <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold ${product.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{product.active ? 'Live' : 'Hidden'}</span>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold text-[#244833]">{product.title}</h3>{product.badge && <span className="rounded-full bg-[#f5efdE] px-2.5 py-1 text-[10px] font-bold text-[#93712f]">{product.badge}</span>}</div>
              <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-[#798379]">{product.description}</p>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#f7f8f4] p-3 text-xs"><span className="text-[#92998f]">Weight / size</span><strong className="font-semibold text-[#4e5f51]">{product.weight}</strong></div>
              <div className="mt-4 flex items-end justify-between"><div><span className="block text-xs text-[#969c93] line-through">{money(product.originalPrice)}</span><strong className="mt-0.5 block text-xl text-[#a77b2d]">{money(product.price)}</strong></div>{product.freeDelivery && <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f0e4] px-2.5 py-1.5 text-[10px] font-semibold text-[#3c704d]"><Truck className="size-3" /> Free delivery</span>}</div>
              <div className="mt-4 flex gap-2 border-t border-[#edf0eb] pt-3"><button onClick={() => editPackage(product)} disabled={!initialData.databaseConfigured} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#dfe5dc] py-2 text-xs font-semibold text-[#526458] hover:bg-[#f5f7f2] disabled:opacity-50"><Pencil className="size-3.5" /> Edit</button><button onClick={() => togglePackage(product)} disabled={busyId === product.id || !initialData.databaseConfigured} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[#dfe5dc] py-2 text-xs font-semibold text-[#526458] hover:bg-[#f5f7f2] disabled:opacity-50">{product.active ? <><ArrowDownRight className="size-3.5" /> Hide</> : <><ArrowUpRight className="size-3.5" /> Publish</>}</button><button onClick={() => deletePackage(product)} disabled={busyId === product.id || !initialData.databaseConfigured} className="grid size-8 place-items-center rounded-lg text-[#a15b4d] hover:bg-[#fff0ed] disabled:opacity-50" aria-label={`Delete ${product.title}`}><Archive className="size-3.5" /></button></div>
            </div>
          </article>)}</div>
          {visibleProducts.length === 0 && <p className="mt-5 rounded-2xl border border-dashed border-[#d8dfd5] p-8 text-center text-sm text-[#7c867d]">No products in this section yet. Add one to publish it to the storefront.</p>}
        </section> : <section className="pt-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold text-[#1a3828]">Customer messages</h2><p className="mt-1 text-xs text-[#80897f]">Questions sent from the storefront footer.</p></div><button onClick={refreshMessages} disabled={busyId === 'messages-refresh'} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#dfe5dc] bg-white px-4 text-sm font-semibold text-[#526458] hover:bg-[#f5f7f2] disabled:opacity-60"><RefreshCw className={`size-4 ${busyId === 'messages-refresh' ? 'animate-spin' : ''}`} /> Refresh</button></div>
          {messages.length === 0 ? <div className="mt-5 flex min-h-60 flex-col items-center justify-center rounded-2xl border border-[#e0e6dd] bg-white px-6 text-center"><span className="grid size-12 place-items-center rounded-2xl bg-[#edf2e9] text-[#66866a]"><MessageCircle className="size-5" /></span><h3 className="mt-4 font-semibold text-[#294333]">No messages yet</h3><p className="mt-1 max-w-sm text-sm text-[#7d877d]">Messages sent from the storefront footer will appear here.</p></div> : <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{messages.map((item) => <article key={item.id} className="rounded-2xl border border-[#e0e6dd] bg-white p-5 shadow-sm shadow-[#223c27]/[.03]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-bold text-[#244833]">{item.name}</h3><p className="mt-1 text-xs text-[#778278]">{dateTime(item.createdAt)}</p></div><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#eaf2e8] text-[#326b48]"><MessageCircle className="size-4" /></span></div><p className="mt-4 rounded-xl bg-[#f7f8f4] p-3 text-sm leading-6 text-[#4e5f51]">{item.message}</p><div className="mt-4 flex items-center justify-between border-t border-[#edf0eb] pt-3"><a href={`tel:${item.phone}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#326b48] hover:underline"><Phone className="size-3.5" /> {item.phone}</a><a href={`https://wa.me/${item.phone.replace(/^0/, '88')}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#326b48] hover:underline">WhatsApp</a></div></article>)}</div>}
        </section>}
      </div>
    </main>
  )
}

function MetricCard({ title, value, detail, icon: Icon, tone, trend }: { title: string; value: string; detail: string; icon: typeof ShoppingBag; tone: 'green' | 'amber' | 'blue' | 'gold'; trend: string }) {
  const iconStyles = { green: 'bg-[#e8f0e4] text-[#37704b]', amber: 'bg-[#fbf0d8] text-[#aa7928]', blue: 'bg-[#e7eff7] text-[#547b9d]', gold: 'bg-[#f6ecd2] text-[#a57825]' }
  return <article className="rounded-2xl border border-[#e1e7de] bg-white p-4 shadow-sm shadow-[#223c27]/[.03] sm:p-5"><div className="flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-xl ${iconStyles[tone]}`}><Icon className="size-[18px]" /></span><span className="rounded-full bg-[#f5f7f3] px-2.5 py-1 text-[10px] font-semibold text-[#7c877c]">{trend}</span></div><p className="mt-4 text-xs font-medium text-[#788379]">{title}</p><p className="mt-1 truncate text-2xl font-bold text-[#1c3e2b] sm:text-[1.7rem]">{value}</p><p className="mt-1 text-[11px] text-[#969d94]">{detail}</p></article>
}

function AdminInput({ label, value, onChange, required, placeholder, type = 'text', min, maxLength }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; type?: string; min?: number; maxLength?: number }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-[#5e6b60]">{label}<input type={type} min={min} maxLength={maxLength} required={required} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-[#dfe5dc] px-3 text-sm font-normal text-[#283b2e] outline-none focus:border-[#75a17d]" /></label>
}
