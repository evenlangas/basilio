'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { ShoppingListSkeleton } from '@/components/SkeletonLoader';
import { IoBulb, IoCart, IoDocumentText, IoPencil, IoSave, IoClose } from 'react-icons/io5';

interface ShoppingItem {
  name: string;
  amount: string;
  unit: string;
  completed: boolean;
  addedBy?: { _id: string; name: string };
}

interface ShoppingList {
  _id: string;
  name: string;
  items: ShoppingItem[];
  createdBy: { _id: string; name: string };
  createdAt: string;
}

export default function ShoppingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [editingItem, setEditingItem] = useState<{listId: string, index: number} | null>(null);
  const [editedName, setEditedName] = useState('');
  const [editedAmount, setEditedAmount] = useState('');
  const [editedUnit, setEditedUnit] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchShoppingLists();
  }, [session, status, router]);

  const fetchShoppingLists = async () => {
    try {
      const response = await fetch('/api/shopping-lists');
      if (response.ok) {
        const data = await response.json();
        setShoppingLists(data);
      }
    } catch (error) {
      console.error('Error fetching shopping lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const createShoppingList = async () => {
    try {
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'My Shopping List',
          items: [],
        }),
      });

      if (response.ok) {
        fetchShoppingLists();
      }
    } catch (error) {
      console.error('Error creating shopping list:', error);
    }
  };

  const addItem = async (listId: string) => {
    if (!newItemName.trim()) return;

    const list = shoppingLists.find(l => l._id === listId);
    if (!list) return;

    const newItem: ShoppingItem = {
      name: newItemName.trim(),
      amount: newItemAmount.trim(),
      unit: newItemUnit.trim(),
      completed: false,
    };

    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...list,
          items: [...list.items, newItem],
        }),
      });

      if (response.ok) {
        setNewItemName('');
        setNewItemAmount('');
        setNewItemUnit('');
        await fetchShoppingLists(); // Make sure this completes
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const toggleItem = async (listId: string, itemIndex: number) => {
    const list = shoppingLists.find(l => l._id === listId);
    if (!list) return;

    const updatedItems = list.items.map((item, index) =>
      index === itemIndex ? { ...item, completed: !item.completed } : item
    );

    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...list,
          items: updatedItems,
        }),
      });

      if (response.ok) {
        fetchShoppingLists();
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  const removeItem = async (listId: string, itemIndex: number) => {
    const list = shoppingLists.find(l => l._id === listId);
    if (!list) return;

    const updatedItems = list.items.filter((_, index) => index !== itemIndex);

    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...list,
          items: updatedItems,
        }),
      });

      if (response.ok) {
        fetchShoppingLists();
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const startEditingItem = (listId: string, index: number) => {
    const list = shoppingLists.find(l => l._id === listId);
    if (!list) return;
    
    const item = list.items[index];
    setEditingItem({ listId, index });
    setEditedName(item.name);
    setEditedAmount(item.amount);
    setEditedUnit(item.unit);
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditedName('');
    setEditedAmount('');
    setEditedUnit('');
  };

  const saveEditedItem = async () => {
    if (!editingItem || !editedName.trim()) return;

    const list = shoppingLists.find(l => l._id === editingItem.listId);
    if (!list) return;

    const updatedItems = list.items.map((item, index) =>
      index === editingItem.index
        ? { ...item, name: editedName.trim(), amount: editedAmount.trim(), unit: editedUnit.trim() }
        : item
    );

    try {
      const response = await fetch(`/api/shopping-lists/${editingItem.listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...list,
          items: updatedItems,
        }),
      });

      if (response.ok) {
        cancelEditing();
        fetchShoppingLists();
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen" style={{backgroundColor: 'var(--color-bg-primary)'}}>
        <Navigation />
        
        <main className="container" style={{paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)'}}>
          <div className="page-header">
            <div className="text-center">
              <div className="skeleton h-10 mb-4 mx-auto" style={{width: '300px'}} />
              <div className="skeleton h-6 mx-auto" style={{width: '400px'}} />
            </div>
          </div>

          <ShoppingListSkeleton />
        </main>
      </div>
    );
  }

  if (!session) return null;

  const mainList = shoppingLists[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {session.user.familyId ? 'Family Shopping List' : 'My Shopping List'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
              Keep track of what you{session.user.familyId ? ' and your family' : ''} need to buy
            </p>
            {!session.user.familyId && (
              <p className="text-xs sm:text-sm text-blue-600 mt-1 flex items-center gap-1">
                <IoBulb size={14} /> <Link href="/family" className="underline hover:text-blue-800">Join or create a family</Link> to share shopping lists with others!
              </p>
            )}
          </div>
          
          {!mainList && (
            <button
              onClick={createShoppingList}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
            >
              Create List
            </button>
          )}
        </div>

        {!mainList ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <IoCart className="text-4xl text-gray-400" size={48} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No shopping list yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first shopping list to start organizing your grocery trips
            </p>
            <button
              onClick={createShoppingList}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Create Shopping List
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 mx-2 sm:mx-0">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Add New Item</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Item name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  onKeyPress={(e) => e.key === 'Enter' && addItem(mainList._id)}
                />
                <input
                  type="text"
                  placeholder="Amount"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value)}
                  className="w-full sm:w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="w-full sm:w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <button
                  onClick={() => addItem(mainList._id)}
                  disabled={!newItemName.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 w-full sm:w-auto"
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Items ({mainList.items.length})
              </h2>
              
              {mainList.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <div className="mb-2 flex justify-center">
                    <IoDocumentText className="text-2xl" size={32} />
                  </div>
                  <p>No items in your shopping list yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mainList.items.map((item, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        item.completed
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {editingItem?.listId === mainList._id && editingItem?.index === index ? (
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="form-input flex-1"
                              placeholder="Item name"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={editedAmount}
                              onChange={(e) => setEditedAmount(e.target.value)}
                              className="form-input w-full sm:w-24"
                              placeholder="Amount"
                            />
                            <input
                              type="text"
                              value={editedUnit}
                              onChange={(e) => setEditedUnit(e.target.value)}
                              className="form-input w-full sm:w-20"
                              placeholder="Unit"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveEditedItem}
                              className="btn btn-primary btn-sm"
                              disabled={!editedName.trim()}
                            >
                              <IoSave size={14} />
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="btn btn-outline btn-sm"
                            >
                              <IoClose size={14} />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <button
                              onClick={() => toggleItem(mainList._id, index)}
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                item.completed
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300 hover:border-green-500'
                              }`}
                            >
                              {item.completed && <span className="text-xs">✓</span>}
                            </button>
                            
                            <div className={`${item.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'} min-w-0 flex-1`}>
                              <div className="font-medium truncate">{item.name}</div>
                              {(item.amount || item.unit) && (
                                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  {item.amount} {item.unit}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditingItem(mainList._id, index)}
                              className="text-blue-600 hover:text-blue-700 p-1 flex-shrink-0"
                              title="Edit item"
                            >
                              <IoPencil size={16} />
                            </button>
                            <button
                              onClick={() => removeItem(mainList._id, index)}
                              className="text-red-600 hover:text-red-700 p-1 flex-shrink-0"
                              title="Remove item"
                            >
                              <IoClose size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {mainList.items.length > 0 && (
              <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Total items: {mainList.items.length}</span>
                  <span>
                    Completed: {mainList.items.filter(item => item.completed).length}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}