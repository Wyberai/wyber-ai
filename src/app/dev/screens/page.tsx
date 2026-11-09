import { notFound } from 'next/navigation'
import { ScreensSandbox } from './ScreensSandbox'

// Local review harness for logged-in screens (fake data, no login). ?s=dashboard | clients | onboarding.
// Exists only when NEXT_PUBLIC_DEV_SANDBOX=1 is set; in a normal build the proxy sends visitors to login.
export default function Page() {
  if (process.env.NEXT_PUBLIC_DEV_SANDBOX !== '1') notFound()
  return <ScreensSandbox />
}
