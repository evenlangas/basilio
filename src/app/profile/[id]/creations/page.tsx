'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import ChefDisplay from '@/components/ChefDisplay';
import UserMentions from '@/components/UserMentions';
import { 
  IoArrowBack,
  IoRestaurantOutline,
  IoTime,
  IoPersonCircle,
  IoChatbubbleOutline
} from 'react-icons/io5';
import { FaGrinHearts, FaRegGrinHearts } from 'react-icons/fa';

interface Creation {
  _id: string;
  title: string;
  description: string;
  image: string;
  likes: string[];
  createdBy: { _id: string; name: string };
  createdAt: string;
  eatenWith?: string;
  cookingTime?: number;
  drankWith?: string;
  chefName?: string;
  comments?: Array<{
    user: { _id: string; name: string };
    text: string;
    createdAt: string;
  }>;
  recipe?: {
    _id: string;
    title: string;
    cookingTime?: number;
    servings?: number;
  };
}

interface UserProfile {
  _id: string;
  name: string;
  isPrivate: boolean;
}

export default function UserCreationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id: userId } = use(params);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchUser();
    fetchCreations();
  }, [session, status, router, userId]);

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchCreations = async () => {
    try {
      // Use different API endpoint if viewing own creations
      const isOwnProfile = session?.user?.id === userId;
      const endpoint = isOwnProfile ? '/api/creations' : `/api/user/${userId}/creations`;
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setCreations(data);
      }
    } catch (error) {
      console.error('Error fetching creations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCreations = creations.filter(creation =>
    creation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creation.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation />
        
        <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="skeleton h-10 w-10 rounded-lg" />
            <div className="skeleton h-8 w-48" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-64 rounded-lg" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!session || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
          >
            <IoArrowBack size={20} />
          </button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              {session?.user?.id === userId ? 'My Creations' : `${user.name}'s Creations`}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {creations.length} creation{creations.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search creations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {filteredCreations.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <FaGrinHearts className="text-4xl" style={{ color: 'var(--color-primary-500)' }} size={48} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm ? 'No creations found' : session?.user?.id === userId ? 'No creations yet' : user.isPrivate ? 'Private Profile' : 'No creations yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : session?.user?.id === userId
                ? 'Start sharing your culinary creations with the world'
                : user.isPrivate
                ? 'This user\'s creations are private'
                : `${user.name} hasn't shared any creations yet`
              }
            </p>
            {!searchTerm && session?.user?.id === userId && (
              <Link
                href="/creations/new"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Share Your First Creation
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 mb-8">
            {filteredCreations.map((creation) => (
              <Link key={creation._id} href={`/creations/${creation._id}`} className="block bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                {/* Header */}
                <div className="p-3 sm:p-4 flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 dark:text-gray-300 font-medium text-sm sm:text-base">
                      {creation.createdBy.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate">
                      {creation.createdBy.name}
                    </h3>
                    {creation.chefName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Chef: <ChefDisplay chefName={creation.chefName} className="text-xs" showProfilePicture={false} />
                      </p>
                    )}
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
                </div>

                {/* Image and Content */}
                <div>
                  {creation.image && (
                    <img 
                      src={creation.image} 
                      alt={creation.title}
                      className="w-full h-48 sm:h-64 object-cover hover:opacity-95 transition-opacity"
                    />
                  )}

                  {/* Content */}
                  <div className="p-3 sm:p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm sm:text-base hover:underline">
                      {creation.title}
                    </h4>
                    {creation.description && (
                      <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm sm:text-base line-clamp-2">
                        {creation.description}
                      </p>
                    )}

                  </div>
                </div>

                {/* Actions */}
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-300">
                      <FaGrinHearts size={18} style={{ color: 'var(--color-primary-600)' }} />
                      <span className="text-sm font-medium">
                        {creation.likes.length} {creation.likes.length === 1 ? 'yum' : 'yums'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-300">
                      <IoChatbubbleOutline size={18} />
                      <span className="text-sm font-medium">
                        {creation.comments?.length || 0} {(creation.comments?.length || 0) === 1 ? 'comment' : 'comments'}
                      </span>
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