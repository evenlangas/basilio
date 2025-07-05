'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import { IoAdd, IoBook, IoLockClosed, IoGlobe, IoPeople, IoRestaurant } from 'react-icons/io5';

interface Cookbook {
  _id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  recipes: string[];
  createdBy: {
    _id: string;
    name: string;
  };
  invitedUsers: {
    _id: string;
    name: string;
    image?: string;
  }[];
  image?: string;
  createdAt: string;
}

export default function CookbooksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadCookbooks();
  }, [session, status, router]);

  const loadCookbooks = async () => {
    try {
      const response = await fetch('/api/cookbooks');
      if (response.ok) {
        const data = await response.json();
        setCookbooks(data);
      }
    } catch (error) {
      console.error('Error loading cookbooks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <PageLoadingSkeleton />;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            My Cookbooks
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/you"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <IoRestaurant size={18} />
              <span className="text-sm sm:text-base hidden sm:inline">My Recipes</span>
              <span className="text-sm sm:hidden">Recipes</span>
            </Link>
            <Link
              href="/cookbooks/new"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white transition-colors"
              style={{ backgroundColor: 'var(--color-primary-600)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
            >
              <IoAdd size={18} />
              <span className="text-sm sm:text-base hidden sm:inline">New Cookbook</span>
              <span className="text-sm sm:hidden">New</span>
            </Link>
          </div>
        </div>

        {/* Cookbooks Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
          </div>
        ) : cookbooks.length === 0 ? (
          <div className="text-center py-12">
            <IoBook size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              No cookbooks yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Create your first cookbook to organize your recipes
            </p>
            <Link
              href="/cookbooks/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-primary-600)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
            >
              <IoAdd size={20} />
              Create Cookbook
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {cookbooks.map((cookbook) => {
              const allMembers = [cookbook.createdBy, ...cookbook.invitedUsers];
              
              return (
                <Link
                  key={cookbook._id}
                  href={`/cookbooks/${cookbook._id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {cookbook.name}
                      </h3>
                      <div className="flex items-center gap-1">
                        {cookbook.isPrivate ? (
                          <IoLockClosed size={16} className="text-gray-500" />
                        ) : (
                          <IoGlobe size={16} className="text-green-500" />
                        )}
                      </div>
                    </div>
                    
                    {cookbook.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">
                        {cookbook.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {cookbook.recipes.length} recipes
                      </span>
                      
                      {/* Members Count Icon */}
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <IoPeople size={16} />
                        <span className="text-sm font-medium">
                          {allMembers.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}