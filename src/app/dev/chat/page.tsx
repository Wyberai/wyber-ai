import { notFound } from 'next/navigation'
import { ChatSandbox } from './ChatSandbox'

// Local review harness for the editor chat panel (no login, fake data, no network writes).
// It exists only when NEXT_PUBLIC_DEV_SANDBOX=1 is set at build or dev time. Vercel never sets it.
export default function Page() {
  if (process.env.NEXT_PUBLIC_DEV_SANDBOX !== '1') notFound()
  return <ChatSandbox />
}
