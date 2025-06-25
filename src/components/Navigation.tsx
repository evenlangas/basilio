'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { IoLeaf, IoBook, IoCart, IoLogOut, IoHome, IoPersonCircle, IoAdd } from 'react-icons/io5';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const navItems = [
    { href: '/', label: 'Home', icon: <IoHome size={20} /> },
    { href: '/cookbooks', label: 'Cookbooks', icon: <IoBook size={20} /> },
    { href: '/lists', label: 'Lists', icon: <IoCart size={20} /> },
    { href: '/you', label: 'You', icon: <IoPersonCircle size={20} /> },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block nav">
        <div className="nav-container">
          <div className="nav-left">
            <Link href="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <IoLeaf size={24} color="var(--color-primary-600)" />
              Basilio
            </Link>
            <div className="flex space-x-6">
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
          
          <div className="nav-right">
            <ThemeToggle />
            <button
              onClick={() => signOut()}
              className="nav-link flex items-center gap-2"
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 'var(--spacing-md)'
              }}
            >
              <IoLogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div className="md:hidden nav" style={{ position: 'relative', zIndex: 10 }}>
        <div className="nav-container">
          <Link href="/" className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <IoLeaf size={24} color="var(--color-primary-600)" />
            Basilio
          </Link>
          
          <div className="nav-right">
            <ThemeToggle />
            <button
              onClick={() => signOut()}
              className="p-2 rounded-lg transition-colors"
              style={{
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-tertiary)'
              }}
              title="Sign Out"
            >
              <IoLogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 mobile-bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}>
        <div className="flex items-center justify-around py-2 relative">
          {/* First two nav items */}
          {navItems.slice(0, 2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-bottom-nav-item flex flex-col items-center px-3 py-2 rounded-lg min-w-0 flex-1 ${
                pathname === item.href ? 'active' : ''
              }`}
            >
              <span style={{ fontSize: '22px', marginBottom: '2px' }}>{item.icon}</span>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 'var(--font-medium)',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                {item.label}
              </span>
            </Link>
          ))}
          
          {/* Floating Add Button */}
          <div className="flex-1 flex justify-center">
            <Link
              href="/create"
              className="text-white rounded-full p-4 shadow-lg transform -translate-y-2 transition-all duration-200 hover:scale-110"
              style={{ 
                background: 'var(--color-primary-600)',
                boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4)'
              }}
            >
              <IoAdd size={24} />
            </Link>
          </div>
          
          {/* Last two nav items */}
          {navItems.slice(2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-bottom-nav-item flex flex-col items-center px-3 py-2 rounded-lg min-w-0 flex-1 ${
                pathname === item.href ? 'active' : ''
              }`}
            >
              <span style={{ fontSize: '22px', marginBottom: '2px' }}>{item.icon}</span>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 'var(--font-medium)',
                textAlign: 'center',
                lineHeight: '1.2'
              }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
        {/* Safe area padding for devices with home indicator */}
        <div style={{ height: 'env(safe-area-inset-bottom, 0)' }}></div>
      </nav>
    </>
  );
}