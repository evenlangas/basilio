'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import { IoAdd, IoCart, IoPeople, IoCheckbox, IoSquareOutline } from 'react-icons/io5';

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
  invitedUsers: string[];
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
              const completedItems = list.items.filter(item => item.completed).length;
              const totalItems = list.items.length;
              const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
              
              return (
                <Link
                  key={list._id}
                  href={`/lists/${list._id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {list.name}
                    </h3>
                    {list.invitedUsers.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <IoPeople size={16} />
                        <span className="text-sm">{list.invitedUsers.length}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                      <span>{completedItems} of {totalItems} items</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Recent Items Preview */}
                  <div className="space-y-2">
                    {list.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {item.completed ? (
                          <IoCheckbox className="text-green-500" />
                        ) : (
                          <IoSquareOutline className="text-gray-400" />
                        )}
                        <span className={`${item.completed ? 'line-through text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>
                          {item.name}
                        </span>
                      </div>
                    ))}
                    {list.items.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        +{list.items.length - 3} more items
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Created {new Date(list.createdAt).toLocaleDateString()}
                    </p>
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