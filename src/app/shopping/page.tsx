'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { ShoppingListSkeleton } from '@/components/SkeletonLoader';
import { IoBulb, IoCart, IoDocumentText, IoPencil, IoSave, IoClose, IoAdd } from 'react-icons/io5';

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
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isSyncingWithFamily, setIsSyncingWithFamily] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchShoppingLists();
  }, [session, status, router]);

  // Poll for updates every 10 seconds to sync with family member changes
  useEffect(() => {
    if (!session?.user.familyId || shoppingLists.length === 0) return;

    const currentList = shoppingLists[0];
    const interval = setInterval(async () => {
      try {
        setIsSyncingWithFamily(true);
        const response = await fetch(`/api/shopping-lists/${currentList._id}`);
        if (response.ok) {
          const updatedList = await response.json();
          const serverUpdateTime = new Date(updatedList.updatedAt);
          
          // Only update if the server version is newer than our last known update
          if (!lastUpdateTime || serverUpdateTime > lastUpdateTime) {
            setShoppingLists([updatedList]);
            setLastUpdateTime(serverUpdateTime);
          }
        }
      } catch (error) {
        console.error('Error polling for updates:', error);
      } finally {
        setIsSyncingWithFamily(false);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [session?.user.familyId, shoppingLists, lastUpdateTime]);

  // Auto-focus the input when modal opens
  useEffect(() => {
    if (showAddModal && inputRef.current) {
      // Use a small delay to ensure the modal is fully rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showAddModal]);

  // Virtual keyboard detection for mobile
  useEffect(() => {
    if (!showAddModal) return;

    const handleResize = () => {
      // For mobile browsers, when virtual keyboard opens, viewport height decreases
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.screen.height;
      const keyboardSpace = windowHeight - viewportHeight;
      
      // If keyboard space is significant (more than 150px), keyboard is likely open
      if (keyboardSpace > 150) {
        setKeyboardHeight(keyboardSpace);
      } else {
        setKeyboardHeight(0);
      }
    };

    // Listen for visual viewport changes (better than resize for virtual keyboard)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [showAddModal]);

  const fetchShoppingLists = async () => {
    try {
      const response = await fetch('/api/shopping-lists');
      if (response.ok) {
        const data = await response.json();
        setShoppingLists(data);
        if (data.length > 0) {
          setLastUpdateTime(new Date(data[0].updatedAt));
        }
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

    const updatedItems = [...list.items, newItem];

    // Clear inputs immediately for better UX
    setNewItemName('');
    setNewItemAmount('');
    setNewItemUnit('');

    // Optimistically update the UI
    setShoppingLists(prevLists => 
      prevLists.map(prevList => 
        prevList._id === listId 
          ? { ...prevList, items: updatedItems }
          : prevList
      )
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

      if (!response.ok) {
        // Revert on error
        setShoppingLists(prevLists => 
          prevLists.map(prevList => 
            prevList._id === listId 
              ? { ...prevList, items: list.items }
              : prevList
          )
        );
        // Restore the form values
        setNewItemName(newItem.name);
        setNewItemAmount(newItem.amount);
        setNewItemUnit(newItem.unit);
      }
    } catch (error) {
      console.error('Error adding item:', error);
      // Revert on error
      setShoppingLists(prevLists => 
        prevLists.map(prevList => 
          prevList._id === listId 
            ? { ...prevList, items: list.items }
            : prevList
        )
      );
      // Restore the form values
      setNewItemName(newItem.name);
      setNewItemAmount(newItem.amount);
      setNewItemUnit(newItem.unit);
    }
  };

  const toggleItem = async (listId: string, itemIndex: number) => {
    const list = shoppingLists.find(l => l._id === listId);
    if (!list) return;

    const updatedItems = list.items.map((item, index) =>
      index === itemIndex ? { ...item, completed: !item.completed } : item
    );

    // Optimistically update the UI immediately
    setShoppingLists(prevLists => 
      prevLists.map(prevList => 
        prevList._id === listId 
          ? { ...prevList, items: updatedItems }
          : prevList
      )
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

      if (!response.ok) {
        // If the API call fails, revert the optimistic update
        setShoppingLists(prevLists => 
          prevLists.map(prevList => 
            prevList._id === listId 
              ? { ...prevList, items: list.items }
              : prevList
          )
        );
      }
    } catch (error) {
      console.error('Error toggling item:', error);
      // Revert the optimistic update on error
      setShoppingLists(prevLists => 
        prevLists.map(prevList => 
          prevList._id === listId 
            ? { ...prevList, items: list.items }
            : prevList
        )
      );
    }
  };

  const removeItem = async (listId: string, itemIndex: number) => {
    const list = shoppingLists.find(l => l._id === listId);
    if (!list) return;

    const updatedItems = list.items.filter((_, index) => index !== itemIndex);

    // Optimistically update the UI
    setShoppingLists(prevLists => 
      prevLists.map(prevList => 
        prevList._id === listId 
          ? { ...prevList, items: updatedItems }
          : prevList
      )
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

      if (!response.ok) {
        // Revert on error
        setShoppingLists(prevLists => 
          prevLists.map(prevList => 
            prevList._id === listId 
              ? { ...prevList, items: list.items }
              : prevList
          )
        );
      }
    } catch (error) {
      console.error('Error removing item:', error);
      // Revert on error
      setShoppingLists(prevLists => 
        prevLists.map(prevList => 
          prevList._id === listId 
            ? { ...prevList, items: list.items }
            : prevList
        )
      );
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

    // Optimistically update the UI
    setShoppingLists(prevLists => 
      prevLists.map(prevList => 
        prevList._id === editingItem.listId 
          ? { ...prevList, items: updatedItems }
          : prevList
      )
    );
    cancelEditing();

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

      if (!response.ok) {
        // Revert on error
        setShoppingLists(prevLists => 
          prevLists.map(prevList => 
            prevList._id === editingItem.listId 
              ? { ...prevList, items: list.items }
              : prevList
          )
        );
      }
    } catch (error) {
      console.error('Error updating item:', error);
      // Revert on error
      setShoppingLists(prevLists => 
        prevLists.map(prevList => 
          prevList._id === editingItem.listId 
            ? { ...prevList, items: list.items }
            : prevList
        )
      );
    }
  };

  const openAddModal = () => {
    setShowAddModal(true);
    setNewItemName('');
    setNewItemAmount('');
    setNewItemUnit('');
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewItemName('');
    setNewItemAmount('');
    setNewItemUnit('');
  };

  const handleAddFromModal = async () => {
    if (!mainList || !newItemName.trim()) return;
    await addItem(mainList._id);
    closeAddModal();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        <main className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-0">
              <div className="skeleton h-10 mb-4" style={{width: '300px'}} />
              <div className="skeleton h-6" style={{width: '400px'}} />
            </div>
          </div>

          <ShoppingListSkeleton />
        </main>
      </div>
    );
  }

  if (!session) return null;

  const mainList = shoppingLists[0];
  
  // Sort items: uncompleted first, then completed at the bottom
  const sortedItems = mainList?.items ? [...mainList.items].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  }) : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                {session.user.familyId ? 'Family Shopping List' : 'My Shopping List'}
              </h1>
              {session.user.familyId && isSyncingWithFamily && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" title="Syncing with family members..." />
              )}
            </div>
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
            <div>
              <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                Items ({mainList.items.length})
                {sortedItems.filter(item => item.completed).length > 0 && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                    • Completed items at bottom
                  </span>
                )}
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
                  {sortedItems.map((item, index) => {
                    // Find the original index in the unsorted array for API calls
                    const originalIndex = mainList.items.findIndex(originalItem => 
                      originalItem.name === item.name && 
                      originalItem.amount === item.amount && 
                      originalItem.unit === item.unit &&
                      originalItem.completed === item.completed
                    );
                    return (
                    <div
                      key={`${item.name}-${item.amount}-${item.unit}-${originalIndex}`}
                      className={`p-3 rounded-lg border ${
                        item.completed
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {editingItem?.listId === mainList._id && editingItem?.index === originalIndex ? (
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
                              onClick={() => toggleItem(mainList._id, originalIndex)}
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
                              onClick={() => startEditingItem(mainList._id, originalIndex)}
                              className="text-blue-600 hover:text-blue-700 p-1 flex-shrink-0"
                              title="Edit item"
                            >
                              <IoPencil size={16} />
                            </button>
                            <button
                              onClick={() => removeItem(mainList._id, originalIndex)}
                              className="text-red-600 hover:text-red-700 p-1 flex-shrink-0"
                              title="Remove item"
                            >
                              <IoClose size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                  })}
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
      
      {/* Floating Add Button */}
      {mainList && (
        <button
          onClick={openAddModal}
          className="floating-add-button"
          title="Add New Item"
        >
          <IoAdd size={28} />
        </button>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 pt-16 pb-4 sm:p-4"
          style={{ 
            paddingBottom: keyboardHeight > 0 ? `${keyboardHeight + 20}px` : undefined 
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full sm:w-96 max-w-full mx-4">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Item</h3>
                <button
                  onClick={closeAddModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <IoClose size={24} />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); handleAddFromModal(); }} className="space-y-4">
                <div>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Item name (required)"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    autoComplete="off"
                    name="shopping-item-name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newItemName.trim()) {
                        handleAddFromModal();
                      }
                    }}
                  />
                </div>
                
                <div className="flex gap-2 sm:gap-3">
                  <input
                    type="text"
                    placeholder="Amount"
                    value={newItemAmount}
                    onChange={(e) => setNewItemAmount(e.target.value)}
                    className="flex-[2] px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    autoComplete="off"
                    name="shopping-item-amount"
                    inputMode="decimal"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    autoComplete="off"
                    name="shopping-item-unit"
                  />
                </div>
                
                <div className="flex gap-2 sm:gap-3 pt-2">
                  <button
                    onClick={closeAddModal}
                    className="flex-1 px-3 sm:px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddFromModal}
                    disabled={!newItemName.trim()}
                    className="flex-1 px-3 sm:px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}