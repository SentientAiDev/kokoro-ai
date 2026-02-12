import type { ReactNode } from 'react';
import Link from 'next/link';
import { SignOutButton } from './sign-out-button';
import { cn } from '../lib/utils';

const navItems = [
  { href: '/journal', label: 'Journal' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/recall', label: 'Recall' },
  { href: '/journal', label: 'Check-ins' },
  { href: '/account', label: 'Settings' },
];

export function AppShell({
  children,
  activePath,
  userEmail,
}: {
  children: ReactNode;
  activePath: string;
  userEmail: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="border-r border-border bg-white/80 p-4">
          <p className="mb-6 text-sm font-semibold text-slate-800">Kokoro Presence</p>
          <nav className="grid gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={cn(
                  'rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100',
                  activePath === item.href && 'bg-slate-100 font-medium text-slate-900',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>
          <header className="flex items-center justify-between border-b border-border bg-white px-6 py-3">
            <p className="text-sm text-muted-foreground">Your continuous memory workspace</p>
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-md border border-border px-3 py-2 text-sm">{userEmail}</summary>
              <div className="absolute right-0 mt-2 w-52 rounded-md border border-border bg-white p-2 shadow-md">
                <Link href="/account" className="block rounded px-2 py-1 text-sm hover:bg-slate-100">
                  Account settings
                </Link>
                <div className="mt-1 border-t pt-2">
                  <SignOutButton className="w-full justify-start" />
                </div>
              </div>
            </details>
          </header>
          <main className="mx-auto w-full max-w-5xl px-6 py-8">{children}</main>
          <footer className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
            <Link href="/report-issue" className="hover:underline">
              Report an issue
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
