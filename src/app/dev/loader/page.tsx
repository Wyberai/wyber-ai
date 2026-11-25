import { notFound } from 'next/navigation'
import { WyberLoader, AnimatedMark } from '@/components/shared/WyberLoader'

// Review page for the loading animation. Exists only when NEXT_PUBLIC_DEV_SANDBOX=1.
export default function Page() {
  if (process.env.NEXT_PUBLIC_DEV_SANDBOX !== '1') notFound()
  return (
    <div>
      <WyberLoader />
      <div style={{ position: 'fixed', bottom: 16, left: 16, display: 'flex', gap: 24, color: '#8797ab', font: '13px system-ui' }}>
        <span><AnimatedMark size={32} state="idle" /> idle</span>
        <span><AnimatedMark size={32} state="still" /> still</span>
      </div>
    </div>
  )
}
