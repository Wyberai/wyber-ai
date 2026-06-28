import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up — Start Building for Free',
  description: 'Create a free WyberAi account. 50 free credits, no credit card required. Build web apps and mobile apps with AI.',
  alternates: { canonical: 'https://wyberai.com/signup' },
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
