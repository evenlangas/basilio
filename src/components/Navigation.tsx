'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const navItems = [
    { href: '/recipes', label: 'Recipes', icon: '📖' },
    { href: '/shopping', label: 'Shopping List', icon: '🛒' },
    { href: '/family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  ];

  return (
    <nav className="nav">
      <div className="nav-container">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/recipes" className="nav-brand">
              🌿 Basilio
            </Link>
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${pathname === item.href ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-md)',
                    padding: 'var(--spacing-lg) var(--spacing-xl)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-medium)',
                    backgroundColor: pathname === item.href ? 'var(--color-primary-100)' : 'transparent',
                    color: pathname === item.href ? 'var(--color-primary-700)' : 'var(--color-text-secondary)'
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={() => signOut()}
              className="nav-link"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      <div className="md:hidden" style={{backgroundColor: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)'}}>
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center space-y-1 px-3 py-2 rounded-md text-xs font-medium transition-colors"
              style={{
                color: pathname === item.href ? 'var(--color-primary-700)' : 'var(--color-text-secondary)'
              }}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}