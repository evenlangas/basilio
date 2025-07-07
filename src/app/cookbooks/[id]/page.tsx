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
  IoBook, 
  IoLockClosed, 
  IoGlobe,
  IoPeople,
  IoTrash,
  IoPersonCircle,
  IoRestaurant,
  IoTime
} from 'react-icons/io5';
import { getCountryByCode } from '@/utils/countries';
import { getTagsDisplay, getFirstTagByPriority } from '@/utils/tags';

interface Recipe {
  _id: string;
  title: string;
  description: string;
  image?: string;
  cookingTime: number;
  servings: number;
  tags: string[];
  cuisine?: string;
  mealType?: string;
  averageRating?: number;
  totalRatings?: number;
  isReference?: boolean;
  originalRecipe?: { _id: string; title: string };
  originalChef?: { _id: string; name: string; image?: string };
  createdBy?: { _id: string; name: string; image?: string };
}

interface Cookbook {
  _id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  recipes: Recipe[];
  referencedRecipes?: Recipe[];
  allRecipes?: Recipe[];
  createdBy: {
    _id: string;
    name: string;
    image?: string;
  };
  invitedUsers: Array<{
    _id: string;
    name: string;
    image?: string;
  }>;
  image?: string;
  createdAt: string;
}

export default function CookbookPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [cookbookId, setCookbookId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setCookbookId(id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (status === 'loading' || !cookbookId) return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadCookbook();
  }, [session, status, router, cookbookId]);

  const loadCookbook = async () => {
    try {
      const response = await fetch(`/api/cookbooks/${cookbookId}`);
      if (response.ok) {
        const data = await response.json();
        setCookbook(data);
        setIsOwner(data.createdBy._id === session?.user?.id);
      } else if (response.status === 404) {
        router.push('/cookbooks');
      }
    } catch (error) {
      console.error('Error loading cookbook:', error);
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
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : cookbook ? (
          <div className="space-y-8">
            {/* Header */}
            <div className="mb-6">
              {/* Mobile Header */}
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
                      {cookbook.name}
                    </h1>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {cookbook.isPrivate ? (
                        <IoLockClosed size={16} className="text-gray-500" />
                      ) : (
                        <IoGlobe size={16} className="text-green-500" />
                      )}
                      {cookbook.invitedUsers.length > 0 && (
                        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                          <IoPeople size={14} />
                          <span className="text-xs">{cookbook.invitedUsers.length + 1}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Created by {cookbook.createdBy.name} • {cookbook.recipes.length} recipes
                  </p>
                </div>
              </div>

              {/* Description */}
              {cookbook.description && (
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4">
                  {cookbook.description}
                </p>
              )}

              {/* Members Section */}
              {(cookbook.invitedUsers.length > 0 || isOwner) && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <IoPeople size={16} />
                    Members ({cookbook.invitedUsers.length + 1})
                  </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Creator */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {cookbook.createdBy.image ? (
                          <img 
                            src={cookbook.createdBy.image} 
                            alt={cookbook.createdBy.name}
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
                        {cookbook.createdBy.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Owner
                      </p>
                    </div>
                  </div>
                  
                  {/* Invited Members */}
                  {cookbook.invitedUsers.map((member) => (
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
              
              {/* Action Buttons - Mobile Optimized */}
              {isOwner && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Link
                    href={`/cookbooks/${cookbook._id}/settings`}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <IoSettings size={18} />
                    <span className="text-sm">Settings</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Recipes Grid */}
            {(cookbook.allRecipes || cookbook.recipes).length === 0 ? (
              <div className="text-center py-12">
                <IoBook size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  No recipes yet
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {isOwner ? 'Add your first recipe to this cookbook' : 'This cookbook is empty'}
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                {(cookbook.allRecipes || cookbook.recipes).map((recipe) => (
                  <Link
                    key={recipe._id}
                    href={`/recipes/${recipe._id}`}
                    className="recipe-card card"
                  >
                    {recipe.image ? (
                      <div className="h-40 sm:h-48 overflow-hidden">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="recipe-image"
                        />
                      </div>
                    ) : (
                      <div className="h-40 sm:h-48 flex items-center justify-center" style={{backgroundColor: 'var(--color-bg-tertiary)'}}>
                        <div className="text-center" style={{color: 'var(--color-text-tertiary)'}}>
                          <div className="text-3xl sm:text-4xl mb-2">
                            <IoRestaurant size={40} />
                          </div>
                          <div className="text-xs sm:text-sm">No image</div>
                        </div>
                      </div>
                    )}
                    <div className="recipe-content">
                      <h3 className="recipe-title">
                        {recipe.title}
                      </h3>
                      
                      {recipe.description && (
                        <p className="recipe-description">
                          {recipe.description}
                        </p>
                      )}
                      
                      <div className="recipe-meta">
                        <span className="flex items-center">
                          <IoTime className="mr-1" size={16} />
                          {recipe.cookingTime || 0}m
                        </span>
                        {recipe.totalRatings && recipe.totalRatings > 0 ? (
                          <span>
                            {recipe.averageRating?.toFixed(1)} 🤌 ({recipe.totalRatings} creation{recipe.totalRatings !== 1 ? 's' : ''})
                          </span>
                        ) : (
                          <span className="text-gray-400">No ratings yet</span>
                        )}
                      </div>
                      
                      {(() => {
                        const firstTag = getFirstTagByPriority(recipe.tags || []);
                        const hasContent = (recipe.cuisine && getCountryByCode(recipe.cuisine)) || firstTag;
                        
                        return hasContent ? (
                          <div className="flex items-center gap-2 mb-3 sm:mb-4">
                            {recipe.cuisine && getCountryByCode(recipe.cuisine) && (
                              <span className="text-lg" title={getCountryByCode(recipe.cuisine)?.name}>
                                {getCountryByCode(recipe.cuisine)?.flag}
                              </span>
                            )}
                            {firstTag && (
                              <span className="badge badge-success capitalize">
                                {firstTag.replace('-', ' ')}
                              </span>
                            )}
                          </div>
                        ) : null;
                      })()}
                      
                      <div className="flex items-center justify-between" style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)'}}>
                        <span className="truncate mr-2">
                          {recipe.createdBy?.name || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Cookbook not found
            </p>
          </div>
        )}
      </main>
    </div>
  );
}