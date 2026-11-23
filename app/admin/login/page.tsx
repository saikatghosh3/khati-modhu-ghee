import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AdminLogin } from '@/components/admin-login'
import { isAdminAuthenticated } from '@/lib/admin-auth'

export const metadata: Metadata = { title: 'অ্যাডমিন লগইন | ঘরকথা' }

export default async function AdminLoginPage() {
  if (await isAdminAuthenticated()) redirect('/admin/dashboard')
  return <AdminLogin />
}
