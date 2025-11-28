'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoCart, IoAdd, IoChevronForward } from 'react-icons/io5';

interface ShoppingItem {
  name: string;
  amount: string;
  unit: string;
  completed: boolean;
}

interface ShoppingList {
  _id: string;
  name: string;
  items: ShoppingItem[];
}

export default function ShoppingListWidget() {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', amount: '', unit: '' });
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    loadPinnedList();
  }, []);

  const loadPinnedList = async () => {
    try {
      // Get user's profile to find pinned list
      const userResponse = await fetch('/api/user/profile');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        if (userData.pinnedShoppingList) {
          // Load the pinned shopping list
          const listResponse = await fetch(`/api/shopping-lists/${userData.pinnedShoppingList}`);
          if (listResponse.ok) {
            const listData = await listResponse.json();
            setList(listData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading pinned list:', error);
    } finally {
      setLoading(false);
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
    };

    const updatedItems = [...list.items, newShoppingItem];

    try {
      const response = await fetch(`/api/shopping-lists/${list._id}`, {
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
        setNewItem({ name: '', amount: '', unit: '' });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setAddingItem(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!list) {
    return null;
  }

  const uncompleted = list.items.filter(item => !item.completed);

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <IoCart size={20} className="text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {list.name}
              </h2>
            </div>
            <Link
              href={`/lists/${list._id}`}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              View all
              <IoChevronForward size={14} />
            </Link>
          </div>
          {list.items.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {uncompleted.length} of {list.items.length} items remaining
            </p>
          )}
          
          {/* Add Item Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
          >
            <IoAdd size={20} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm flex items-start justify-center pt-8 p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto">
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
                
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Amount
                    </label>
                    <input
                      type="text"
                      value={newItem.amount}
                      onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                      placeholder="e.g., 2, 1.5"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      placeholder="e.g., pieces, kg"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
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
    </>
  );
}
