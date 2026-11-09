'use client'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const GTMCanvas = dynamic(() => import('./GTMCanvas'), { ssr: false, loading: () => (
  <div style={{ height: '100vh', background: '#05080d', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8797ab', fontFamily: 'system-ui' }}>Loading canvas...</div>
) })

export default function NewCampaignPage() {
  return <Suspense><GTMCanvas /></Suspense>
}
