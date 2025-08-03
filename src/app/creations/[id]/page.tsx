'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import ChefDisplay from '@/components/ChefDisplay';
import UserMentions from '@/components/UserMentions';
import FlexibleEntriesDisplay from '@/components/FlexibleEntriesDisplay';
import { IoRestaurantOutline, IoArrowBack, IoTimeOutline, IoPeopleOutline, IoCreateOutline, IoTrashOutline, IoChatbubbleOutline, IoEllipsisVertical } from 'react-icons/io5';
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
  ingredients?: Array<{
    name: string;
    amount: string;
    unit: string;
  }>;
  instructions?: Array<{
    step: number;
    description: string;
  }>;
}

interface Comment {
  _id: string;
  user: User;
  text: string;
  createdAt: string;
  updatedAt?: string;
}

interface FlexibleEntry {
  id: string;
  type: 'user' | 'custom';
  name: string;
  user?: User;
}

interface Creation {
  _id: string;
  title: string;
  description: string;
  image: string;
  createdBy: User;
  likes: User[];
  comments?: Comment[];
  recipes?: Array<{
    recipe: Recipe;
    rating?: number;
  }>;
  eatenWith?: string;
  eatenWithEntries?: FlexibleEntry[];
  cookingTime?: number;
  drankWith?: string;
  chefName?: string;
  chefEntries?: FlexibleEntry[];
  chef?: User;
  createdAt: string;
}

