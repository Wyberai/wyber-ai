'use client';
import { Navbar } from './Navbar';
export function NavbarClient({ user }: { user?: { email?: string } | null }) {
  return <Navbar user={user} />;
}