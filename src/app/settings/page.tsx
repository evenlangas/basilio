'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  IoArrowBack, 
  IoPersonCircle, 
  IoLogOut, 
  IoMoon, 
  IoSunny,
  IoNotifications,
  IoLockClosed,
  IoShield
} from 'react-icons/io5';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut();
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
              <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <IoArrowBack size={20} />
            <span>Back</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Manage your account preferences and settings
            </p>
          </div>

          {/* Settings Sections */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            
            {/* Profile Section */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <IoPersonCircle size={20} />
                Profile
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {session.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                        {(session.user?.name || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {session.user?.name || 'Unknown User'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {session.user?.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Appearance Section */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <IoMoon size={20} />
                Appearance
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Theme
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Choose between light and dark mode
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <IoNotifications size={20} />
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Manage Notifications
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      View and manage your notification preferences
                    </p>
                  </div>
                  <button
                    onClick={() => router.push('/notifications')}
                    className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                    style={{ backgroundColor: 'var(--color-primary-600)' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
                  >
                    View Notifications
                  </button>
                </div>
              </div>
            </div>

            {/* Privacy & Security Section */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <IoShield size={20} />
                Privacy & Security
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Account Privacy
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Manage your account privacy settings
                    </p>
                  </div>
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
                    disabled
                  >
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <IoLockClosed size={20} />
                Account
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      Sign Out
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sign out of your account on this device
                    </p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <IoLogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}