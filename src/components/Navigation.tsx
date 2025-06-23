'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

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
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/recipes" className="text-2xl font-bold text-green-600">
              🌿 Basilio
            </Link>
            <div className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Hello, {session.user.name}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-600 hover:text-red-600 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      <div className="md:hidden bg-white border-t">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                pathname === item.href
                  ? 'text-green-700'
                  : 'text-gray-600 hover:text-green-600'
              }`}
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