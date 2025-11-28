'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoCart, IoAdd, IoCheckbox, IoSquareOutline, IoChevronForward } from 'react-icons/io5';

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
  const [newItemName, setNewItemName] = useState('');
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

  const quickAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !list) return;

    setAddingItem(true);
    const newItem: ShoppingItem = {
      name: newItemName.trim(),
      amount: '',
      unit: '',
      completed: false,
    };

    const updatedItems = [...list.items, newItem];

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
        setNewItemName('');
      }
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setAddingItem(false);
    }
  };

  const toggleItem = async (index: number) => {
    if (!list) return;

    const updatedItems = [...list.items];
    updatedItems[index].completed = !updatedItems[index].completed;

    // Optimistic update
    setList({ ...list, items: updatedItems });

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

      if (!response.ok) {
        // Revert on error
        const revertedItems = [...list.items];
        revertedItems[index].completed = !revertedItems[index].completed;
        setList({ ...list, items: revertedItems });
      }
    } catch (error) {
      // Revert on error
      const revertedItems = [...list.items];
      revertedItems[index].completed = !revertedItems[index].completed;
      setList({ ...list, items: revertedItems });
      console.error('Error toggling item:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!list) {
    return null;
  }

  const uncompleted = list.items.filter(item => !item.completed);
  const displayItems = uncompleted.slice(0, 5);
  const remainingCount = uncompleted.length - displayItems.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
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
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {uncompleted.length} of {list.items.length} items remaining
          </p>
        )}
      </div>

      {/* Quick add form */}
      <form onSubmit={quickAddItem} className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Add item..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={addingItem}
          />
          <button
            type="submit"
            disabled={addingItem || !newItemName.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            {addingItem ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <IoAdd size={18} />
                <span className="hidden sm:inline text-sm">Add</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Items list */}
      <div className="p-4">
        {displayItems.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All items completed! 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item, index) => {
              const actualIndex = list.items.indexOf(item);
              return (
                <div
                  key={`${item.name}-${actualIndex}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <button
                    onClick={() => toggleItem(actualIndex)}
                    className="flex-shrink-0"
                  >
                    {item.completed ? (
                      <IoCheckbox size={20} className="text-green-500" />
                    ) : (
                      <IoSquareOutline size={20} className="text-gray-400 hover:text-green-500 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${
                      item.completed 
                        ? 'text-gray-500 dark:text-gray-400 line-through' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {item.name}
                    </span>
                    {(item.amount || item.unit) && (
                      <span className={`text-xs ml-2 ${
                        item.completed 
                          ? 'text-gray-400 dark:text-gray-500 line-through' 
                          : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        {item.amount} {item.unit}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {remainingCount > 0 && (
              <Link
                href={`/lists/${list._id}`}
                className="block text-center py-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                + {remainingCount} more item{remainingCount !== 1 ? 's' : ''}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
