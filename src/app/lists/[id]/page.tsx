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
  IoCart,
  IoPencil,
  IoSave,
  IoClose,
  IoPersonCircle,
  IoBook,
  IoTime,
  IoChevronDown,
  IoChevronUp,
  IoReorderThree
} from 'react-icons/io5';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  MeasuringStrategy,
  CollisionDetection,
  rectIntersection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ShoppingItem {
  name: string;
  amount: string;
  unit: string;
  completed: boolean;
  addedBy: string;
  order?: number;
}

interface RecipeLogEntry {
  _id: string;
  recipe: {
    _id: string;
    title: string;
    image?: string;
    cookingTime?: number;
    servings?: number;
  };
  addedBy: {
    _id: string;
    name: string;
    image?: string;
  };
  servings: number;
  addedAt: string;
  addedCount: number;
  combinedCount: number;
}

interface ShoppingList {
  _id: string;
  name: string;
  items: ShoppingItem[];
  createdBy: {
    _id: string;
    name: string;
    image?: string;
  };
  invitedUsers: Array<{
    _id: string;
    name: string;
    email: string;
    image?: string;
  }>;
  recipeLog?: RecipeLogEntry[];
  createdAt: string;
}

export default function ShoppingListPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', amount: '', unit: '' });
  const [addingItem, setAddingItem] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState({ name: '', amount: '', unit: '' });
  const [listId, setListId] = useState<string>('');
  const [isRecipeHistoryExpanded, setIsRecipeHistoryExpanded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [draggedItem, setDraggedItem] = useState<ShoppingItem | null>(null);
  const [loadingItems, setLoadingItems] = useState<Set<number>>(new Set());
  const [errorItems, setErrorItems] = useState<Set<number>>(new Set());
  const [deletingItems, setDeletingItems] = useState<Set<number>>(new Set());
  const [deleteErrors, setDeleteErrors] = useState<Set<number>>(new Set());
  const [originalItemStates, setOriginalItemStates] = useState<Map<number, boolean>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const measuring = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };

  // Custom collision detection that prevents dragging beyond list boundaries
  const customCollisionDetection: CollisionDetection = (args) => {
    // First get the default collision detection result
    const defaultCollisions = rectIntersection(args);
    
    // If there are valid collisions within the list, use them
    if (defaultCollisions.length > 0) {
      return defaultCollisions;
    }
    
    // If no collisions, don't allow dropping outside the list
    return [];
  };

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setListId(id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (status === 'loading' || !listId) return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadList(listId);
  }, [session, status, router, listId]);

  // Real-time updates via polling
  useEffect(() => {
    if (!listId || !session) return;

    const pollForUpdates = async () => {
      try {
        const response = await fetch(`/api/shopping-lists/${listId}`);
        if (response.ok) {
          const data = await response.json();
          const serverUpdated = new Date(data.updatedAt || data.createdAt);
          
          // Only update if server data is newer than our last update AND user is not currently editing
          if (serverUpdated > lastUpdated && editingIndex === null) {
            setList(data);
            setLastUpdated(serverUpdated);
          }
        }
      } catch (error) {
        // Silently fail to avoid console spam
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollForUpdates, 3000);
    
    return () => clearInterval(interval);
  }, [listId, session, lastUpdated, editingIndex]);

  const loadList = async (id: string) => {
    try {
      const response = await fetch(`/api/shopping-lists/${id}`);
      if (response.ok) {
        const data = await response.json();
        setList(data);
        setIsOwner(data.createdBy._id === session?.user?.id);
        setLastUpdated(new Date());
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

    // Store original state before starting operation
    const originalCompleted = list.items[index].completed;
    setOriginalItemStates(prev => new Map(prev).set(index, originalCompleted));

    // Clear any previous error for this item
    setErrorItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });

    // Set loading state
    setLoadingItems(prev => new Set(prev).add(index));

    const updatedItems = [...list.items];
    updatedItems[index].completed = !updatedItems[index].completed;

    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems,
        }),
      });

      if (response.ok) {
        // Success: update the list and clear loading
        setList({ ...list, items: updatedItems });
        setLastUpdated(new Date());
      } else {
        // Error: show error state and revert the item's completed state
        const revertedItems = [...list.items];
        revertedItems[index].completed = originalCompleted;
        setList({ ...list, items: revertedItems });
        setErrorItems(prev => new Set(prev).add(index));
      }
    } catch (error) {
      // Error: show error state and revert the item's completed state
      const revertedItems = [...list.items];
      revertedItems[index].completed = originalCompleted;
      setList({ ...list, items: revertedItems });
      setErrorItems(prev => new Set(prev).add(index));
    } finally {
      // Clear loading state and original state tracking
      setLoadingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
      setOriginalItemStates(prev => {
        const newMap = new Map(prev);
        newMap.delete(index);
        return newMap;
      });
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

    const updatedItems = [...list.items, newShoppingItem];

    // Optimistic update
    setList({ ...list, items: updatedItems });
    setNewItem({ name: '', amount: '', unit: '' });
    setShowAddModal(false);

    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems,
        }),
      });

      if (response.ok) {
        setLastUpdated(new Date());
      } else {
        // Revert on error
        setList({ ...list, items: list.items });
        setShowAddModal(true);
        setNewItem({ 
          name: newShoppingItem.name, 
          amount: newShoppingItem.amount, 
          unit: newShoppingItem.unit 
        });
        console.error('Error adding item:', response.statusText);
      }
    } catch (error) {
      // Revert on error
      setList({ ...list, items: list.items });
      setShowAddModal(true);
      setNewItem({ 
        name: newShoppingItem.name, 
        amount: newShoppingItem.amount, 
        unit: newShoppingItem.unit 
      });
      console.error('Error adding item:', error);
    } finally {
      setAddingItem(false);
    }
  };

  const removeItem = async (index: number) => {
    if (!list) return;

    // Clear any previous delete error for this item
    setDeleteErrors(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });

    // Set deleting state
    setDeletingItems(prev => new Set(prev).add(index));

    const updatedItems = list.items.filter((_, i) => i !== index);

    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: updatedItems,
        }),
      });

      if (response.ok) {
        // Success: update the list
        setList({ ...list, items: updatedItems });
        setLastUpdated(new Date());
      } else {
        // Error: show error state
        setDeleteErrors(prev => new Set(prev).add(index));
      }
    } catch (error) {
      // Error: show error state
      setDeleteErrors(prev => new Set(prev).add(index));
    } finally {
      // Clear deleting state
      setDeletingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const handleDragStart = (event: any) => {
    const { active } = event;
    setDraggedItem(list?.items[parseInt(active.id)] || null);
    
    // Prevent scrolling during drag
    document.body.style.overflow = 'hidden';
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);
    
    // Re-enable scrolling
    document.body.style.overflow = 'auto';

    if (!list || !over || active.id === over.id) return;

    const activeIndex = list.items.findIndex((_, index) => index.toString() === active.id);
    const overIndex = list.items.findIndex((_, index) => index.toString() === over.id);

    if (activeIndex !== overIndex) {
      const reorderedItems = arrayMove(list.items, activeIndex, overIndex);
      
      // Optimistic update
      setList({ ...list, items: reorderedItems });

      try {
        const response = await fetch(`/api/shopping-lists/${listId}/reorder`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: reorderedItems,
          }),
        });

        if (response.ok) {
          setLastUpdated(new Date());
        } else {
          // Revert on error
          setList({ ...list, items: list.items });
          console.error('Error reordering items:', response.statusText);
        }
      } catch (error) {
        // Revert on error
        setList({ ...list, items: list.items });
        console.error('Error reordering items:', error);
      }
    }
  };

  const startEditing = (index: number) => {
    if (!list) return;
    const item = list.items[index];
    setEditingIndex(index);
    setEditingItem({
      name: item.name,
      amount: item.amount,
      unit: item.unit
    });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingItem({ name: '', amount: '', unit: '' });
  };

  const handleDragCancel = () => {
    setDraggedItem(null);
    // Re-enable scrolling
    document.body.style.overflow = 'auto';
  };

  const saveEdit = async () => {
    if (!list || editingIndex === null || !editingItem.name.trim()) return;

    const updatedItems = [...list.items];
    updatedItems[editingIndex] = {
      ...updatedItems[editingIndex],
      name: editingItem.name.trim(),
      amount: editingItem.amount.trim(),
      unit: editingItem.unit.trim()
    };

    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
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
        setLastUpdated(new Date());
        cancelEditing();
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  if (status === 'loading') {
    return <PageLoadingSkeleton />;
  }

  if (!session) return null;

  // Sortable Item Component
  const SortableItem = ({ item, index, isCompleted }: { item: ShoppingItem; index: number; isCompleted: boolean }) => {
    const isLoading = loadingItems.has(index);
    const hasError = errorItems.has(index);
    const isDeleting = deletingItems.has(index);
    const hasDeleteError = deleteErrors.has(index);
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: index.toString() });

    // Restrict transform to vertical movement only
    const constrainedTransform = transform ? {
      ...transform,
      x: 0, // Force horizontal movement to 0
    } : null;

    const style = {
      transform: CSS.Transform.toString(constrainedTransform),
      transition,
      opacity: isDragging ? 0.8 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg transition-colors min-w-0 overflow-hidden ${
          isCompleted 
            ? 'bg-gray-100 dark:bg-gray-700/50' 
            : 'bg-gray-50 dark:bg-gray-700'
        } ${
          isDragging ? 'shadow-lg ring-2 ring-primary-500 ring-opacity-50' : ''
        } ${
          (hasError || hasDeleteError) ? 'ring-2 ring-red-500 ring-opacity-30' : ''
        } ${
          (isLoading || isDeleting) ? 'opacity-60' : ''
        }`}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none p-1 -m-1"
          style={{ touchAction: 'none' }}
        >
          <IoReorderThree size={20} />
        </div>

        {/* Checkbox */}
        <button 
          onClick={() => toggleItem(index)} 
          className="text-xl flex-shrink-0 relative"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          ) : hasError ? (
            <div className="text-red-500 relative">
              <IoSquareOutline />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
            </div>
          ) : isCompleted ? (
            <IoCheckbox className="text-green-500" />
          ) : (
            <IoSquareOutline className="text-gray-400 hover:text-green-500 transition-colors" />
          )}
        </button>

        {/* Item content */}
        {editingIndex === index ? (
          <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
            {/* Item name input */}
            <input
              type="text"
              value={editingItem.name}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              className="w-full max-w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-0"
              placeholder="Item name"
            />
            {/* Amount and unit inputs */}
            <div className="flex gap-1 sm:gap-2 min-w-0">
              <input
                type="text"
                value={editingItem.amount}
                onChange={(e) => setEditingItem({ ...editingItem, amount: e.target.value })}
                className="w-0 flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-0"
                placeholder="Amount"
              />
              <input
                type="text"
                value={editingItem.unit}
                onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                className="w-0 flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-0"
                placeholder="Unit"
              />
            </div>
            {/* Action buttons */}
            <div className="flex gap-1 sm:gap-2 justify-end">
              <button
                onClick={() => setEditingIndex(null)}
                className="px-2 sm:px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded transition-colors flex-shrink-0"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-2 sm:px-3 py-1 text-sm text-white bg-green-600 hover:bg-green-700 rounded transition-colors flex-shrink-0"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex-1 cursor-pointer min-h-[2.5rem] flex flex-col justify-center" onClick={() => startEditing(index)}>
              {/* Error messages */}
              {hasError && (
                <div className="text-xs text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                  <span>Failed to update. Tap to try again.</span>
                </div>
              )}
              {hasDeleteError && (
                <div className="text-xs text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                  <span>Failed to delete. Try again.</span>
                </div>
              )}
              <span className={`font-medium block ${
                isCompleted 
                  ? 'text-gray-500 dark:text-gray-400 line-through' 
                  : 'text-gray-900 dark:text-white'
              } ${
                (isLoading || isDeleting) ? 'opacity-70' : ''
              }`}>
                {item.name}
                {isLoading && <span className="ml-2 text-xs text-green-600 dark:text-green-400">(updating...)</span>}
                {isDeleting && <span className="ml-2 text-xs text-red-600 dark:text-red-400">(deleting...)</span>}
              </span>
              {(item.amount || item.unit) && (
                <span className={`text-sm ${
                  isCompleted 
                    ? 'text-gray-400 dark:text-gray-500 line-through' 
                    : 'text-gray-600 dark:text-gray-300'
                }`}>
                  {item.amount} {item.unit}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Delete button (only show when not editing) */}
        {editingIndex !== index && (
          <button 
            onClick={() => removeItem(index)}
            className="text-gray-400 hover:text-red-600 flex-shrink-0 relative"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : hasDeleteError ? (
              <div className="text-red-500 relative">
                <IoTrash size={16} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
              </div>
            ) : (
              <IoTrash size={16} />
            )}
          </button>
        )}
      </div>
    );
  };

  const completedItems = list?.items.filter(item => item.completed).length || 0;
  const totalItems = list?.items.length || 0;
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : list ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="mb-4">
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
                        <span className="text-xs">{list.invitedUsers.length + 1}</span>
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

            {/* Members Section */}
            {(list.invitedUsers.length > 0 || isOwner) && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <IoPeople size={16} />
                  Members ({list.invitedUsers.length + 1})
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Creator */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {list.createdBy.image ? (
                          <img 
                            src={list.createdBy.image} 
                            alt={list.createdBy.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <IoPersonCircle size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">★</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {list.createdBy.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Owner
                      </p>
                    </div>
                  </div>
                  
                  {/* Invited Members */}
                  {list.invitedUsers.map((member) => (
                    <div key={member._id} className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {member.image ? (
                          <img 
                            src={member.image} 
                            alt={member.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <IoPersonCircle size={24} className="text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Member
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recipe Log Section */}
            {list.recipeLog && list.recipeLog.length > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => setIsRecipeHistoryExpanded(!isRecipeHistoryExpanded)}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <IoBook size={16} />
                    Recipe History ({list.recipeLog.length})
                  </div>
                  {isRecipeHistoryExpanded ? (
                    <IoChevronUp size={16} />
                  ) : (
                    <IoChevronDown size={16} />
                  )}
                </button>
                
                {isRecipeHistoryExpanded && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {list.recipeLog.slice().reverse().map((logEntry) => (
                        <div key={logEntry._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <div className="flex items-start gap-3">
                            {/* Recipe Image/Icon */}
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {logEntry.recipe.image ? (
                                <img 
                                  src={logEntry.recipe.image} 
                                  alt={logEntry.recipe.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <IoBook size={20} className="text-gray-400" />
                              )}
                            </div>
                            
                            {/* Recipe Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <Link 
                                    href={`/recipes/${logEntry.recipe._id}`}
                                    className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate block"
                                  >
                                    {logEntry.recipe.title}
                                  </Link>
                                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <IoPersonCircle size={12} />
                                      <span>{logEntry.addedBy.name}</span>
                                    </div>
                                    {logEntry.recipe.cookingTime && (
                                      <div className="flex items-center gap-1">
                                        <IoTime size={12} />
                                        <span>{logEntry.recipe.cookingTime}m</span>
                                      </div>
                                    )}
                                    <span>
                                      {logEntry.servings} serving{logEntry.servings !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(logEntry.addedAt).toLocaleDateString()}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {logEntry.addedCount > 0 && `+${logEntry.addedCount} new`}
                                    {logEntry.addedCount > 0 && logEntry.combinedCount > 0 && ', '}
                                    {logEntry.combinedCount > 0 && `${logEntry.combinedCount} combined`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Floating Add Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="fixed bottom-20 right-4 md:bottom-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full px-6 py-3 shadow-lg transition-all duration-200 hover:scale-105 z-40 flex items-center gap-2"
              style={{ 
                backgroundColor: 'var(--color-primary-600)',
                boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4)'
              }}
            >
              <IoAdd size={20} />
              <span className="text-sm font-medium">Add item</span>
            </button>

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

            {/* Items List */}
            {list.items.length === 0 ? (
              <div className="text-center py-8">
                <IoCart size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No items in this list yet
                </p>
              </div>
            ) : (
              <>
                {/* Uncompleted Items */}
                {list.items.filter((item, index) => {
                  if (loadingItems.has(index)) {
                    // If loading, show in original section
                    return originalItemStates.get(index) === false;
                  }
                  return !item.completed;
                }).length > 0 && (
                  <div className="mb-4">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={customCollisionDetection}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragCancel={handleDragCancel}
                      measuring={measuring}
                    >
                      <SortableContext
                        items={list.items.filter((item, index) => {
                          if (loadingItems.has(index)) {
                            return originalItemStates.get(index) === false;
                          }
                          return !item.completed;
                        }).map((_, filteredIndex) => list.items.indexOf(list.items.filter((item, index) => {
                          if (loadingItems.has(index)) {
                            return originalItemStates.get(index) === false;
                          }
                          return !item.completed;
                        })[filteredIndex]).toString())}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {list.items.filter((item, index) => {
                            if (loadingItems.has(index)) {
                              return originalItemStates.get(index) === false;
                            }
                            return !item.completed;
                          }).map((item, filteredIndex) => {
                            const index = list.items.indexOf(item);
                            return (
                              <SortableItem
                                key={`item-${index}`}
                                item={item}
                                index={index}
                                isCompleted={loadingItems.has(index) ? (originalItemStates.get(index) || false) : item.completed}
                              />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}
                
                {/* Completed Items */}
                {list.items.filter((item, index) => {
                  if (loadingItems.has(index)) {
                    // If loading, show in original section
                    return originalItemStates.get(index) === true;
                  }
                  return item.completed;
                }).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                      Completed ({list.items.filter((item, index) => {
                        if (loadingItems.has(index)) {
                          return originalItemStates.get(index) === true;
                        }
                        return item.completed;
                      }).length})
                    </h3>
                    <div className="space-y-2">
                      {list.items.filter((item, index) => {
                        if (loadingItems.has(index)) {
                          return originalItemStates.get(index) === true;
                        }
                        return item.completed;
                      }).map((item, filteredIndex) => {
                        const index = list.items.indexOf(item);
                        return (
                          <SortableItem
                            key={`item-${index}`}
                            item={item}
                            index={index}
                            isCompleted={loadingItems.has(index) ? (originalItemStates.get(index) || false) : item.completed}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
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