export default function CreationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = use(params);
  const [creation, setCreation] = useState<Creation | null>(null);
  const [loading, setLoading] = useState(true);
  const [yumming, setYumming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadCreation();
    loadComments();
  }, [session, status, router, id]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (showOptionsMenu) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showOptionsMenu]);


  const loadCreation = async () => {
    try {
      const response = await fetch(`/api/creations/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCreation(data);
      } else if (response.status === 404) {
        router.push('/404');
      }
    } catch (error) {
      console.error('Error loading creation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/creations/${id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };


  const handleYum = async () => {
    if (!creation || yumming) return;
    
    const userHasYummed = hasYummed;
    const currentUser = { _id: session?.user?.id, name: session?.user?.name, image: session?.user?.image };
    
    // Optimistic update - update UI immediately
    setCreation(prev => {
      if (!prev) return prev;
      const currentLikes = prev.likes || [];
      const newLikes = userHasYummed 
        ? currentLikes.filter(like => like._id !== session?.user?.id)
        : [...currentLikes, currentUser];
      return { ...prev, likes: newLikes };
    });
    
    setYumming(true);
    try {
      const response = await fetch(`/api/creations/${creation._id}/yum`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreation(data.creation);
      } else {
        // Revert optimistic update on error
        setCreation(prev => {
          if (!prev) return prev;
          const currentLikes = prev.likes || [];
          const revertedLikes = userHasYummed 
            ? [...currentLikes, currentUser]
            : currentLikes.filter(like => like._id !== session?.user?.id);
          return { ...prev, likes: revertedLikes };
        });
      }
    } catch (error) {
      console.error('Error yumming creation:', error);
      // Revert optimistic update on error
      setCreation(prev => {
        if (!prev) return prev;
        const currentLikes = prev.likes || [];
        const revertedLikes = userHasYummed 
          ? [...currentLikes, currentUser]
          : currentLikes.filter(like => like._id !== session?.user?.id);
        return { ...prev, likes: revertedLikes };
      });
    } finally {
      setYumming(false);
    }
  };

  const hasYummed = creation?.likes.some(like => like._id === session?.user?.id);
  const isOwner = creation?.createdBy._id === session?.user?.id;

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

  const handleDelete = async () => {
    if (!creation || deleting) return;
    
    if (!confirm('Are you sure you want to delete this creation?')) {
      return;
    }
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/creations/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/creations');
      } else {
        console.error('Failed to delete creation');
      }
    } catch (error) {
      console.error('Error deleting creation:', error);
    } finally {
      setDeleting(false);
    }
  };

  if (status === 'loading' || loading) {
    return <PageLoadingSkeleton />;
  }

  if (!session || !creation) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <IoArrowBack size={20} />
            <span>Back</span>
          </button>
        </div>

        {/* Creation Card - matching feed layout */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="p-3 sm:p-4 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              {creation.createdBy.image ? (
                <img 
                  src={creation.createdBy.image} 
                  alt={creation.createdBy.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
                  {creation.createdBy.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base break-words">
                <span className="break-words">{creation.createdBy.name}</span>
                {((creation.chefEntries && creation.chefEntries.length > 0) || creation.chefName || creation.chef) && (
                  <span className="font-normal text-gray-600 dark:text-gray-400">
                    {' '}cooked with{' '}
                    {creation.chefEntries && creation.chefEntries.length > 0 ? (
                      <FlexibleEntriesDisplay 
                        entries={creation.chefEntries} 
                        maxDisplay={2} 
                        className="inline" 
                      />
                    ) : creation.chef ? (
                      <Link href={`/profile/${creation.chef._id}`} className="font-semibold hover:underline text-gray-900 dark:text-white break-words">
                        {creation.chef.name}
                      </Link>
                    ) : (
                      <ChefDisplay chefName={creation.chefName} className="text-sm" showProfilePicture={false} />
                    )}
                  </span>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {new Date(creation.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            {/* Three-dot menu for owner */}
            {isOwner && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsMenu(!showOptionsMenu);
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <IoEllipsisVertical size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
                
                {showOptionsMenu && (
                  <div 
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-2">
                      <Link
                        href={`/creations/${id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setShowOptionsMenu(false)}
                      >
                        <IoCreateOutline size={16} />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => {
                          setShowOptionsMenu(false);
                          handleDelete();
                        }}
                        disabled={deleting}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full text-left disabled:opacity-50"
                      >
                        <IoTrashOutline size={16} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image */}
          {creation.image && (
            <img 
              src={creation.image} 
              alt={creation.title}
              className="w-full h-48 sm:h-64 object-cover"
            />
          )}

          {/* Content */}
          <div className="p-3 sm:p-4">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base">
              {creation.title}
            </h4>
            {creation.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm sm:text-base line-clamp-2">
                {creation.description}
              </p>
            )}
            
          </div>

        </div>

        {/* Consolidated Information Section */}
        {(((creation.eatenWithEntries && creation.eatenWithEntries.length > 0) || creation.eatenWith) || 
          (creation.cookingTime && creation.cookingTime > 0) || 
          creation.drankWith || 
          ((creation.recipes && creation.recipes.length > 0) || creation.recipe)) && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Creation Details</h3>
            <div className="space-y-4">
              
              {/* Eaten With */}
              {((creation.eatenWithEntries && creation.eatenWithEntries.length > 0) || creation.eatenWith) && (
                <div className="flex items-center gap-2">
                  <IoPeopleOutline size={16} className="text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Ate with{' '}
                    {creation.eatenWithEntries && creation.eatenWithEntries.length > 0 ? (
                      <FlexibleEntriesDisplay 
                        entries={creation.eatenWithEntries} 
                        maxDisplay={3} 
                        className="inline" 
                      />
                    ) : creation.eatenWith ? (
                      <UserMentions text={creation.eatenWith} />
                    ) : null}
                  </span>
                </div>
              )}
              
              {/* Cooking Time */}
              {creation.cookingTime && creation.cookingTime > 0 && (
                <div className="flex items-center gap-2">
                  <IoTimeOutline size={16} className="text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-300">{creation.cookingTime} minutes</span>
                </div>
              )}
              
              {/* Drank With */}
              {creation.drankWith && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600 dark:text-gray-300">🥤 {creation.drankWith}</span>
                </div>
              )}
              
              {/* Recipes Section */}
              {((creation.recipes && creation.recipes.length > 0) || creation.recipe) && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <IoRestaurantOutline size={16} />
                    Recipe{((creation.recipes && creation.recipes.length > 1) || (!creation.recipes && creation.recipe)) ? 's' : ''} Used
                  </h4>
                  <div className="space-y-3">
                    {/* New format: multiple recipes */}
                    {creation.recipes && creation.recipes.length > 0 ? (
                      creation.recipes.map((recipeItem, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <IoRestaurantOutline size={14} className="text-gray-500 dark:text-gray-400" />
                            <Link 
                              href={`/recipes/${recipeItem.recipe._id}`}
                              className="text-green-600 dark:text-green-400 hover:underline font-medium"
                            >
                              {recipeItem.recipe.title}
                            </Link>
                            <span className="text-gray-500 dark:text-gray-400">
                              ({recipeItem.recipe.averageRating ? recipeItem.recipe.averageRating.toFixed(1) : '0.0'} 🤌)
                            </span>
                          </div>
                          {recipeItem.rating && (
                            <div className="flex items-center gap-2 ml-5">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Your rating:</span>
                              <div className="flex">
                                {renderPinchedFingers(recipeItem.rating)}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      /* Old format: single recipe - for backward compatibility */
                      creation.recipe && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <IoRestaurantOutline size={14} className="text-gray-500 dark:text-gray-400" />
                            <Link 
                              href={`/recipes/${creation.recipe._id}`}
                              className="text-green-600 dark:text-green-400 hover:underline font-medium"
                            >
                              {creation.recipe.title}
                            </Link>
                            <span className="text-gray-500 dark:text-gray-400">
                              ({creation.recipe.averageRating ? creation.recipe.averageRating.toFixed(1) : '0.0'} 🤌)
                            </span>
                          </div>
                          {creation.recipeRating && (
                            <div className="flex items-center gap-2 ml-5">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Your rating:</span>
                              <div className="flex">
                                {renderPinchedFingers(creation.recipeRating)}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Yums and Comments Section - Bottom */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          {/* Yums and Comments - Strava style */}
          <div className="flex items-center justify-center gap-6 mb-4">
            {/* Yums with profile pictures */}
            <Link
              href={`/creations/${id}/yums`}
              className="flex items-center gap-2 hover:opacity-75 transition-opacity"
            >
              {creation.likes && creation.likes.length > 0 ? (
                <>
                  <div className="flex -space-x-2">
                    {creation.likes.slice(0, 3).map((user, index) => (
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
                    {creation.likes.length} yummed
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  0 yummed
                </span>
              )}
            </Link>

            {/* Comments */}
            <Link
              href={`/creations/${id}/comments`}
              className="flex items-center gap-2 hover:opacity-75 transition-opacity"
            >
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {comments?.length || 0} {(comments?.length || 0) === 1 ? 'comment' : 'comments'}
              </span>
            </Link>
          </div>
          
          {/* Action buttons - bigger and more inviting */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={handleYum}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                hasYummed
                  ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-green-900/20 dark:hover:text-green-400 dark:hover:border-green-800'
              }`}
            >
              {hasYummed ? <FaGrinHearts size={20} style={{ color: 'var(--color-primary-600)' }} /> : <FaRegGrinHearts size={20} />}
              <span className="text-sm sm:text-base">
                Yum
              </span>
            </button>
            <Link
              href={`/creations/${id}/comments?focus=true`}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 dark:hover:border-blue-800 transition-all"
            >
              <IoChatbubbleOutline size={20} />
              <span className="text-sm sm:text-base">
                Comment
              </span>
            </Link>
          </div>
        </div>

      </main>
    </div>
  );
}