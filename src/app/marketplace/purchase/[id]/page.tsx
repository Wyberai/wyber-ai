import { PurchaseFinalizingClient } from './PurchaseFinalizingClient'

export const dynamic = 'force-dynamic'

export default async function PurchaseFinalizingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PurchaseFinalizingClient purchaseId={id} />
}
