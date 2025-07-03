'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import ChefDisplay from '@/components/ChefDisplay';
import UserMentions from '@/components/UserMentions';
import { IoRestaurantOutline, IoArrowBack, IoTimeOutline, IoPeopleOutline, IoCreateOutline, IoTrashOutline, IoChatbubbleOutline } from 'react-icons/io5';
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

interface Creation {
  _id: string;
  title: string;
  description: string;
  image: string;
  createdBy: User;
  likes: User[];
  comments?: Comment[];
  recipe?: Recipe;
  recipeRating?: number;
  eatenWith?: string;
  cookingTime?: number;
  drankWith?: string;
  chefName?: string;
  createdAt: string;
}

export default function CreationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id } = use(params);
  const [creation, setCreation] = useState<Creation | null>(null);
  const [loading, setLoading] = useState(true);
  const [yumming, setYumming] = useState(false);
  const [showYumList, setShowYumList] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadCreation();
    loadComments();
  }, [session, status, router, id]);


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
    
    setYumming(true);
    try {
      const response = await fetch(`/api/creations/${creation._id}/yum`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreation(data.creation);
      }
    } catch (error) {
      console.error('Error yumming creation:', error);
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
        {/* Header with Back and Edit buttons */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <IoArrowBack size={20} />
            <span>Back</span>
          </button>
          
          {isOwner && (
            <Link
              href={`/creations/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: 'var(--color-primary-600)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
            >
              <IoCreateOutline size={18} />
              <span>Edit</span>
            </Link>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-visible">
          {/* Header */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              {creation.createdBy.image ? (
                <img 
                  src={creation.createdBy.image} 
                  alt={creation.createdBy.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 dark:text-gray-300 font-medium text-lg">
                  {creation.createdBy.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {creation.createdBy.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(creation.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            {/* Delete button for owner */}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                title="Delete creation"
              >
                <IoTrashOutline size={20} />
              </button>
            )}
          </div>

          {/* Image */}
          {creation.image && (
            <img 
              src={creation.image} 
              alt={creation.title}
              className="w-full h-64 sm:h-96 object-cover"
            />
          )}

          {/* Content */}
          <div className="p-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {creation.title}
            </h1>
            
            {creation.description && (
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-lg leading-relaxed">
                {creation.description}
              </p>
            )}

            {/* Creation Details */}
            {(creation.eatenWith || creation.cookingTime || creation.drankWith || creation.chefName) && (
              <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                {creation.eatenWith && (
                  <div className="flex items-center gap-1">
                    <IoPeopleOutline size={16} />
                    <span>Eaten with: </span>
                    <UserMentions text={creation.eatenWith} />
                  </div>
                )}
                {creation.cookingTime && (
                  <div className="flex items-center gap-1">
                    <IoTimeOutline size={16} />
                    <span>Cooking time: {creation.cookingTime} minutes</span>
                  </div>
                )}
                {creation.drankWith && (
                  <div className="flex items-center gap-1">
                    <span>🥤 Drank with: {creation.drankWith}</span>
                  </div>
                )}
                {creation.chefName && (
                  <div className="flex items-center gap-1">
                    <span>👨‍🍳 Chef: </span>
                    <ChefDisplay chefName={creation.chefName} />
                  </div>
                )}
              </div>
            )}
            
            {/* Yum Actions */}
            <div className="flex items-center gap-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button 
                onClick={handleYum}
                disabled={yumming}
                className={`flex items-center gap-2 transition-colors ${
                  hasYummed 
                    ? 'text-green-600' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-green-600'
                }`}
              >
                {hasYummed ? <FaGrinHearts size={24} style={{ color: 'var(--color-primary-600)' }} /> : <FaRegGrinHearts size={24} />}
                <span className="font-medium">
                  {hasYummed ? 'Yummed' : 'Yum'}
                </span>
              </button>
              
              {creation.likes.length > 0 && (
                <button
                  onClick={() => setShowYumList(!showYumList)}
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  {creation.likes.length} {creation.likes.length === 1 ? 'yum' : 'yums'}
                </button>
              )}
            </div>

            {/* Yum List */}
            {showYumList && creation.likes.length > 0 && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                  Yummed by:
                </h4>
                <div className="space-y-2">
                  {creation.likes.map((user) => (
                    <div key={user._id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {user.image ? (
                          <img 
                            src={user.image} 
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-gray-900 dark:text-white">
                        {user.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <Link
                href={`/creations/${id}/comments`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <IoChatbubbleOutline size={20} className="text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {comments.length === 0 ? 'Add a comment' : `${comments.length} comment${comments.length === 1 ? '' : 's'}`}
                  </span>
                </div>
                <IoArrowBack size={16} className="text-gray-400 rotate-180" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recipe Section */}
        {creation.recipe && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <IoRestaurantOutline size={20} className="text-gray-600 dark:text-gray-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Recipe Used
                </h2>
              </div>
              <Link
                href={`/recipes/${creation.recipe._id}`}
                className="text-lg font-semibold hover:underline"
                style={{ color: 'var(--color-primary-600)' }}
              >
                {creation.recipe.title}
              </Link>
              {creation.recipe.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {creation.recipe.description}
                </p>
              )}
              {creation.recipeRating && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">My rating:</span>
                  <div className="flex">
                    {renderPinchedFingers(creation.recipeRating)}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({creation.recipeRating} chef's {creation.recipeRating === 1 ? 'kiss' : 'kisses'})
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                {creation.recipe.cookingTime && (
                  <div className="flex items-center gap-1">
                    <IoTimeOutline size={16} />
                    <span>{creation.recipe.cookingTime} minutes</span>
                  </div>
                )}
                {creation.recipe.servings && (
                  <div className="flex items-center gap-1">
                    <IoPeopleOutline size={16} />
                    <span>{creation.recipe.servings} servings</span>
                  </div>
                )}
              </div>
              
              <Link
                href={`/recipes/${creation.recipe._id}`}
                className="inline-flex items-center px-4 py-2 text-white rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--color-primary-600)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-700)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-600)'}
              >
                View Full Recipe
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}