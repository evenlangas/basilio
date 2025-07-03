'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import ChefDisplay from '@/components/ChefDisplay';
import UserMentions from '@/components/UserMentions';
import { IoSearchOutline, IoRestaurantOutline, IoTimeOutline, IoChatbubbleOutline } from 'react-icons/io5';
import { FaGrinHearts, FaRegGrinHearts } from 'react-icons/fa';

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
  mealType?: string;
}

interface Creation {
  _id: string;
  title: string;
  description: string;
  image: string;
  createdBy: User;
  likes: User[];
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
    
    setYummingStates(prev => ({ ...prev, [creationId]: true }));
    try {
      const response = await fetch(`/api/creations/${creationId}/yum`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setFeedItems(prev => prev.map(item => 
          item._id === creationId && item.type === 'creation' ? { ...data.creation, type: 'creation' } : item
        ));
      }
    } catch (error) {
      console.error('Error yumming creation:', error);
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
        {/* Header with Search */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            Home
          </h1>
          <Link
            href="/search"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <IoSearchOutline size={18} />
            <span className="text-sm sm:text-base text-gray-600 dark:text-gray-300 hidden sm:inline">Search</span>
          </Link>
        </div>

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
              href="/search"
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
                          Chef: <ChefDisplay chefName={item.chefName} className="text-xs" showProfilePicture={false} />
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
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleYum(item._id);
                        }}
                        disabled={yummingStates[item._id]}
                        className={`flex items-center gap-1 sm:gap-2 transition-colors ${
                          hasYummed(item)
                            ? 'text-green-600'
                            : 'text-gray-600 dark:text-gray-300 hover:text-green-600'
                        }`}
                      >
                        {hasYummed(item) ? <FaGrinHearts size={18} style={{ color: 'var(--color-primary-600)' }} /> : <FaRegGrinHearts size={18} />}
                        <span className="text-sm font-medium">
                          {item.likes?.length || 0} {(item.likes?.length || 0) === 1 ? 'yum' : 'yums'}
                        </span>
                      </button>
                      <Link
                        href={`/creations/${item._id}/comments`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/creations/${item._id}/comments`;
                        }}
                        className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        <IoChatbubbleOutline size={18} />
                        <span className="text-sm font-medium">
                          {item.comments?.length || 0} {(item.comments?.length || 0) === 1 ? 'comment' : 'comments'}
                        </span>
                      </Link>
                      {item.recipeRating && (
                        <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-300">
                          <div className="flex">
                            {renderPinchedFingers(item.recipeRating)}
                          </div>
                          <span className="text-sm font-medium">
                            {item.recipeRating} chef's {item.recipeRating === 1 ? 'kiss' : 'kisses'}
                          </span>
                        </div>
                      )}
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
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {renderPinchedFingers(Math.round(item.averageRating || 0))}
                            </div>
                            <span>({item.totalRatings})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No ratings yet</span>
                        )}
                        {item.cookingTime && (
                          <div className="flex items-center gap-1">
                            <IoTimeOutline size={12} />
                            <span>{item.cookingTime}min</span>
                          </div>
                        )}
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
