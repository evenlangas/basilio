'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { IoLeaf, IoBook, IoCart, IoPeople } from 'react-icons/io5';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const navItems = [
    { href: '/recipes', label: 'Recipes', icon: <IoBook size={20} /> },
    { href: '/shopping', label: 'Shopping List', icon: <IoCart size={20} /> },
    { href: '/family', label: 'Family', icon: <IoPeople size={20} /> },
  ];

  return (
    <nav className="nav">
      <div className="nav-container">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/recipes" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <IoLeaf size={24} color="var(--color-primary-600)" />
              Basilio
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
                  {item.icon}
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
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}