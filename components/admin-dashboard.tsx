'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  Archive,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Eye,
  Filter,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react'
import type { AdminCustomer, AdminDashboardData, AdminMessage, AdminOrder } from '@/lib/admin-data'
import { DEFAULT_IMAGE, PRODUCT_IMAGES, UPLOAD_IMAGE_PREFIX, type ProductCategory, type StorePackage } from '@/lib/catalog'

type Section = 'overview' | 'orders' | 'products' | 'customers' | 'messages'
type OrderStatus = AdminOrder['status']
type PackageDraft = Omit<StorePackage, 'id'>
type CustomerDraft = Omit<AdminCustomer, 'id' | 'createdAt' | 'updatedAt'>
type PagingInfo = { page: number; totalPages: number; start: number; end: number; total: number }

const PAGE_SIZE = 8
const OVERVIEW_SIZE = 5

const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-sky-100 text-sky-800' },
  { value: 'shipped', label: 'Shipped', color: 'bg-violet-100 text-violet-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-rose-100 text-rose-800' },
  { value: 'fake', label: 'Fake', color: 'bg-slate-200 text-slate-700' },
]

const sectionMeta: Record<Section, { title: string; subtitle: string; icon: LucideIcon }> = {
  overview: { title: 'Overview', subtitle: 'A live snapshot of your store operations.', icon: LayoutDashboard },
  orders: { title: 'Orders', subtitle: 'Review, filter and update customer orders.', icon: ShoppingBag },
  products: { title: 'Products', subtitle: 'Manage honey and ghee catalog records.', icon: Package },
  customers: { title: 'Customers', subtitle: 'Track buyers, order history and contact details.', icon: CircleCheck },
  messages: { title: 'Messages', subtitle: 'Read and respond to customer enquiries.', icon: MessageCircle },
}

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

const emptyCustomerDraft: CustomerDraft = { name: '', phone: '', address: '', notes: '' }

const money = (amount: number) => `৳${new Intl.NumberFormat('en-BD').format(amount)}`
const dateTime = (value: string) => new Intl.DateTimeFormat('en-BD', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const shortId = (value: string) => value.slice(-6).toUpperCase()
const whatsapp = (phone: string) => `https://wa.me/${phone.replace(/^0/, '88')}`
const zoneLabel = (zone: 'dhaka' | 'outside') => zone === 'dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে'

function paginate<T>(items: T[], requestedPage: number, size = PAGE_SIZE) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / size))
  const page = Math.min(Math.max(1, requestedPage), totalPages)
  const start = (page - 1) * size
  const end = Math.min(start + size, total)
  return { items: items.slice(start, end), page, totalPages, start, end, total }
}

function getPageItems(current: number, total: number): Array<number | 'dots'> {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1)
  const keep = new Set([1, total, current - 1, current, current + 1])
  const pages = [...keep].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)
  const output: Array<number | 'dots'> = []
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) output.push('dots')
    output.push(page)
  })
  return output
}

