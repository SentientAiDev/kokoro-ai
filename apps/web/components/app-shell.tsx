import type { ReactNode } from 'react';
import Link from 'next/link';
import { SignOutButton } from './sign-out-button';
import { cn } from '../lib/utils';

const navItems = [
  { href: '/today', label: 'Today' },
];

const secondaryNavItems = [
  { href: '/journal', label: 'Journal history' },
  { href: '/memory', label: 'Memory timeline' },
  { href: '/settings', label: 'Settings' },
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
      <div className="mx-auto flex w-full max-w-5xl flex-col px-6 py-6">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Kokoro Presence</p>
            <p className="text-xs text-muted-foreground">A quieter space for continuity.</p>
          </div>

          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-1 rounded-full border border-border bg-white p-1 sm:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-100',
                    activePath === item.href && 'bg-slate-100 font-medium text-slate-900',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <details className="relative">
              <summary className="cursor-pointer list-none rounded-full border border-border bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                Menu
              </summary>
              <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-border bg-white p-2 shadow-md">
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link href="/feedback" className="mt-1 block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  Send feedback
                </Link>
                <Link href="/trust-center" className="mt-1 block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
                  Trust Center
                </Link>
                <div className="mx-2 mt-2 border-t pt-2">
                  <p className="mb-1 px-1 text-xs text-muted-foreground">{userEmail}</p>
                  <SignOutButton className="w-full justify-start" />
                </div>
              </div>
            </details>
          </div>
        </header>

        <main className="mx-auto w-full max-w-3xl">{children}</main>

        <footer className="mt-12 border-t border-border py-4 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-3">
            <Link href="/journal" className="hover:underline">
              Journal history
            </Link>
            <Link href="/memory" className="hover:underline">
              Memory timeline
            </Link>
            <Link href="/settings" className="hover:underline">
              Settings
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
