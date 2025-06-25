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
  IoTrash
} from 'react-icons/io5';

interface Recipe {
  _id: string;
  title: string;
  description: string;
  image?: string;
  cookingTime: number;
  servings: number;
  tags: string[];
}

interface Cookbook {
  _id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  recipes: Recipe[];
  createdBy: {
    _id: string;
    name: string;
  };
  invitedUsers: string[];
  image?: string;
  createdAt: string;
}

export default function CookbookPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cookbook, setCookbook] = useState<Cookbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadCookbook();
  }, [session, status, router, params.id]);

  const loadCookbook = async () => {
    try {
      const response = await fetch(`/api/cookbooks/${params.id}`);
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
                          <span className="text-xs">{cookbook.invitedUsers.length}</span>
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
                  <Link
                    href={`/recipes/new?cookbook=${cookbook._id}`}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <IoAdd size={18} />
                    <span className="text-sm">Add Recipe</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Recipes Grid */}
            {cookbook.recipes.length === 0 ? (
              <div className="text-center py-12">
                <IoBook size={64} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  No recipes yet
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {isOwner ? 'Add your first recipe to this cookbook' : 'This cookbook is empty'}
                </p>
                {isOwner && (
                  <Link
                    href={`/recipes/new?cookbook=${cookbook._id}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <IoAdd size={20} />
                    Add Recipe
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {cookbook.recipes.map((recipe) => (
                  <Link
                    key={recipe._id}
                    href={`/recipes/${recipe._id}`}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {recipe.image ? (
                        <img 
                          src={recipe.image} 
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <IoBook size={48} className="text-gray-400 dark:text-gray-500" />
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">
                        {recipe.title}
                      </h3>
                      
                      {recipe.description && (
                        <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm line-clamp-2">
                          {recipe.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>{recipe.cookingTime}m</span>
                        <span>{recipe.servings} servings</span>
                      </div>
                      
                      {recipe.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {recipe.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                          {recipe.tags.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{recipe.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
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