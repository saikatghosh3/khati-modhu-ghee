import { connectToDatabase } from '@/lib/db'
import { CustomerModel } from '@/models/Customer'
import { OrderModel } from '@/models/Order'

export type AdminCustomer = {
  id: string
  name: string
  phone: string
  address: string
  notes: string
  createdAt: string
  updatedAt: string
}

const toDateString = (value: unknown) => new Date(value as string | number | Date).toISOString()

export function toAdminCustomer(record: Record<string, unknown>): AdminCustomer {
  return {
    id: String(record._id),
    name: String(record.name),
    phone: String(record.phone),
    address: String(record.address),
    notes: String(record.notes ?? ''),
    createdAt: toDateString(record.createdAt),
    updatedAt: toDateString(record.updatedAt),
  }
}

export async function syncCustomerFromOrder(input: { name: string; phone: string; address: string }) {
  await connectToDatabase()
  await CustomerModel.updateOne(
    { phone: input.phone },
    { $setOnInsert: { name: input.name, phone: input.phone, address: input.address, notes: '' } },
    { upsert: true },
  )
}

export async function backfillCustomersFromOrders() {
  await connectToDatabase()
  const grouped = await OrderModel.aggregate<{ _id: string; name: string; address: string }>([
    { $group: { _id: '$phone', name: { $first: '$customerName' }, address: { $first: '$address' } } },
  ])

  if (grouped.length === 0) return { matched: 0, inserted: 0 }
  const result = await CustomerModel.bulkWrite(grouped.map((row) => ({
    updateOne: {
      filter: { phone: row._id },
      update: { $setOnInsert: { name: row.name, phone: row._id, address: row.address, notes: '' } },
      upsert: true,
    },
  })))
  return { matched: result.matchedCount, inserted: result.upsertedCount }
}
