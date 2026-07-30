import type { Metadata } from 'next'

import { getMenuData } from '@/server/catalogue'
import { OrderPage } from '@/components/order/OrderPage'

export const metadata: Metadata = {
  title: 'Online bestellen',
  description: 'Bestellen Sie zur Abholung im Viet Rice Berlin — Zahlung vor Ort.',
}

export default async function Page() {
  const { categories, items } = await getMenuData()

  return (
    <div className="pt-[var(--header-h)]">
      <OrderPage categories={categories} items={items} />
    </div>
  )
}
