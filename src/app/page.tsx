'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import ChefDisplay from '@/components/ChefDisplay';
import UserMentions from '@/components/UserMentions';
import { IoSearchOutline, IoRestaurantOutline, IoTimeOutline, IoChatbubbleOutline, IoPeopleOutline } from 'react-icons/io5';
import { FaGrinHearts, FaRegGrinHearts } from 'react-icons/fa';
import { getTagsDisplay, getFirstTagByPriority } from '@/utils/tags';

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
  image?: string;
  createdBy: User;
  averageRating: number;
  totalRatings: number;
  createdAt: string;
  tags?: string[];
}

interface Creation {
  _id: string;
  title: string;
  description: string;
  image: string;
  createdBy: User;
  likes: User[];
  recipes?: Array<{
    recipe: Recipe;
    rating?: number;
  }>;
  recipe?: Recipe;
  recipeRating?: number;
  eatenWith?: string;
  cookingTime?: number;
  drankWith?: string;
  chefName?: string;
  createdAt: string;
  comments?: Array<{
    user: User;
    text: string;
    createdAt: string;
  }>;
}

interface FeedItem {
  type: 'creation' | 'recipe';
  _id: string;
  title: string;
  description?: string;
  image?: string;
  createdBy: User;
  createdAt: string;
  // Creation-specific fields
  likes?: User[];
  recipes?: Array<{
    recipe: Recipe;
    rating?: number;
  }>;
  recipe?: Recipe;
  recipeRating?: number;
  eatenWith?: string;
  cookingTime?: number;
  drankWith?: string;
  chefName?: string;
  comments?: Array<{
    user: User;
    text: string;
    createdAt: string;
  }>;
  // Recipe-specific fields
  averageRating?: number;
  totalRatings?: number;
  tags?: string[];
  mealType?: string;
  servings?: number;
}

