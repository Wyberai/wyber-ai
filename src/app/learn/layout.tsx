import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Learn to build apps with AI: prompts that work',
  description: 'Two learning tracks for building web apps and mobile apps with WyberAi. Copy a prompt, open the builder, and see a working first version.',
}

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children
}
