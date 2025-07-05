'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import { IoPersonCircle, IoArrowBack } from 'react-icons/io5';
import { FaGrinHearts } from 'react-icons/fa';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface Creation {
  _id: string;
  title: string;
  description?: string;
  image?: string;
  createdBy: User;
  likes: User[];
}

export default function CreationYumsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [creation, setCreation] = useState<Creation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (id) {
      loadCreation();
    }
  }, [session, status, router, id]);

  const loadCreation = async () => {
    try {
      const response = await fetch(`/api/creations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCreation(data);
      } else if (response.status === 404) {
        router.push('/404');
      }
    } catch (error) {
      console.error('Error loading creation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return <PageLoadingSkeleton />;
  }

  if (!session) return null;

  if (!creation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Creation not found
            </h2>
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Go back to home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <IoArrowBack size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Yums
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              People who yummed this creation
            </p>
          </div>
        </div>

        {/* Creation Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-6">
          <Link href={`/creations/${creation._id}`} className="block">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  {creation.createdBy.image ? (
                    <img 
                      src={creation.createdBy.image} 
                      alt={creation.createdBy.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <IoPersonCircle size={20} className="text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {creation.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    by {creation.createdBy.name}
                  </p>
                </div>
              </div>
              {creation.image && (
                <div className="mt-3">
                  <img 
                    src={creation.image} 
                    alt={creation.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* Yums List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <FaGrinHearts size={20} style={{ color: 'var(--color-primary-600)' }} />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {creation.likes.length} {creation.likes.length === 1 ? 'person' : 'people'} yummed this
              </h2>
            </div>
          </div>
          
          {creation.likes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No one has yummed this creation yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {creation.likes.map((user) => (
                <Link
                  key={user._id}
                  href={`/profile/${user._id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    {user.image ? (
                      <img 
                        src={user.image} 
                        alt={user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <IoPersonCircle size={30} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user.name}
                    </h3>
                  </div>
                  <FaGrinHearts size={16} style={{ color: 'var(--color-primary-600)' }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}