'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import { 
  IoArrowBack, 
  IoAdd, 
  IoSettings, 
  IoCheckbox, 
  IoSquareOutline,
  IoPeople,
  IoTrash,
  IoCart
} from 'react-icons/io5';

interface ShoppingItem {
  name: string;
  amount: string;
  unit: string;
  completed: boolean;
  addedBy: string;
}

interface ShoppingList {
  _id: string;
  name: string;
  items: ShoppingItem[];
  createdBy: {
    _id: string;
    name: string;
  };
  invitedUsers: Array<{
    _id: string;
    name: string;
  }>;
  createdAt: string;
}

export default function ShoppingListPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', amount: '', unit: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadList();
  }, [session, status, router, params.id]);

  const loadList = async () => {
    try {
      const response = await fetch(`/api/shopping-lists/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setList(data);
        setIsOwner(data.createdBy._id === session?.user?.id);
      } else if (response.status === 404) {
        router.push('/lists');
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (index: number) => {
    if (!list) return;

    const updatedItems = [...list.items];
    updatedItems[index].completed = !updatedItems[index].completed;

    try {
      const response = await fetch(`/api/shopping-lists/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems,
        }),
      });

      if (response.ok) {
        setList({ ...list, items: updatedItems });
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !list) return;

    setAddingItem(true);
    const newShoppingItem: ShoppingItem = {
      name: newItem.name.trim(),
      amount: newItem.amount.trim(),
      unit: newItem.unit.trim(),
      completed: false,
      addedBy: session?.user?.id || '',
    };

    try {
      const response = await fetch(`/api/shopping-lists/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [...list.items, newShoppingItem],
        }),
      });

      if (response.ok) {
        setList({ ...list, items: [...list.items, newShoppingItem] });
        setNewItem({ name: '', amount: '', unit: '' });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setAddingItem(false);
    }
  };

  const removeItem = async (index: number) => {
    if (!list) return;

    const updatedItems = list.items.filter((_, i) => i !== index);

    try {
      const response = await fetch(`/api/shopping-lists/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems,
        }),
      });

      if (response.ok) {
        setList({ ...list, items: updatedItems });
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  if (status === 'loading') {
    return <PageLoadingSkeleton />;
  }

  if (!session) return null;

  const completedItems = list?.items.filter(item => item.completed).length || 0;
  const totalItems = list?.items.length || 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : list ? (
          <div className="space-y-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
                >
                  <IoArrowBack size={20} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
                      {list.name}
                    </h1>
                    {list.invitedUsers.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 flex-shrink-0">
                        <IoPeople size={14} />
                        <span className="text-xs">{list.invitedUsers.length}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Created by {list.createdBy.name} • {totalItems} items
                  </p>
                </div>
                
                {isOwner && (
                  <Link
                    href={`/lists/${list._id}/settings`}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0"
                  >
                    <IoSettings size={18} />
                    <span className="hidden sm:inline text-sm">Settings</span>
                  </Link>
                )}
              </div>
            </div>


            {/* Floating Add Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="fixed bottom-20 right-4 md:bottom-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-110 z-40"
              style={{ 
                backgroundColor: 'var(--color-primary-600)',
                boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4)'
              }}
            >
              <IoAdd size={24} />
            </button>

            {/* Add Item Modal */}
            {showAddModal && (
              <div className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                  <div className="p-4 sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Add Item
                    </h2>
                    <form onSubmit={addItem} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Item name *
                        </label>
                        <input
                          type="text"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          placeholder="e.g., Milk, Bread, Apples"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          required
                          autoFocus
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Amount
                        </label>
                        <input
                          type="text"
                          value={newItem.amount}
                          onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                          placeholder="e.g., 2, 1.5, 500"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={newItem.unit}
                          onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                          placeholder="e.g., pieces, liters, kg"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowAddModal(false)}
                          className="order-2 sm:order-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={addingItem}
                          className="order-1 sm:order-2 flex items-center justify-center gap-2 px-4 py-3 sm:py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                          style={{ 
                            backgroundColor: addingItem ? 'var(--color-primary-400)' : 'var(--color-primary-600)'
                          }}
                          onMouseEnter={(e) => !addingItem && (e.currentTarget.style.backgroundColor = 'var(--color-primary-700)')}
                          onMouseLeave={(e) => !addingItem && (e.currentTarget.style.backgroundColor = 'var(--color-primary-600)')}
                        >
                          {addingItem ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <IoAdd size={18} />
                              Add Item
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Shopping Items
              </h2>
              
              {list.items.length === 0 ? (
                <div className="text-center py-8">
                  <IoCart size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No items in this list yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {list.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <button
                        onClick={() => toggleItem(index)}
                        className="text-xl"
                      >
                        {item.completed ? (
                          <IoCheckbox className="text-green-500" />
                        ) : (
                          <IoSquareOutline className="text-gray-400" />
                        )}
                      </button>
                      
                      <div className="flex-1">
                        <span className={`font-medium ${item.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {item.name}
                        </span>
                        {(item.amount || item.unit) && (
                          <span className={`ml-2 text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                            {item.amount} {item.unit}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <IoTrash size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Shopping list not found
            </p>
          </div>
        )}
      </main>
    </div>
  );
}