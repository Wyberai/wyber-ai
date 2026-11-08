import { notFound } from 'next/navigation'
import { EditorSandbox } from './EditorSandbox'

// Local review harness for the whole editor layout (fake project, no login). Exists only when
// NEXT_PUBLIC_DEV_SANDBOX=1 is set; in a normal build the proxy sends visitors to login.
export default function Page() {
  if (process.env.NEXT_PUBLIC_DEV_SANDBOX !== '1') notFound()
  return <EditorSandbox />
}
