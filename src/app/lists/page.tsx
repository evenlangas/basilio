'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import { IoAdd, IoCart, IoPeople } from 'react-icons/io5';

interface ShoppingList {
  _id: string;
  name: string;
  items: {
    name: string;
    amount: string;
    unit: string;
    completed: boolean;
    addedBy: string;
  }[];
  createdBy: {
    _id: string;
    name: string;
  };
  invitedUsers: {
    _id: string;
    name: string;
    image?: string;
  }[];
  createdAt: string;
}

export default function ListsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadLists();
  }, [session, status, router]);

  const loadLists = async () => {
    try {
      const response = await fetch('/api/shopping-lists');
      if (response.ok) {
        const data = await response.json();
        setLists(data);
      }
    } catch (error) {
      console.error('Error loading lists:', error);
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
            Shopping Lists
          </h1>
          <Link
            href="/lists/new"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-white transition-colors"
            style={{ backgroundColor: 'var(--color-primary-600)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
          >
            <IoAdd size={18} />
            <span className="text-sm sm:text-base hidden sm:inline">New List</span>
            <span className="text-sm sm:hidden">New</span>
          </Link>
        </div>

        {/* Lists Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-12">
            <IoCart size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              No shopping lists yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Create your first shopping list to keep track of ingredients
            </p>
            <Link
              href="/lists/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-primary-600)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
            >
              <IoAdd size={20} />
              Create List
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {lists.map((list) => {
              const allMembers = [list.createdBy, ...list.invitedUsers];
              const uncheckedItems = list.items.filter(item => !item.completed).length;
              
              return (
                <Link
                  key={list._id}
                  href={`/lists/${list._id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {list.name}
                      </h3>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {uncheckedItems} {uncheckedItems === 1 ? 'item' : 'items'} remaining
                      </span>
                      
                      {/* Members Profile Pictures */}
                      <div className="flex items-center gap-2">
                        {allMembers.slice(0, 5).map((member, index) => (
                          <div key={member._id} className="relative">
                            {member.image ? (
                              <img
                                src={member.image}
                                alt={member.name}
                                className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-800"
                                style={{ zIndex: 5 - index }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        ))}
                        {allMembers.length > 5 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 border-2 border-white dark:border-gray-800">
                            +{allMembers.length - 5}
                          </div>
                        )}
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