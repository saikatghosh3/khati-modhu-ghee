import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdminDashboard } from '@/components/admin-dashboard'
import { getAdminDashboardData } from '@/lib/admin-data'
import { isAdminAuthenticated } from '@/lib/admin-auth'

export const metadata: Metadata = { title: 'অর্ডার ও প্যাকেজ | ঘরকথা অ্যাডমিন' }
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  if (!(await isAdminAuthenticated())) redirect('/admin/login')
  const data = await getAdminDashboardData()
  return <AdminDashboard initialData={data} />
}
