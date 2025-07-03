'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import { IoArrowBack, IoChatbubbleOutline } from 'react-icons/io5';
import { FaGrinHearts, FaRegGrinHearts } from 'react-icons/fa';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface Creation {
  _id: string;
  title: string;
  description: string;
  image: string;
  createdBy: User;
  likes: User[];
  recipeRating?: number;
  createdAt: string;
  comments?: Array<{
    user: User;
    text: string;
    createdAt: string;
  }>;
}

interface Recipe {
  _id: string;
  title: string;
}

export default function RecipeCreationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [recipeId, setRecipeId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setRecipeId(id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (status === 'loading' || !recipeId) return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchData();
  }, [session, status, router, recipeId]);

  const fetchData = async () => {
    try {
      // Fetch recipe details
      const recipeResponse = await fetch(`/api/recipes/${recipeId}`);
      if (recipeResponse.ok) {
        const recipeData = await recipeResponse.json();
        setRecipe(recipeData);
      }

      // Fetch creations
      const creationsResponse = await fetch(`/api/recipes/${recipeId}/creations`);
      if (creationsResponse.ok) {
        const creationsData = await creationsResponse.json();
        setCreations(creationsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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

  if (status === 'loading' || loading) {
    return <PageLoadingSkeleton />;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push(`/recipes/${recipeId}`)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
          >
            <IoArrowBack size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Creations using {recipe?.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {creations.length} creation{creations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Creations Grid */}
        {creations.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              No creations yet
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Be the first to share a creation using this recipe!
            </p>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Share Your Creation
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creations.map((creation) => (
              <Link key={creation._id} href={`/creations/${creation._id}`}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  {creation.image && (
                    <img
                      src={creation.image}
                      alt={creation.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {creation.createdBy.image ? (
                          <img 
                            src={creation.createdBy.image} 
                            alt={creation.createdBy.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                            {creation.createdBy.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {creation.createdBy.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(creation.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {creation.title}
                    </h3>
                    
                    {creation.description && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                        {creation.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <FaGrinHearts size={16} />
                          <span>{creation.likes.length}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <IoChatbubbleOutline size={16} />
                          <span>{creation.comments?.length || 0}</span>
                        </div>
                      </div>
                      {creation.recipeRating && (
                        <div className="flex items-center gap-1">
                          <div className="flex">
                            {renderPinchedFingers(creation.recipeRating)}
                          </div>
                          <span className="text-xs">({creation.recipeRating})</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}