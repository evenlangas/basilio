'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ThemeToggle from './ThemeToggle';
import { IoLeaf, IoBook, IoCart, IoLogOut, IoHome, IoPersonCircle, IoAdd, IoRestaurant, IoCreate, IoList } from 'react-icons/io5';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  if (!session) return null;

  const handleToggleMenu = () => {
    if (showCreateMenu) {
      setIsClosing(true);
      setTimeout(() => {
        setShowCreateMenu(false);
        setIsClosing(false);
      }, 180); // Faster timing
    } else {
      setShowCreateMenu(true);
    }
  };

  const handleMenuItemClick = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowCreateMenu(false);
      setIsClosing(false);
    }, 180);
  };

  const createOptions = [
    { href: '/recipes/new', label: 'New Recipe', icon: <IoRestaurant size={20} /> },
    { href: '/cookbooks/new', label: 'New Cookbook', icon: <IoBook size={20} /> },
    { href: '/lists/new', label: 'New List', icon: <IoList size={20} /> },
    { href: '/create', label: 'Post a Creation', icon: <IoCreate size={20} /> },
  ];

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
          
          {/* Floating Add Button with Menu */}
          <div className="flex-1 flex justify-center relative">
            <button
              onClick={handleToggleMenu}
              className="text-white rounded-full p-4 shadow-lg transform -translate-y-2 transition-all duration-200 hover:scale-110 relative z-50"
              style={{ 
                background: 'var(--color-primary-600)',
                boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4)'
              }}
            >
              <IoAdd 
                size={24} 
                className={`transition-transform duration-150 ${showCreateMenu ? 'rotate-45' : ''}`}
              />
            </button>
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

      {/* Blurred Background Overlay */}
      {showCreateMenu && (
        <div 
          className={`fixed inset-0 z-40 transition-opacity duration-150 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
          onClick={handleToggleMenu}
        />
      )}

      {/* Animated Create Menu */}
      {showCreateMenu && (
        <div className="fixed bottom-28 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex flex-col-reverse gap-3 items-center">
            {createOptions.map((option, index) => (
              <Link
                key={option.href}
                href={option.href}
                onClick={handleMenuItemClick}
                className="flex items-center bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:scale-105"
                style={{
                  animation: isClosing 
                    ? `slideDownToCenter 0.15s ease-in ${(createOptions.length - 1 - index) * 25}ms forwards`
                    : `slideUpFromCenter 0.15s ease-out ${index * 25}ms forwards`,
                  transformOrigin: 'center bottom',
                  width: '220px',
                  paddingLeft: '16px',
                  paddingRight: '20px',
                  paddingTop: '12px',
                  paddingBottom: '12px',
                  opacity: 0
                }}
              >
                <div 
                  className="p-2 rounded-full flex-shrink-0" 
                  style={{ 
                    backgroundColor: 'var(--color-primary-100)', 
                    color: 'var(--color-primary-600)',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {option.icon}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-3 flex-1">
                  {option.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUpFromCenter {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideDownToCenter {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
        }
      `}</style>
    </>
  );
}