const renderPinchedFingers = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => {
    const isSelected = i < rating;
    return (
      <span 
        key={i} 
        className={`inline-block transition-all ${
          isSelected ? 'opacity-100' : 'opacity-30'
        }`}
        style={{
          filter: isSelected ? 'hue-rotate(0deg) saturate(1.2)' : 'grayscale(80%)'
        }}
      >
        🤌
      </span>
    );
  });
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [yummingStates, setYummingStates] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    // Load feed items (creations and recipes)
    loadFeed();
  }, [session, status, router]);

  const loadFeed = async () => {
    try {
      const response = await fetch('/api/feed');
      if (response.ok) {
        const data = await response.json();
        setFeedItems(data);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleYum = async (creationId: string) => {
    if (yummingStates[creationId]) return;
    
    const currentItem = feedItems.find(item => item._id === creationId && item.type === 'creation');
    if (!currentItem) return;
    
    const userHasYummed = hasYummed(currentItem);
    const currentUser = { _id: session?.user?.id, name: session?.user?.name, image: session?.user?.image };
    
    // Optimistic update - update UI immediately
    setFeedItems(prev => prev.map(item => {
      if (item._id === creationId && item.type === 'creation') {
        const currentLikes = item.likes || [];
        const newLikes = userHasYummed 
          ? currentLikes.filter(like => like._id !== session?.user?.id)
          : [...currentLikes, currentUser];
        return { ...item, likes: newLikes };
      }
      return item;
    }));
    
    setYummingStates(prev => ({ ...prev, [creationId]: true }));
    
    try {
      const response = await fetch(`/api/creations/${creationId}/yum`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update with server response to ensure consistency
        setFeedItems(prev => prev.map(item => 
          item._id === creationId && item.type === 'creation' ? { ...data.creation, type: 'creation' } : item
        ));
      } else {
        // Revert optimistic update on error
        setFeedItems(prev => prev.map(item => {
          if (item._id === creationId && item.type === 'creation') {
            const currentLikes = item.likes || [];
            const revertedLikes = userHasYummed 
              ? [...currentLikes, currentUser]
              : currentLikes.filter(like => like._id !== session?.user?.id);
            return { ...item, likes: revertedLikes };
          }
          return item;
        }));
      }
    } catch (error) {
      console.error('Error yumming creation:', error);
      // Revert optimistic update on error
      setFeedItems(prev => prev.map(item => {
        if (item._id === creationId && item.type === 'creation') {
          const currentLikes = item.likes || [];
          const revertedLikes = userHasYummed 
            ? [...currentLikes, currentUser]
            : currentLikes.filter(like => like._id !== session?.user?.id);
          return { ...item, likes: revertedLikes };
        }
        return item;
      }));
    } finally {
      setYummingStates(prev => ({ ...prev, [creationId]: false }));
    }
  };

  const hasYummed = (item: FeedItem) => {
    if (item.type !== 'creation' || !item.likes) return false;
    return item.likes.some(like => like._id === session?.user?.id);
  };

  const renderPinchedFingers = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const isSelected = i < rating;
      return (
        <span 
          key={i} 
          className={`inline-block transition-all ${
            isSelected ? 'opacity-100' : 'opacity-30'
          }`}
          style={{
            filter: isSelected ? 'hue-rotate(0deg) saturate(1.2)' : 'grayscale(80%)'
          }}
        >
          🤌
        </span>
      );
    });
  };

  if (status === 'loading') {
    return <PageLoadingSkeleton />;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feed */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
          </div>
        ) : feedItems.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              No feed items yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Follow other chefs to see their creations and recipes in your feed
            </p>
            <Link
              href="/explore"
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
            {feedItems.map((item) => (
              item.type === 'creation' ? (
                // Creation Card (existing design)
                <Link key={item._id} href={`/creations/${item._id}`} className="block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  {/* Header */}
                  <div className="p-3 sm:p-4 flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {item.createdBy.image ? (
                        <img 
                          src={item.createdBy.image} 
                          alt={item.createdBy.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
                          {item.createdBy.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {item.createdBy.name}
                      </h3>
                      {item.chefName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Chef: <ChefDisplay chefName={item.chefName} className="text-xs" showProfilePicture={false} asLink={false} />
                        </p>
                      )}
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Image and Content */}
                  <div>
                    {item.image && (
                      <img 
                        src={item.image} 
                        alt={item.title}
                        className="w-full h-48 sm:h-64 object-cover hover:opacity-95 transition-opacity"
                      />
                    )}

                    {/* Content */}
                    <div className="p-3 sm:p-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base hover:underline">
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm sm:text-base line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      
                      {/* Eaten With */}
                      {item.eatenWith && (
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-sm mb-2">
                          <IoPeopleOutline size={16} />
                          <span>{item.eatenWith}</span>
                        </div>
                      )}
                      
                      {/* Recipe Information */}
                      {((item.recipes && item.recipes.length > 0) || item.recipe) && (
                        <div className="space-y-1 mb-3">
                          {/* New format: multiple recipes */}
                          {item.recipes && item.recipes.length > 0 ? (
                            item.recipes.map((recipeItem, index) => (
                              <div key={index} className="flex items-center gap-1 text-sm">
                                <IoRestaurantOutline size={14} className="text-gray-500 dark:text-gray-400" />
                                <Link 
                                  href={`/recipes/${recipeItem.recipe._id}`}
                                  className="text-green-600 dark:text-green-400 hover:underline font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {recipeItem.recipe.title}
                                </Link>
                                <span className="text-gray-500 dark:text-gray-400">
                                  ({recipeItem.recipe.averageRating ? recipeItem.recipe.averageRating.toFixed(1) : '0.0'} 🤌)
                                </span>
                              </div>
                            ))
                          ) : (
                            /* Old format: single recipe - for backward compatibility */
                            item.recipe && (
                              <div className="flex items-center gap-1 text-sm">
                                <IoRestaurantOutline size={14} className="text-gray-500 dark:text-gray-400" />
                                <Link 
                                  href={`/recipes/${item.recipe._id}`}
                                  className="text-green-600 dark:text-green-400 hover:underline font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {item.recipe.title}
                                </Link>
                                <span className="text-gray-500 dark:text-gray-400">
                                  ({item.recipe.averageRating ? item.recipe.averageRating.toFixed(1) : '0.0'} 🤌)
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                    
                    {/* Yums and Comments - Strava style */}
                    <div className="flex items-center justify-center gap-6 mb-3">
                      {/* Yums with profile pictures */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/creations/${item._id}/yums`);
                        }}
                        className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                      >
                        {item.likes && item.likes.length > 0 ? (
                          <>
                            <div className="flex -space-x-2">
                              {item.likes.slice(0, 3).map((user, index) => (
                                <div 
                                  key={user._id} 
                                  className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center"
                                  style={{ zIndex: 3 - index }}
                                >
                                  {user.image ? (
                                    <img 
                                      src={user.image} 
                                      alt={user.name}
                                      className="w-full h-full rounded-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {item.likes.length} yummed
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            0 yummed
                          </span>
                        )}
                      </button>

                      {/* Comments */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/creations/${item._id}/comments`);
                        }}
                        className="flex items-center gap-2 hover:opacity-75 transition-opacity"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {item.comments?.length || 0} {(item.comments?.length || 0) === 1 ? 'comment' : 'comments'}
                        </span>
                      </button>
                    </div>
                    
                    {/* Action buttons - bigger and more inviting */}
                    <div className="flex items-center gap-4 sm:gap-6">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleYum(item._id);
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                          hasYummed(item)
                            ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                            : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-green-900/20 dark:hover:text-green-400 dark:hover:border-green-800'
                        }`}
                      >
                        {hasYummed(item) ? <FaGrinHearts size={20} style={{ color: 'var(--color-primary-600)' }} /> : <FaRegGrinHearts size={20} />}
                        <span className="text-sm sm:text-base">
                          Yum
                        </span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/creations/${item._id}/comments?focus=true`);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-all"
                      >
                        <IoChatbubbleOutline size={20} />
                        <span className="text-sm sm:text-base">
                          Comment
                        </span>
                      </button>
                    </div>
                  </div>
                </Link>
              ) : (
                // Recipe Card (smaller, compact design)
                <Link key={item._id} href={`/recipes/${item._id}`} className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700">
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {item.createdBy.image ? (
                        <img 
                          src={item.createdBy.image} 
                          alt={item.createdBy.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300 font-medium text-xs">
                          {item.createdBy.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <IoRestaurantOutline size={14} className="text-green-500" />
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {item.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span>by {item.createdBy.name}</span>
                        {item.totalRatings && item.totalRatings > 0 ? (
                          <span>
                            {item.averageRating.toFixed(1)} 🤌 ({item.totalRatings} creation{item.totalRatings !== 1 ? 's' : ''})
                          </span>
                        ) : (
                          <span className="text-gray-400">No ratings yet</span>
                        )}
                        {item.cookingTime && (
                          <div className="flex items-center gap-1">
                            <IoTimeOutline size={12} />
                            <span>{item.cookingTime}min</span>
                          </div>
                        )}
                        {(() => {
                          const firstTag = getFirstTagByPriority(item.tags || []);
                          return firstTag ? (
                            <span className="badge badge-success capitalize text-xs">
                              {firstTag.replace('-', ' ')}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                </Link>
              )
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
