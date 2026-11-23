import { redirect } from 'next/navigation'
import { isAdminAuthenticated } from '@/lib/admin-auth'

export default async function AdminPage() {
  redirect((await isAdminAuthenticated()) ? '/admin/dashboard' : '/admin/login')
}
