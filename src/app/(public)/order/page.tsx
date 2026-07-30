import type { Metadata } from 'next'

import { menuCategories, menuItems } from '@/content/menu'
import { OrderPage } from '@/components/order/OrderPage'

export const metadata: Metadata = {
  title: 'Online bestellen',
  description: 'Bestellen Sie zur Abholung im Viet Rice Berlin — Zahlung vor Ort.',
}

export default function Page() {
  return (
    <div className="pt-[var(--header-h)]">
      <OrderPage categories={menuCategories} items={menuItems} />
    </div>
  )
}
