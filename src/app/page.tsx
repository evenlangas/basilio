'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import ChefDisplay from '@/components/ChefDisplay';
import UserMentions from '@/components/UserMentions';
import { IoSearchOutline, IoRestaurantOutline, IoTimeOutline } from 'react-icons/io5';
import { FaGrinHearts, FaRegGrinHearts } from 'react-icons/fa';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface Recipe {
  _id: string;
  title: string;
  description?: string;
  cookingTime?: number;
  servings?: number;
}

interface Creation {
  _id: string;
  title: string;
  description: string;
  image: string;
  createdBy: User;
  likes: User[];
  recipe?: Recipe;
  eatenWith?: string;
  cookingTime?: number;
  drankWith?: string;
  chefName?: string;
  createdAt: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [yummingStates, setYummingStates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    // Load creations from followed users
    loadCreations();
  }, [session, status, router]);

  const loadCreations = async () => {
    try {
      const response = await fetch('/api/creations/feed');
      if (response.ok) {
        const data = await response.json();
        setCreations(data);
      }
    } catch (error) {
      console.error('Error loading creations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleYum = async (creationId: string) => {
    if (yummingStates[creationId]) return;
    
    setYummingStates(prev => ({ ...prev, [creationId]: true }));
    try {
      const response = await fetch(`/api/creations/${creationId}/yum`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreations(prev => prev.map(creation => 
          creation._id === creationId ? data.creation : creation
        ));
      }
    } catch (error) {
      console.error('Error yumming creation:', error);
    } finally {
      setYummingStates(prev => ({ ...prev, [creationId]: false }));
    }
  };

  const hasYummed = (creation: Creation) => {
    return creation.likes.some(like => like._id === session?.user?.id);
  };

  if (status === 'loading') {
    return <PageLoadingSkeleton />;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Search */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Home
          </h1>
          <Link
            href="/search"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <IoSearchOutline size={18} />
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300 hidden sm:inline">Search</span>
          </Link>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
          </div>
        ) : creations.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              No creations yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Follow other chefs to see their creations in your feed
            </p>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-primary-600)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
            >
              <IoSearchOutline size={20} />
              Find Chefs to Follow
            </Link>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {creations.map((creation) => (
              <Link key={creation._id} href={`/creations/${creation._id}`} className="block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                {/* Header */}
                <div className="p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    {creation.createdBy.image ? (
                      <img 
                        src={creation.createdBy.image} 
                        alt={creation.createdBy.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
                        {creation.createdBy.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                      {creation.createdBy.name}
                    </h3>
                    {creation.chefName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Chef: <ChefDisplay chefName={creation.chefName} className="text-xs" showProfilePicture={false} />
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {new Date(creation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Image and Content */}
                <div>
                  {creation.image && (
                    <img 
                      src={creation.image} 
                      alt={creation.title}
                      className="w-full h-48 sm:h-64 object-cover hover:opacity-95 transition-opacity"
                    />
                  )}

                  {/* Content */}
                  <div className="p-3 sm:p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base hover:underline">
                      {creation.title}
                    </h4>
                    {creation.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm sm:text-base line-clamp-2">
                        {creation.description}
                      </p>
                    )}

                  </div>
                </div>

                {/* Actions */}
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleYum(creation._id);
                      }}
                      disabled={yummingStates[creation._id]}
                      className={`flex items-center gap-1 sm:gap-2 transition-colors ${
                        hasYummed(creation)
                          ? 'text-green-600'
                          : 'text-gray-600 dark:text-gray-300 hover:text-green-600'
                      }`}
                    >
                      {hasYummed(creation) ? <FaGrinHearts size={18} style={{ color: 'var(--color-primary-600)' }} /> : <FaRegGrinHearts size={18} />}
                      <span className="text-sm font-medium">
                        {creation.likes.length} {creation.likes.length === 1 ? 'yum' : 'yums'}
                      </span>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