export function AdminDashboard({ initialData }: { initialData: AdminDashboardData }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initialData.orders)
  const [packages, setPackages] = useState(initialData.packages)
  const [messages, setMessages] = useState(initialData.messages)
  const [customers, setCustomers] = useState(initialData.customers)
  const [section, setSection] = useState<Section>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'live' | 'hidden'>('all')
  const [orderPage, setOrderPage] = useState(1)
  const [productPage, setProductPage] = useState(1)
  const [messagePage, setMessagePage] = useState(1)
  const [customerPage, setCustomerPage] = useState(1)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [draft, setDraft] = useState<PackageDraft>(emptyDraft)
  const [editingId, setEditingId] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null)
  const [customerDraft, setCustomerDraft] = useState<CustomerDraft>(emptyCustomerDraft)
  const [editingCustomerId, setEditingCustomerId] = useState('')
  const [showCustomerForm, setShowCustomerForm] = useState(false)

  const todayKey = new Date().toDateString()
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === todayKey).length
  const pendingOrders = orders.filter((order) => order.status === 'pending').length
  const inProgressOrders = orders.filter((order) => ['confirmed', 'shipped'].includes(order.status)).length
  const revenue = orders.filter((order) => !['cancelled', 'fake'].includes(order.status)).reduce((sum, order) => sum + order.total, 0)
  const liveProducts = packages.filter((product) => product.active).length
  const hiddenProducts = packages.length - liveProducts

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setMobileNavOpen(false)
      setShowProductForm(false)
      setSelectedOrder(null)
      setSelectedMessage(null)
      setSelectedCustomer(null)
      setShowCustomerForm(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const locked = mobileNavOpen || showProductForm || showCustomerForm || Boolean(selectedOrder) || Boolean(selectedMessage) || Boolean(selectedCustomer)
    document.body.style.overflow = locked ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileNavOpen, showProductForm, showCustomerForm, selectedOrder, selectedMessage, selectedCustomer])

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter
      const matchesSearch = !query || order.orderNumber.toLowerCase().includes(query) || order.phone.includes(query) || order.customerName.toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [orders, search, statusFilter])

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    return packages.filter((product) => {
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      const matchesVisibility = visibilityFilter === 'all' || (visibilityFilter === 'live' ? product.active : !product.active)
      const matchesSearch = !query || product.title.toLowerCase().includes(query) || product.weight.toLowerCase().includes(query) || product.badge.toLowerCase().includes(query)
      return matchesCategory && matchesVisibility && matchesSearch
    })
  }, [packages, search, categoryFilter, visibilityFilter])

  const visibleMessages = useMemo(() => {
    const query = search.trim().toLowerCase()
    return messages.filter((item) => !query || item.name.toLowerCase().includes(query) || item.phone.includes(query) || item.message.toLowerCase().includes(query))
  }, [messages, search])

  const visibleCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return customers.filter((customer) => !query || customer.name.toLowerCase().includes(query) || customer.phone.includes(query) || customer.address.toLowerCase().includes(query))
  }, [customers, search])

  const orderPaging = useMemo(() => paginate(visibleOrders, orderPage), [visibleOrders, orderPage])
  const productPaging = useMemo(() => paginate(visibleProducts, productPage), [visibleProducts, productPage])
  const messagePaging = useMemo(() => paginate(visibleMessages, messagePage), [visibleMessages, messagePage])
  const customerPaging = useMemo(() => paginate(visibleCustomers, customerPage), [visibleCustomers, customerPage])

  const setBanner = (message: string, isError = false) => {
    setNotice(isError ? '' : message)
    setError(isError ? message : '')
    window.setTimeout(() => { setNotice(''); setError('') }, 4000)
  }

  const switchSection = (next: Section) => {
    setSection(next)
    setSearch('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setVisibilityFilter('all')
    setOrderPage(1)
    setProductPage(1)
    setMessagePage(1)
    setCustomerPage(1)
    setMobileNavOpen(false)
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
      setSelectedOrder((current) => current?.id === orderId ? { ...current, status } : current)
      setBanner('Order status updated.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not update order status.', true)
    } finally {
      setBusyId('')
    }
  }

  const refreshOrders = async () => {
    setBusyId('orders-refresh')
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
    if (!response.ok) throw new Error(result.error ?? 'Could not load products.')
    setPackages(result.packages as StorePackage[])
  }

  const refreshPackagesWithBanner = async () => {
    setBusyId('products-refresh')
    try {
      await refreshPackages()
      setBanner('Products refreshed.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not refresh products.', true)
    } finally {
      setBusyId('')
    }
  }

  const refreshMessages = async () => {
    setBusyId('messages-refresh')
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

  const refreshCustomers = async () => {
    setBusyId('customers-refresh')
    try {
      const response = await fetch('/api/customers', { cache: 'no-store' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not refresh customers.')
      setCustomers(result.customers as AdminCustomer[])
      setBanner('Customers refreshed.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not refresh customers.', true)
    } finally {
      setBusyId('')
    }
  }

  const startNewCustomer = () => {
    setCustomerDraft({ ...emptyCustomerDraft })
    setEditingCustomerId('')
    setShowCustomerForm(true)
    setNotice('')
    setError('')
  }

  const editCustomer = (customer: AdminCustomer) => {
    setCustomerDraft({ name: customer.name, phone: customer.phone, address: customer.address, notes: customer.notes })
    setEditingCustomerId(customer.id)
    setShowCustomerForm(true)
    setNotice('')
    setError('')
  }

  const saveCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusyId('customer-form')
    setError('')
    try {
      const response = await fetch(editingCustomerId ? `/api/customers/${editingCustomerId}` : '/api/customers', {
        method: editingCustomerId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerDraft),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not save customer.')
      await refreshCustomers()
      if (result.customer) setSelectedCustomer(result.customer as AdminCustomer)
      setShowCustomerForm(false)
      setCustomerDraft({ ...emptyCustomerDraft })
      setBanner(editingCustomerId ? 'Customer updated.' : 'Customer created.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not save customer.', true)
    } finally {
      setBusyId('')
    }
  }

  const deleteCustomer = async (customer: AdminCustomer) => {
    if (!window.confirm(`Delete customer “${customer.name}”? Order history will remain available in Orders.`)) return
    setBusyId(customer.id)
    try {
      const response = await fetch(`/api/customers/${customer.id}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not delete customer.')
      setCustomers((current) => current.filter((item) => item.id !== customer.id))
      setSelectedCustomer(null)
      setBanner('Customer deleted.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not delete customer.', true)
    } finally {
      setBusyId('')
    }
  }

  const refreshActive = () => {
    if (section === 'products') return refreshPackagesWithBanner()
    if (section === 'customers') return refreshCustomers()
    if (section === 'messages') return refreshMessages()
    return refreshOrders()
  }

  const startNewPackage = (category: ProductCategory = 'honey') => {
    setDraft({ ...emptyDraft, category, image: DEFAULT_IMAGE[category] })
    setEditingId('')
    setShowProductForm(true)
    setNotice('')
    setError('')
  }

  const editPackage = (product: StorePackage) => {
    const { id, ...values } = product
    setDraft(values)
    setEditingId(id)
    setShowProductForm(true)
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
      if (!response.ok) throw new Error(result.error ?? 'Could not save product.')
      await refreshPackages()
      setShowProductForm(false)
      setDraft({ ...emptyDraft })
      setBanner(editingId ? 'Product updated.' : 'Product created.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not save product.', true)
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
      if (!response.ok) throw new Error(result.error ?? 'Could not update product.')
      await refreshPackages()
      setBanner(product.active ? 'Product hidden from storefront.' : 'Product published to storefront.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not update product.', true)
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
      if (!response.ok) throw new Error(result.error ?? 'Could not delete product.')
      setPackages((current) => current.filter((item) => item.id !== product.id))
      setBanner('Product deleted.')
    } catch (caught) {
      setBanner(caught instanceof Error ? caught.message : 'Could not delete product.', true)
    } finally {
      setBusyId('')
    }
  }

  const logout = async () => {
    await fetch('/api/admin/login', { method: 'DELETE' })
    router.replace('/admin/login')
    router.refresh()
  }

  const navItems: { key: Section; label: string; icon: LucideIcon; count: number }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard, count: 0 },
    { key: 'orders', label: 'Orders', icon: ShoppingBag, count: orders.length },
    { key: 'products', label: 'Products', icon: Package, count: packages.length },
    { key: 'customers', label: 'Customers', icon: CircleCheck, count: customers.length },
    { key: 'messages', label: 'Messages', icon: MessageCircle, count: messages.length },
  ]

  const meta = sectionMeta[section]
  const customerOrders = selectedCustomer ? orders.filter((order) => order.phone === selectedCustomer.phone) : []
  const isRefreshing = ['orders-refresh', 'products-refresh', 'customers-refresh', 'messages-refresh'].includes(busyId)

  return (
    <div className="min-h-screen bg-[#f4f6f2] text-[#17241d] lg:flex">
      {mobileNavOpen && <button aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-40 bg-[#081b13]/60 backdrop-blur-sm lg:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[270px] shrink-0 flex-col border-r border-[#1d3d2f] bg-[#10291f] text-white transition-transform duration-300 lg:static lg:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
          <span className="grid size-10 place-items-center rounded-xl bg-[#e5b858] text-[#123526]"><Leaf className="size-5" /></span>
          <span className="leading-tight"><span className="block text-base font-bold">GhorKotha</span><span className="block text-[10px] font-semibold uppercase tracking-[.18em] text-[#e5b858]">Admin console</span></span>
          <button onClick={() => setMobileNavOpen(false)} className="ml-auto grid size-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 lg:hidden" aria-label="Close navigation"><X className="size-4" /></button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Workspace</p>
          <div className="grid gap-1">
            {navItems.map(({ key, label, icon: Icon, count }) => (
              <button key={key} onClick={() => switchSection(key)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${section === key ? 'bg-[#e5b858] text-[#123526] shadow-sm' : 'text-white/65 hover:bg-white/[.07] hover:text-white'}`}>
                <Icon className="size-[18px] shrink-0" />
                <span className="flex-1 text-left">{label}</span>
                {count > 0 && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${section === key ? 'bg-[#123526]/10 text-[#123526]' : 'bg-white/10 text-white/60'}`}>{count}</span>}
              </button>
            ))}
          </div>

          <p className="px-3 pb-2 pt-6 text-[10px] font-bold uppercase tracking-[.18em] text-white/35">Store</p>
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/65 transition hover:bg-white/[.07] hover:text-white"><ExternalLink className="size-[18px] shrink-0" />View storefront</a>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl border border-white/10 bg-white/[.05] p-3">
            <div className="flex items-center gap-2 text-xs font-semibold"><span className={`size-2 rounded-full ${initialData.databaseConfigured && !initialData.databaseError ? 'bg-emerald-400' : 'bg-rose-400'}`} />{initialData.databaseConfigured && !initialData.databaseError ? 'Database connected' : 'Database issue'}</div>
            <p className="mt-1 text-[11px] text-white/45">{liveProducts} live · {hiddenProducts} hidden products</p>
          </div>
          <button onClick={logout} className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/65 transition hover:bg-white/[.07] hover:text-white"><LogOut className="size-[18px]" />Sign out</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-[#e1e7df] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button onClick={() => setMobileNavOpen(true)} className="grid size-10 place-items-center rounded-xl border border-[#e3e8e1] text-[#526458] lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#9a7b3e]">Store operations</p>
            <h1 className="truncate text-lg font-bold text-[#173c2a] sm:text-xl">{meta.title}</h1>
          </div>
          <p className="hidden text-sm text-[#8a9389] xl:block">{meta.subtitle}</p>
          <button onClick={refreshActive} disabled={isRefreshing} className="grid size-10 place-items-center rounded-xl border border-[#e3e8e1] text-[#526458] transition hover:bg-[#f5f7f3] disabled:opacity-50" aria-label="Refresh current section"><RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} /></button>
          <button onClick={logout} className="hidden size-10 place-items-center rounded-xl border border-[#e3e8e1] text-[#526458] transition hover:bg-[#f5f7f3] sm:grid" aria-label="Sign out"><LogOut className="size-4" /></button>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
          {!initialData.databaseConfigured && <Banner tone="warning">Database not configured. Add <code className="rounded bg-white/70 px-1.5 py-0.5">MONGODB_URI</code> to manage live data.</Banner>}
          {initialData.databaseError && <Banner tone="error">Could not connect to MongoDB. Check your Atlas connection string and network access.</Banner>}
          {(notice || error) && <Banner tone={error ? 'error' : 'success'} dismissible onDismiss={() => { setNotice(''); setError('') }}>{error || notice}</Banner>}

          {section === 'overview' && <OverviewSection orders={orders} products={packages} messages={messages} customers={customers} metrics={{ todayOrders, pendingOrders, inProgressOrders, revenue }} onSectionChange={switchSection} onStatusChange={updateStatus} busyId={busyId} onViewOrder={setSelectedOrder} databaseLabel={initialData.databaseConfigured && !initialData.databaseError ? 'Connected' : 'Needs attention'} />}

          {section === 'orders' && <Panel eyebrow="Fulfilment" title="Order management" subtitle="Search, filter and update each customer order from one table." actions={<button onClick={refreshOrders} disabled={busyId === 'orders-refresh'} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe5dc] bg-white px-3.5 text-sm font-semibold text-[#526458] hover:bg-[#f7f9f5] disabled:opacity-50"><RefreshCw className={`size-4 ${busyId === 'orders-refresh' ? 'animate-spin' : ''}`} /> Refresh</button>}>
            <div className="flex flex-col gap-3 border-b border-[#edf0eb] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative lg:w-80"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9aa299]" /><input value={search} onChange={(event) => { setSearch(event.target.value); setOrderPage(1) }} placeholder="Search order, name or phone" className="h-10 w-full rounded-xl border border-[#e0e6dd] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#6f9b77]" /></div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#7b857b]"><Filter className="size-4" /> Status</span>
                <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setOrderPage(1) }} className="h-10 rounded-xl border border-[#e0e6dd] bg-white px-3 pr-8 text-sm font-semibold text-[#48594c] outline-none focus:border-[#6f9b77]"><option value="all">All statuses</option>{statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
              </div>
            </div>
            <OrderTable orders={orderPaging.items} busyId={busyId} onStatusChange={updateStatus} onView={setSelectedOrder} />
            <Pagination paging={orderPaging} onChange={setOrderPage} />
          </Panel>}

          {section === 'products' && <Panel eyebrow="Catalog" title="Product management" subtitle="Edit details, control visibility and keep the storefront catalog organised." actions={<div className="flex flex-wrap gap-2"><button onClick={() => startNewPackage('honey')} disabled={!initialData.databaseConfigured || initialData.databaseError} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#b7791f] px-4 text-sm font-semibold text-white hover:bg-[#c98a2a] disabled:opacity-50"><Sparkles className="size-4" /> Add honey</button><button onClick={() => startNewPackage('ghee')} disabled={!initialData.databaseConfigured || initialData.databaseError} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#1d5a3b] px-4 text-sm font-semibold text-white hover:bg-[#28734c] disabled:opacity-50"><Leaf className="size-4" /> Add ghee</button></div>}>
            <div className="flex flex-col gap-3 border-b border-[#edf0eb] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative lg:w-80"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9aa299]" /><input value={search} onChange={(event) => { setSearch(event.target.value); setProductPage(1) }} placeholder="Search title, weight or badge" className="h-10 w-full rounded-xl border border-[#e0e6dd] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#6f9b77]" /></div>
              <div className="flex flex-wrap items-center gap-2">
                <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value as 'all' | ProductCategory); setProductPage(1) }} className="h-10 rounded-xl border border-[#e0e6dd] bg-white px-3 pr-8 text-sm font-semibold text-[#48594c] outline-none focus:border-[#6f9b77]"><option value="all">All categories</option><option value="honey">Honey</option><option value="ghee">Ghee</option></select>
                <select value={visibilityFilter} onChange={(event) => { setVisibilityFilter(event.target.value as 'all' | 'live' | 'hidden'); setProductPage(1) }} className="h-10 rounded-xl border border-[#e0e6dd] bg-white px-3 pr-8 text-sm font-semibold text-[#48594c] outline-none focus:border-[#6f9b77]"><option value="all">All visibility</option><option value="live">Live</option><option value="hidden">Hidden</option></select>
              </div>
            </div>
            <ProductTable products={productPaging.items} busyId={busyId} canManage={initialData.databaseConfigured && !initialData.databaseError} onEdit={editPackage} onToggle={togglePackage} onDelete={deletePackage} />
            <Pagination paging={productPaging} onChange={setProductPage} />
          </Panel>}

          {section === 'customers' && <Panel eyebrow="CRM" title="Customer management" subtitle="See every buyer, their order history and contact details." actions={<div className="flex flex-wrap gap-2"><button onClick={refreshCustomers} disabled={busyId === 'customers-refresh'} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe5dc] bg-white px-3.5 text-sm font-semibold text-[#526458] hover:bg-[#f7f9f5] disabled:opacity-50"><RefreshCw className={`size-4 ${busyId === 'customers-refresh' ? 'animate-spin' : ''}`} /> Refresh</button><button onClick={startNewCustomer} disabled={!initialData.databaseConfigured || initialData.databaseError} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#174a31] px-4 text-sm font-semibold text-white hover:bg-[#205b3d] disabled:opacity-50"><Plus className="size-4" /> Add customer</button></div>}>
            <div className="flex flex-col gap-3 border-b border-[#edf0eb] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative lg:w-96"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9aa299]" /><input value={search} onChange={(event) => { setSearch(event.target.value); setCustomerPage(1) }} placeholder="Search name, phone or address" className="h-10 w-full rounded-xl border border-[#e0e6dd] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#6f9b77]" /></div>
              <p className="text-xs font-semibold text-[#7b857b]">{customers.length} total customers</p>
            </div>
            <CustomerTable customers={customerPaging.items} orders={orders} busyId={busyId} canManage={initialData.databaseConfigured && !initialData.databaseError} onView={setSelectedCustomer} onEdit={editCustomer} onDelete={deleteCustomer} />
            <Pagination paging={customerPaging} onChange={setCustomerPage} />
          </Panel>}

          {section === 'messages' && <Panel eyebrow="Inbox" title="Customer messages" subtitle="Questions sent from the storefront contact form." actions={<button onClick={refreshMessages} disabled={busyId === 'messages-refresh'} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe5dc] bg-white px-3.5 text-sm font-semibold text-[#526458] hover:bg-[#f7f9f5] disabled:opacity-50"><RefreshCw className={`size-4 ${busyId === 'messages-refresh' ? 'animate-spin' : ''}`} /> Refresh</button>}>
            <div className="flex flex-col gap-3 border-b border-[#edf0eb] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative lg:w-96"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9aa299]" /><input value={search} onChange={(event) => { setSearch(event.target.value); setMessagePage(1) }} placeholder="Search name, phone or message" className="h-10 w-full rounded-xl border border-[#e0e6dd] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#6f9b77]" /></div>
              <p className="text-xs font-semibold text-[#7b857b]">{messages.length} total messages</p>
            </div>
            <MessageTable messages={messagePaging.items} onView={setSelectedMessage} />
            <Pagination paging={messagePaging} onChange={setMessagePage} />
          </Panel>}
        </main>
      </div>

      {showProductForm && <ProductFormDrawer draft={draft} setDraft={setDraft} editingId={editingId} busy={busyId === 'package-form'} onClose={() => setShowProductForm(false)} onSubmit={savePackage} />}

      {selectedOrder && <DetailDrawer title={selectedOrder.orderNumber} subtitle={`Placed ${dateTime(selectedOrder.createdAt)}`} onClose={() => setSelectedOrder(null)} footer={<div className="flex flex-wrap gap-2"><a href={`tel:${selectedOrder.phone}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe5dc] px-4 text-sm font-semibold text-[#526458]"><Phone className="size-4" /> Call customer</a><a href={whatsapp(selectedOrder.phone)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#174a31] px-4 text-sm font-semibold text-white">WhatsApp</a></div>}>
        <div className="grid gap-5">
          <div className="grid gap-3 rounded-xl border border-[#e5e9e2] bg-[#f8faf7] p-4 sm:grid-cols-2">
            <DetailField label="Status"><StatusSelect value={selectedOrder.status} busy={busyId === selectedOrder.id} onChange={(status) => updateStatus(selectedOrder.id, status)} /></DetailField>
            <DetailField label="Customer">{selectedOrder.customerName}</DetailField>
            <DetailField label="Phone">{selectedOrder.phone}</DetailField>
            <DetailField label="Delivery zone">{zoneLabel(selectedOrder.deliveryZone)}</DetailField>
            <DetailField label="Address" wide>{selectedOrder.address}</DetailField>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#294333]">Ordered items</h3>
            <div className="mt-3 divide-y divide-[#edf0eb] overflow-hidden rounded-xl border border-[#e5e9e2]">
              {selectedOrder.items.map((item, index) => <div key={`${item.packageId}-${index}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><div className="min-w-0"><p className="truncate font-semibold text-[#334538]">{item.title}</p><p className="text-xs text-[#8a9389]">{item.weight || '—'} · Qty {item.quantity}</p></div><strong className="shrink-0 text-[#244833]">{money(item.price * item.quantity)}</strong></div>)}
            </div>
          </div>
          <div className="rounded-xl border border-[#e5e9e2] bg-white p-4 text-sm">
            <SummaryRow label="Subtotal" value={money(selectedOrder.subtotal)} />
            <SummaryRow label="Delivery" value={selectedOrder.deliveryCharge === 0 ? 'Free' : money(selectedOrder.deliveryCharge)} />
            <div className="mt-3 flex justify-between border-t border-[#edf0eb] pt-3 text-base font-bold text-[#173c2a]"><span>Total</span><span>{money(selectedOrder.total)}</span></div>
          </div>
        </div>
      </DetailDrawer>}

      {selectedMessage && <DetailDrawer title={selectedMessage.name} subtitle={`Received ${dateTime(selectedMessage.createdAt)}`} onClose={() => setSelectedMessage(null)} footer={<div className="flex flex-wrap gap-2"><a href={`tel:${selectedMessage.phone}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe5dc] px-4 text-sm font-semibold text-[#526458]"><Phone className="size-4" /> Call customer</a><a href={whatsapp(selectedMessage.phone)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#174a31] px-4 text-sm font-semibold text-white">WhatsApp</a></div>}>
        <div className="rounded-xl border border-[#e5e9e2] bg-[#f8faf7] p-4 text-sm leading-7 text-[#3d4e40]">{selectedMessage.message}</div>
        <p className="mt-4 text-xs text-[#8a9389]">Contact: {selectedMessage.phone}</p>
      </DetailDrawer>}

      {selectedCustomer && <DetailDrawer title={selectedCustomer.name} subtitle={`Customer since ${dateTime(selectedCustomer.createdAt)}`} onClose={() => setSelectedCustomer(null)} footer={<div className="flex flex-wrap gap-2"><a href={`tel:${selectedCustomer.phone}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe5dc] px-4 text-sm font-semibold text-[#526458]"><Phone className="size-4" /> Call customer</a><a href={whatsapp(selectedCustomer.phone)} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#174a31] px-4 text-sm font-semibold text-white">WhatsApp</a><button onClick={() => editCustomer(selectedCustomer)} disabled={!initialData.databaseConfigured || initialData.databaseError} className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dfe5dc] px-4 text-sm font-semibold text-[#526458] disabled:opacity-50"><Pencil className="size-4" /> Edit</button><button onClick={() => deleteCustomer(selectedCustomer)} disabled={!initialData.databaseConfigured || initialData.databaseError || busyId === selectedCustomer.id} className="inline-flex h-10 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 disabled:opacity-50"><Archive className="size-4" /> Delete</button></div>}>
        <div className="grid gap-5">
          <div className="grid gap-3 rounded-xl border border-[#e5e9e2] bg-[#f8faf7] p-4 sm:grid-cols-2">
            <DetailField label="Phone">{selectedCustomer.phone}</DetailField>
            <DetailField label="Total orders">{customerOrders.length}</DetailField>
            <DetailField label="Total spent">{money(customerOrders.filter((order) => !['cancelled', 'fake'].includes(order.status)).reduce((sum, order) => sum + order.total, 0))}</DetailField>
            <DetailField label="Last order">{customerOrders.length ? dateTime(customerOrders[0].createdAt) : '—'}</DetailField>
            <DetailField label="Address" wide>{selectedCustomer.address}</DetailField>
            {selectedCustomer.notes && <DetailField label="Internal notes" wide>{selectedCustomer.notes}</DetailField>}
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#294333]">Order history</h3>
            {customerOrders.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-[#e0e6dd] p-6 text-center text-sm text-[#899289]">No orders linked to this phone number yet.</p> : <div className="mt-3 divide-y divide-[#edf0eb] overflow-hidden rounded-xl border border-[#e5e9e2]">{customerOrders.map((order) => <div key={order.id} className="flex items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-[#334538]">{order.orderNumber}</p><p className="mt-1 text-xs text-[#899289]">{dateTime(order.createdAt)} · {order.items.length} items</p></div><div className="text-right"><p className="text-sm font-bold text-[#244833]">{money(order.total)}</p><p className="mt-1 text-[10px] font-bold uppercase text-[#9a7b3e]">{order.status}</p></div></div>)}</div>}
          </div>
        </div>
      </DetailDrawer>}

      {showCustomerForm && <CustomerFormDrawer draft={customerDraft} setDraft={setCustomerDraft} editingId={editingCustomerId} busy={busyId === 'customer-form'} onClose={() => setShowCustomerForm(false)} onSubmit={saveCustomer} />}
    </div>
  )
}

function Banner({ tone, children, dismissible, onDismiss }: { tone: 'warning' | 'error' | 'success'; children: React.ReactNode; dismissible?: boolean; onDismiss?: () => void }) {
  const styles = { warning: 'border-amber-200 bg-amber-50 text-amber-900', error: 'border-rose-200 bg-rose-50 text-rose-900', success: 'border-emerald-200 bg-emerald-50 text-emerald-800' }
  return <div className={`mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${styles[tone]}`}><div>{children}</div>{dismissible && <button onClick={onDismiss} className="grid size-7 shrink-0 place-items-center rounded-lg hover:bg-black/5" aria-label="Dismiss message"><X className="size-4" /></button>}</div>
}

function OverviewSection({ orders, products, messages, customers, metrics, onSectionChange, onStatusChange, busyId, onViewOrder, databaseLabel }: { orders: AdminOrder[]; products: StorePackage[]; messages: AdminMessage[]; customers: AdminCustomer[]; metrics: { todayOrders: number; pendingOrders: number; inProgressOrders: number; revenue: number }; onSectionChange: (section: Section) => void; onStatusChange: (id: string, status: OrderStatus) => void; busyId: string; onViewOrder: (order: AdminOrder) => void; databaseLabel: string }) {
  const recent = orders.slice(0, OVERVIEW_SIZE)
  const cards = [
    { title: "Today's orders", value: String(metrics.todayOrders), detail: 'Placed today', icon: CalendarDays, tone: 'gold' },
    { title: 'Pending', value: String(metrics.pendingOrders), detail: 'Need attention', icon: Clock3, tone: 'amber' },
    { title: 'In progress', value: String(metrics.inProgressOrders), detail: 'Confirmed or shipped', icon: Truck, tone: 'blue' },
    { title: 'Revenue', value: money(metrics.revenue), detail: 'Excludes cancelled / fake', icon: CircleDollarSign, tone: 'green' },
  ] as const

  return <div className="grid gap-5">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ title, value, detail, icon: Icon, tone }) => <MetricCard key={title} title={title} value={value} detail={detail} icon={Icon} tone={tone} />)}</div>
    <div className="grid gap-5 xl:grid-cols-[1.7fr_.9fr]">
      <Panel eyebrow="Live queue" title="Recent orders" subtitle="Latest customer orders waiting for review." actions={<button onClick={() => onSectionChange('orders')} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#dfe5dc] bg-white px-3 text-xs font-bold text-[#526458] hover:bg-[#f7f9f5]">View all <ChevronRight className="size-3.5" /></button>}>
        <OrderTable orders={recent} busyId={busyId} onStatusChange={onStatusChange} onView={onViewOrder} compact />
      </Panel>
      <Panel eyebrow="Snapshot" title="Store status" subtitle="Quick counts across the catalog and inbox.">
        <div className="grid gap-3 p-4">
          <QuickRow icon={Package} label="Live products" value={String(products.filter((product) => product.active).length)} onClick={() => onSectionChange('products')} />
          <QuickRow icon={Archive} label="Hidden products" value={String(products.filter((product) => !product.active).length)} onClick={() => onSectionChange('products')} />
          <QuickRow icon={CircleCheck} label="Customers" value={String(customers.length)} onClick={() => onSectionChange('customers')} />
          <QuickRow icon={MessageCircle} label="Total messages" value={String(messages.length)} onClick={() => onSectionChange('messages')} />
          <div className="mt-1 flex items-center justify-between rounded-xl border border-[#e5e9e2] bg-[#f8faf7] px-4 py-3 text-sm"><span className="font-semibold text-[#5b6b5e]">Database</span><span className="inline-flex items-center gap-2 font-bold text-[#244833]"><CircleCheck className="size-4 text-[#3d7d51]" /> {databaseLabel}</span></div>
          <button onClick={() => onSectionChange('products')} className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#174a31] text-sm font-bold text-white hover:bg-[#205b3d]"><Plus className="size-4" /> Manage catalog</button>
        </div>
      </Panel>
    </div>
  </div>
}

function Panel({ eyebrow, title, subtitle, actions, children }: { eyebrow: string; title: string; subtitle: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-[#e1e7df] bg-white shadow-sm shadow-[#1d3b27]/[.03]">
    <div className="flex flex-col gap-3 border-b border-[#edf0eb] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9a7b3e]">{eyebrow}</p><h2 className="mt-1 text-lg font-bold text-[#1a3828]">{title}</h2><p className="mt-1 text-xs text-[#869084]">{subtitle}</p></div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children}
  </section>
}

function MetricCard({ title, value, detail, icon: Icon, tone }: { title: string; value: string; detail: string; icon: LucideIcon; tone: 'green' | 'amber' | 'blue' | 'gold' }) {
  const tones = { green: 'bg-[#e8f0e4] text-[#37704b]', amber: 'bg-[#fbf0d8] text-[#aa7928]', blue: 'bg-[#e7eff7] text-[#547b9d]', gold: 'bg-[#f6ecd2] text-[#a57825]' }
  return <article className="rounded-xl border border-[#e1e7df] bg-white p-4 shadow-sm shadow-[#1d3b27]/[.03]"><div className="flex items-start justify-between"><span className={`grid size-10 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-[18px]" /></span><span className="rounded-full bg-[#f5f7f3] px-2.5 py-1 text-[10px] font-bold text-[#899287]">Live</span></div><p className="mt-4 text-xs font-semibold text-[#7d877d]">{title}</p><p className="mt-1 truncate text-2xl font-bold text-[#1c3e2b]">{value}</p><p className="mt-1 text-[11px] text-[#98a097]">{detail}</p></article>
}

function QuickRow({ icon: Icon, label, value, onClick }: { icon: LucideIcon; label: string; value: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center gap-3 rounded-xl border border-[#e5e9e2] px-4 py-3 text-left transition hover:border-[#b9cdbb] hover:bg-[#f8faf7]"><span className="grid size-9 place-items-center rounded-lg bg-[#edf2e9] text-[#4d7957]"><Icon className="size-4" /></span><span className="flex-1 text-sm font-semibold text-[#48594c]">{label}</span><span className="text-lg font-bold text-[#244833]">{value}</span><ChevronRight className="size-4 text-[#9aa299]" /></button>
}

function OrderTable({ orders, busyId, onStatusChange, onView, compact = false }: { orders: AdminOrder[]; busyId: string; onStatusChange: (id: string, status: OrderStatus) => void; onView: (order: AdminOrder) => void; compact?: boolean }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[940px] border-collapse text-left text-sm"><thead className="bg-[#f8faf7] text-[11px] uppercase tracking-wide text-[#7c877d]"><tr><th className="px-5 py-3 font-bold">Order / Date</th><th className="px-5 py-3 font-bold">Customer</th><th className="px-5 py-3 font-bold">Items</th><th className="px-5 py-3 font-bold">Delivery</th><th className="px-5 py-3 font-bold">Total</th><th className="px-5 py-3 font-bold">Status</th><th className="px-5 py-3 text-right font-bold">Action</th></tr></thead><tbody className="divide-y divide-[#edf0eb]">{orders.map((order) => <tr key={order.id} className="align-top transition hover:bg-[#fbfcfa]">
    <td className="px-5 py-3.5"><button onClick={() => onView(order)} className="block font-bold text-[#244833] hover:underline">{order.orderNumber}</button><span className="mt-1 block whitespace-nowrap text-xs text-[#939b92]">{dateTime(order.createdAt)}</span></td>
    <td className="px-5 py-3.5"><span className="block font-semibold text-[#35473a]">{order.customerName}</span><span className="mt-1 flex items-center gap-1.5 text-xs text-[#818a80]"><Phone className="size-3" />{order.phone}</span></td>
    <td className="px-5 py-3.5"><span className="block text-xs font-semibold text-[#4e5f51]">{order.items.length} item{order.items.length === 1 ? '' : 's'}</span><span className="mt-1 block max-w-[220px] truncate text-xs text-[#949c93]">{order.items.map((item) => `${item.title} × ${item.quantity}`).join(', ')}</span></td>
    <td className="px-5 py-3.5"><span className="block text-xs font-semibold text-[#4e5f51]">{zoneLabel(order.deliveryZone)}</span><span className="mt-1 block max-w-[220px] truncate text-xs text-[#949c93]">{order.address}</span></td>
    <td className="px-5 py-3.5"><strong className="block text-[#244833]">{money(order.total)}</strong><span className="mt-1 block text-xs text-[#949c93]">{money(order.subtotal)} + {order.deliveryCharge === 0 ? 'free' : money(order.deliveryCharge)}</span></td>
    <td className="px-5 py-3.5"><StatusSelect value={order.status} busy={busyId === order.id} onChange={(status) => onStatusChange(order.id, status)} /></td>
    <td className="px-5 py-3.5 text-right"><button onClick={() => onView(order)} className="inline-flex size-9 items-center justify-center rounded-lg border border-[#e2e7df] text-[#607064] hover:bg-[#f5f7f3]" aria-label={`View ${order.orderNumber}`}><Eye className="size-4" /></button></td>
  </tr>)}</tbody></table>{orders.length === 0 && <EmptyState icon={ShoppingBag} title="No orders found" message="Try a different search or status filter." />}{compact && orders.length > 0 && <div className="border-t border-[#edf0eb] px-5 py-3 text-xs text-[#8e978d]">Showing latest {orders.length} orders.</div>}</div>
}

function ProductTable({ products, busyId, canManage, onEdit, onToggle, onDelete }: { products: StorePackage[]; busyId: string; canManage: boolean; onEdit: (product: StorePackage) => void; onToggle: (product: StorePackage) => void; onDelete: (product: StorePackage) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[980px] border-collapse text-left text-sm"><thead className="bg-[#f8faf7] text-[11px] uppercase tracking-wide text-[#7c877d]"><tr><th className="px-5 py-3 font-bold">Product</th><th className="px-5 py-3 font-bold">Category</th><th className="px-5 py-3 font-bold">Price</th><th className="px-5 py-3 font-bold">Details</th><th className="px-5 py-3 font-bold">Visibility</th><th className="px-5 py-3 font-bold">Order</th><th className="px-5 py-3 text-right font-bold">Actions</th></tr></thead><tbody className="divide-y divide-[#edf0eb]">{products.map((product) => <tr key={product.id} className="align-top transition hover:bg-[#fbfcfa]">
    <td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className={`grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg ${product.category === 'honey' ? 'bg-[#fff3d6]' : 'bg-[#eaf2e4]'}`}><Image src={product.image} alt="" width={44} height={44} className="size-11 object-cover" /></span><div className="min-w-0"><button onClick={() => onEdit(product)} className="block max-w-[260px] truncate font-bold text-[#244833] hover:underline">{product.title}</button><span className="mt-1 block font-mono text-[10px] uppercase text-[#a0a79e]">ID {shortId(product.id)}</span></div></div></td>
    <td className="px-5 py-3.5"><span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${product.category === 'honey' ? 'bg-[#f7e9c8] text-[#8a5c13]' : 'bg-[#e2efd5] text-[#2f6b46]'}`}>{product.category === 'honey' ? 'Honey' : 'Ghee'}</span></td>
    <td className="px-5 py-3.5"><strong className="block text-[#244833]">{money(product.price)}</strong><span className="mt-1 block text-xs text-[#9aa299] line-through">{money(product.originalPrice)}</span></td>
    <td className="px-5 py-3.5"><span className="block text-xs font-semibold text-[#4e5f51]">{product.weight || '—'}</span><span className="mt-1 block max-w-[200px] truncate text-xs text-[#949c93]">{product.badge || 'No badge'}</span>{product.freeDelivery && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#3d7d51]"><Truck className="size-3" /> Free delivery</span>}</td>
    <td className="px-5 py-3.5"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${product.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}><span className={`size-1.5 rounded-full ${product.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />{product.active ? 'Live' : 'Hidden'}</span></td>
    <td className="px-5 py-3.5"><span className="font-mono text-xs text-[#667268]">#{product.sortOrder}</span></td>
    <td className="px-5 py-3.5"><div className="flex items-center justify-end gap-1.5"><button onClick={() => onEdit(product)} disabled={!canManage} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e2e7df] px-3 text-xs font-bold text-[#526458] hover:bg-[#f5f7f3] disabled:opacity-40"><Pencil className="size-3.5" /> Edit</button><button onClick={() => onToggle(product)} disabled={!canManage || busyId === product.id} className="grid size-9 place-items-center rounded-lg border border-[#e2e7df] text-[#607064] hover:bg-[#f5f7f3] disabled:opacity-40" aria-label={product.active ? 'Hide product' : 'Publish product'} title={product.active ? 'Hide product' : 'Publish product'}>{product.active ? <ArrowDownRight className="size-4" /> : <ArrowUpRight className="size-4" />}</button><button onClick={() => onDelete(product)} disabled={!canManage || busyId === product.id} className="grid size-9 place-items-center rounded-lg text-[#a45d4e] hover:bg-[#fff1ed] disabled:opacity-40" aria-label="Delete product" title="Delete product"><Archive className="size-4" /></button></div></td>
  </tr>)}</tbody></table>{products.length === 0 && <EmptyState icon={Package} title="No products found" message="Try another filter or add a new product." />}</div>
}

function MessageTable({ messages, onView }: { messages: AdminMessage[]; onView: (message: AdminMessage) => void }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[860px] border-collapse text-left text-sm"><thead className="bg-[#f8faf7] text-[11px] uppercase tracking-wide text-[#7c877d]"><tr><th className="px-5 py-3 font-bold">Contact</th><th className="px-5 py-3 font-bold">Message</th><th className="px-5 py-3 font-bold">Received</th><th className="px-5 py-3 text-right font-bold">Action</th></tr></thead><tbody className="divide-y divide-[#edf0eb]">{messages.map((item) => <tr key={item.id} className="align-top transition hover:bg-[#fbfcfa]"><td className="px-5 py-3.5"><span className="block font-bold text-[#244833]">{item.name}</span><span className="mt-1 block text-xs text-[#818a80]">{item.phone}</span></td><td className="px-5 py-3.5"><span className="block max-w-[560px] truncate text-[#4e5f51]">{item.message}</span></td><td className="px-5 py-3.5"><span className="whitespace-nowrap text-xs text-[#8e978d]">{dateTime(item.createdAt)}</span></td><td className="px-5 py-3.5 text-right"><div className="flex items-center justify-end gap-2"><a href={`tel:${item.phone}`} className="grid size-9 place-items-center rounded-lg border border-[#e2e7df] text-[#607064] hover:bg-[#f5f7f3]" aria-label="Call customer"><Phone className="size-4" /></a><button onClick={() => onView(item)} className="grid size-9 place-items-center rounded-lg border border-[#e2e7df] text-[#607064] hover:bg-[#f5f7f3]" aria-label="View message"><Eye className="size-4" /></button></div></td></tr>)}</tbody></table>{messages.length === 0 && <EmptyState icon={MessageCircle} title="No messages found" message="Try a different search term." />}</div>
}

function CustomerTable({ customers, orders, busyId, canManage, onView, onEdit, onDelete }: { customers: AdminCustomer[]; orders: AdminOrder[]; busyId: string; canManage: boolean; onView: (customer: AdminCustomer) => void; onEdit: (customer: AdminCustomer) => void; onDelete: (customer: AdminCustomer) => void }) {
  const linkedOrders = (phone: string) => orders.filter((order) => order.phone === phone)
  return <div className="overflow-x-auto"><table className="w-full min-w-[880px] border-collapse text-left text-sm"><thead className="bg-[#f8faf7] text-[11px] uppercase tracking-wide text-[#7c877d]"><tr><th className="px-5 py-3 font-bold">Customer</th><th className="px-5 py-3 font-bold">Phone</th><th className="px-5 py-3 font-bold">Address</th><th className="px-5 py-3 font-bold">Orders</th><th className="px-5 py-3 font-bold">Total spent</th><th className="px-5 py-3 font-bold">Joined</th><th className="px-5 py-3 text-right font-bold">Actions</th></tr></thead><tbody className="divide-y divide-[#edf0eb]">{customers.map((customer) => {
    const history = linkedOrders(customer.phone)
    const spent = history.filter((order) => !['cancelled', 'fake'].includes(order.status)).reduce((sum, order) => sum + order.total, 0)
    return <tr key={customer.id} className="align-top transition hover:bg-[#fbfcfa]">
      <td className="px-5 py-3.5"><button onClick={() => onView(customer)} className="block font-bold text-[#244833] hover:underline">{customer.name}</button><span className="mt-1 block font-mono text-[10px] uppercase text-[#a0a79e]">ID {shortId(customer.id)}</span></td>
      <td className="px-5 py-3.5"><span className="flex items-center gap-1.5 whitespace-nowrap text-[#4e5f51]"><Phone className="size-3 text-[#8a9389]" />{customer.phone}</span></td>
      <td className="px-5 py-3.5"><span className="block max-w-[280px] truncate text-xs text-[#6f7c70]" title={customer.address}>{customer.address}</span>{customer.notes && <span className="mt-1 block max-w-[280px] truncate text-[10px] italic text-[#a0a79e]">Note: {customer.notes}</span>}</td>
      <td className="px-5 py-3.5"><button onClick={() => onView(customer)} className="font-bold text-[#244833] hover:underline">{history.length}</button></td>
      <td className="px-5 py-3.5"><strong className="text-[#244833]">{money(spent)}</strong></td>
      <td className="px-5 py-3.5"><span className="whitespace-nowrap text-xs text-[#8e978d]">{dateTime(customer.createdAt)}</span></td>
      <td className="px-5 py-3.5"><div className="flex items-center justify-end gap-1.5"><button onClick={() => onView(customer)} className="grid size-9 place-items-center rounded-lg border border-[#e2e7df] text-[#607064] hover:bg-[#f5f7f3]" aria-label={`View ${customer.name}`}><Eye className="size-4" /></button><button onClick={() => onEdit(customer)} disabled={!canManage} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e2e7df] px-3 text-xs font-bold text-[#526458] hover:bg-[#f5f7f3] disabled:opacity-40"><Pencil className="size-3.5" /> Edit</button><button onClick={() => onDelete(customer)} disabled={!canManage || busyId === customer.id} className="grid size-9 place-items-center rounded-lg text-[#a45d4e] hover:bg-[#fff1ed] disabled:opacity-40" aria-label={`Delete ${customer.name}`} title="Delete customer"><Archive className="size-4" /></button></div></td>
    </tr>
  })}</tbody></table>{customers.length === 0 && <EmptyState icon={CircleCheck} title="No customers found" message="Customers are created automatically when an order is placed." />}</div>
}

function Pagination({ paging, onChange }: { paging: PagingInfo & { items: unknown }; onChange: (page: number) => void }) {
  if (paging.total === 0) return null
  const pages = getPageItems(paging.page, paging.totalPages)
  return <div className="flex flex-col items-center justify-between gap-3 border-t border-[#edf0eb] px-5 py-4 sm:flex-row"><p className="text-xs text-[#8e978d]">Showing <strong className="font-bold text-[#526458]">{paging.start + 1}–{paging.end}</strong> of <strong className="font-bold text-[#526458]">{paging.total}</strong></p><div className="flex items-center gap-1"><button onClick={() => onChange(paging.page - 1)} disabled={paging.page === 1} className="grid size-9 place-items-center rounded-lg border border-[#e2e7df] text-[#607064] hover:bg-[#f5f7f3] disabled:opacity-35" aria-label="Previous page"><ChevronLeft className="size-4" /></button>{pages.map((item, index) => item === 'dots' ? <span key={`dots-${index}`} className="grid size-9 place-items-center text-xs text-[#9aa299]">…</span> : <button key={item} onClick={() => onChange(item)} className={`grid size-9 place-items-center rounded-lg text-xs font-bold transition ${item === paging.page ? 'bg-[#174a31] text-white' : 'border border-[#e2e7df] text-[#607064] hover:bg-[#f5f7f3]'}`}>{item}</button>)}<button onClick={() => onChange(paging.page + 1)} disabled={paging.page === paging.totalPages} className="grid size-9 place-items-center rounded-lg border border-[#e2e7df] text-[#607064] hover:bg-[#f5f7f3] disabled:opacity-35" aria-label="Next page"><ChevronRight className="size-4" /></button></div></div>
}

function EmptyState({ icon: Icon, title, message }: { icon: LucideIcon; title: string; message: string }) {
  return <div className="flex min-h-52 flex-col items-center justify-center px-6 py-10 text-center"><span className="grid size-12 place-items-center rounded-xl bg-[#edf2e9] text-[#66866a]"><Icon className="size-5" /></span><h3 className="mt-4 font-bold text-[#294333]">{title}</h3><p className="mt-1 max-w-sm text-sm text-[#899289]">{message}</p></div>
}

function StatusSelect({ value, busy, onChange }: { value: OrderStatus; busy: boolean; onChange: (status: OrderStatus) => void }) {
  const option = statusOptions.find((item) => item.value === value) ?? statusOptions[0]
  return <div className="relative inline-flex"><select value={value} disabled={busy} onChange={(event) => onChange(event.target.value as OrderStatus)} className={`h-9 appearance-none rounded-full border-0 pl-3 pr-8 text-[11px] font-bold outline-none disabled:opacity-50 ${option.color}`} aria-label="Order status">{statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 opacity-60" /></div>
}

function DetailField({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return <div className={wide ? 'sm:col-span-2' : ''}><span className="block text-[10px] font-bold uppercase tracking-wide text-[#9aa299]">{label}</span><div className="mt-1 text-sm font-semibold text-[#35473a]">{children}</div></div>
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-[#697368]"><span>{label}</span><strong className="text-[#48594c]">{value}</strong></div>
}

function DetailDrawer({ title, subtitle, onClose, children, footer }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 flex justify-end"><button aria-label="Close details" onClick={onClose} className="absolute inset-0 cursor-default bg-[#081b13]/55 backdrop-blur-sm" /><aside role="dialog" aria-modal="true" className="relative flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-[#e3e8e1] px-5 py-4"><div className="min-w-0"><h2 className="truncate text-lg font-bold text-[#1a3828]">{title}</h2><p className="mt-1 text-xs text-[#899289]">{subtitle}</p></div><button onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#e3e8e1] text-[#657065] hover:bg-[#f5f7f3]" aria-label="Close details"><X className="size-4" /></button></div><div className="flex-1 overflow-y-auto p-5">{children}</div>{footer && <div className="border-t border-[#e3e8e1] bg-[#f8faf7] px-5 py-4">{footer}</div>}</aside></div>
}

function ProductFormDrawer({ draft, setDraft, editingId, busy, onClose, onSubmit }: { draft: PackageDraft; setDraft: (draft: PackageDraft) => void; editingId: string; busy: boolean; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const uploadedImage = draft.image.startsWith(UPLOAD_IMAGE_PREFIX)
  const images = uploadedImage
    ? [{ path: draft.image, label: 'আপলোড করা ছবি', category: draft.category }, ...PRODUCT_IMAGES.filter((image) => image.category === draft.category)]
    : PRODUCT_IMAGES.filter((image) => image.category === draft.category)

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch('/api/uploads', { method: 'POST', body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? 'Could not upload image.')
      setDraft({ ...draft, image: result.url as string })
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : 'Could not upload image.')
    } finally {
      event.target.value = ''
      setUploading(false)
    }
  }

  return <div className="fixed inset-0 z-50 flex justify-end"><button aria-label="Close product form" onClick={onClose} className="absolute inset-0 cursor-default bg-[#081b13]/55 backdrop-blur-sm" /><form onSubmit={onSubmit} className="relative flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl">
    <div className="flex items-start justify-between gap-4 border-b border-[#e3e8e1] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9a7b3e]">Catalog entry</p><h2 className="mt-1 text-lg font-bold text-[#1a3828]">{editingId ? 'Edit product' : 'Create product'}</h2><p className="mt-1 text-xs text-[#899289]">These details appear on the storefront product card.</p></div><button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#e3e8e1] text-[#657065] hover:bg-[#f5f7f3]" aria-label="Close product form"><X className="size-4" /></button></div>
    <div className="flex-1 overflow-y-auto p-5"><div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1.5 text-xs font-bold text-[#5e6b60]">Category<select value={draft.category} onChange={(event) => { const category = event.target.value as ProductCategory; setDraft({ ...draft, category, image: DEFAULT_IMAGE[category] }) }} className="h-10 rounded-xl border border-[#dfe5dc] px-3 text-sm font-normal text-[#283b2e] outline-none focus:border-[#75a17d]"><option value="honey">Honey</option><option value="ghee">Ghee</option></select></label>
      <AdminInput label="Weight / size" value={draft.weight} onChange={(value) => setDraft({ ...draft, weight: value })} required placeholder="500 গ্রাম / ১ কেজি" />
      <div className="sm:col-span-2"><AdminInput label="Product title" value={draft.title} onChange={(value) => setDraft({ ...draft, title: value })} required maxLength={90} /></div>
      <AdminInput label="Offer price (BDT)" type="number" min={1} value={String(draft.price || '')} onChange={(value) => setDraft({ ...draft, price: Number(value) })} required />
      <AdminInput label="Regular price (BDT)" type="number" min={1} value={String(draft.originalPrice || '')} onChange={(value) => setDraft({ ...draft, originalPrice: Number(value) })} required />
      <AdminInput label="Badge label" value={draft.badge} onChange={(value) => setDraft({ ...draft, badge: value })} maxLength={40} placeholder="Best seller" />
      <AdminInput label="Display order" type="number" min={0} value={String(draft.sortOrder)} onChange={(value) => setDraft({ ...draft, sortOrder: Number(value) })} />
      <label className="grid gap-1.5 text-xs font-bold text-[#5e6b60] sm:col-span-2">Description<textarea required value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} maxLength={240} rows={3} className="resize-y rounded-xl border border-[#dfe5dc] px-3 py-2.5 text-sm font-normal text-[#283b2e] outline-none focus:border-[#75a17d]" /></label>
      <fieldset className="grid gap-2 sm:col-span-2"><legend className="text-xs font-bold text-[#5e6b60]">Product image</legend><div className="grid grid-cols-3 gap-2">{images.map((image) => <button type="button" key={image.path} onClick={() => setDraft({ ...draft, image: image.path })} className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-2.5 text-center text-[10px] font-bold transition ${draft.image === image.path ? 'border-[#174a31] bg-[#eaf2e8] text-[#1d5a3b] ring-2 ring-[#174a31]/15' : 'border-[#dfe5dc] bg-white text-[#617064] hover:bg-[#f5f7f2]'}`}><span className={`grid size-12 place-items-center overflow-hidden rounded-lg ${image.category === 'honey' ? 'bg-[#fff3d6]' : 'bg-[#eef4e2]'}`}><Image src={image.path} alt="" width={48} height={48} className="size-12 object-cover" /></span>{image.label}</button>)}</div><label className={`mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-xs font-bold transition ${uploading ? 'border-[#174a31] bg-[#eaf2e8] text-[#1d5a3b]' : 'border-[#cbd7c9] bg-[#f8faf7] text-[#526458] hover:border-[#7ba283]'}`}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadImage} disabled={uploading} className="sr-only" />{uploading ? 'Uploading image…' : 'Upload custom image (JPG, PNG or WEBP, max 5 MB)'}</label>{uploadError && <p role="alert" className="text-[11px] font-semibold text-rose-700">{uploadError}</p>}</fieldset>
      <div className="flex flex-wrap gap-5 sm:col-span-2"><label className="inline-flex items-center gap-2 text-sm text-[#4f5f52]"><input type="checkbox" checked={draft.freeDelivery} onChange={(event) => setDraft({ ...draft, freeDelivery: event.target.checked })} className="size-4 accent-[#267047]" /> Free delivery</label><label className="inline-flex items-center gap-2 text-sm text-[#4f5f52]"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} className="size-4 accent-[#267047]" /> Visible on storefront</label></div>
    </div></div>
    <div className="flex items-center justify-end gap-2 border-t border-[#e3e8e1] bg-[#f8faf7] px-5 py-4"><button type="button" onClick={onClose} className="h-10 rounded-xl border border-[#dfe5dc] px-4 text-sm font-bold text-[#617064] hover:bg-[#f2f5f0]">Cancel</button><button disabled={busy} className="h-10 rounded-xl bg-[#174a31] px-5 text-sm font-bold text-white hover:bg-[#205b3d] disabled:opacity-50">{busy ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}</button></div>
  </form></div>
}

function CustomerFormDrawer({ draft, setDraft, editingId, busy, onClose, onSubmit }: { draft: CustomerDraft; setDraft: (draft: CustomerDraft) => void; editingId: string; busy: boolean; onClose: () => void; onSubmit: (event: React.FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed inset-0 z-50 flex justify-end"><button type="button" aria-label="Close customer form" onClick={onClose} className="absolute inset-0 cursor-default bg-[#081b13]/55 backdrop-blur-sm" /><form onSubmit={onSubmit} className="relative flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl">
    <div className="flex items-start justify-between gap-4 border-b border-[#e3e8e1] px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#9a7b3e]">Customer record</p><h2 className="mt-1 text-lg font-bold text-[#1a3828]">{editingId ? 'Edit customer' : 'Create customer'}</h2><p className="mt-1 text-xs text-[#899289]">Keep contact details accurate for fast delivery follow-up.</p></div><button type="button" onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl border border-[#e3e8e1] text-[#657065] hover:bg-[#f5f7f3]" aria-label="Close customer form"><X className="size-4" /></button></div>
    <div className="flex-1 overflow-y-auto p-5"><div className="grid gap-4">
      <AdminInput label="Customer name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} required maxLength={100} placeholder="Full name" />
      <AdminInput label="Mobile number" value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} required maxLength={11} placeholder="01XXXXXXXXX" />
      <label className="grid gap-1.5 text-xs font-bold text-[#5e6b60]">Delivery address<textarea required value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} maxLength={500} rows={3} className="resize-y rounded-xl border border-[#dfe5dc] px-3 py-2.5 text-sm font-normal text-[#283b2e] outline-none focus:border-[#75a17d]" /></label>
      <label className="grid gap-1.5 text-xs font-bold text-[#5e6b60]">Internal notes<textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} maxLength={500} rows={3} placeholder="Optional follow-up notes" className="resize-y rounded-xl border border-[#dfe5dc] px-3 py-2.5 text-sm font-normal text-[#283b2e] outline-none focus:border-[#75a17d]" /></label>
    </div></div>
    <div className="flex items-center justify-end gap-2 border-t border-[#e3e8e1] bg-[#f8faf7] px-5 py-4"><button type="button" onClick={onClose} className="h-10 rounded-xl border border-[#dfe5dc] px-4 text-sm font-bold text-[#617064] hover:bg-[#f2f5f0]">Cancel</button><button disabled={busy} className="h-10 rounded-xl bg-[#174a31] px-5 text-sm font-bold text-white hover:bg-[#205b3d] disabled:opacity-50">{busy ? 'Saving…' : editingId ? 'Save changes' : 'Create customer'}</button></div>
  </form></div>
}

function AdminInput({ label, value, onChange, required, placeholder, type = 'text', min, maxLength }: { label: string; value: string; onChange: (value: string) => void; required?: boolean; placeholder?: string; type?: string; min?: number; maxLength?: number }) {
  return <label className="grid gap-1.5 text-xs font-bold text-[#5e6b60]">{label}<input type={type} min={min} maxLength={maxLength} required={required} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-[#dfe5dc] px-3 text-sm font-normal text-[#283b2e] outline-none focus:border-[#75a17d]" /></label>
}
