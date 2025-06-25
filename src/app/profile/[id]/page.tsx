'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import { 
  IoArrowBack, 
  IoPersonCircle, 
  IoTrophy, 
  IoBook, 
  IoHeart, 
  IoPersonAdd,
  IoPersonRemove,
  IoLockClosed,
  IoCheckmark
} from 'react-icons/io5';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image?: string;
  bio: string;
  isPrivate: boolean;
  followers: Array<{
    _id: string;
    name: string;
  }>;
  following: Array<{
    _id: string;
    name: string;
  }>;
  hasBasilioPlus: boolean;
  trophies: {
    type: string;
    unlockedAt: string;
  }[];
  stats: {
    recipesCreated: number;
    creationsPosted: number;
    cookingHours: number;
    onionsCut: number;
  };
}

interface Creation {
  _id: string;
  title: string;
  description: string;
  image: string;
  likes: string[];
  createdAt: string;
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadProfile();
    loadCreations();
  }, [session, status, router, params.id]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/user/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setIsOwnProfile(data._id === session?.user?.id);
        setIsFollowing(data.followers.some((follower: any) => follower._id === session?.user?.id));
      } else if (response.status === 404) {
        router.push('/search');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCreations = async () => {
    try {
      const response = await fetch(`/api/user/${params.id}/creations`);
      if (response.ok) {
        const data = await response.json();
        setCreations(data);
      }
    } catch (error) {
      console.error('Error loading creations:', error);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;

    setFollowLoading(true);
    try {
      const response = await fetch(`/api/user/${params.id}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        // Update follower count
        if (isFollowing) {
          setProfile({
            ...profile,
            followers: profile.followers.filter(f => f._id !== session?.user?.id)
          });
        } else {
          setProfile({
            ...profile,
            followers: [...profile.followers, { _id: session?.user?.id || '', name: session?.user?.name || '' }]
          });
        }
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  if (status === 'loading') {
    return <PageLoadingSkeleton />;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
          </div>
        ) : profile ? (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <IoArrowBack size={20} />
              </button>
            </div>

            {/* Profile Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {profile.image ? (
                    <img 
                      src={profile.image} 
                      alt={profile.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <IoPersonCircle size={60} className="text-gray-400" />
                  )}
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                      {profile.name}
                    </h1>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      {profile.hasBasilioPlus && (
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          Plus
                        </span>
                      )}
                      {profile.isPrivate && (
                        <IoLockClosed size={16} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                  
                  {profile.bio && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">
                      {profile.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 text-sm text-gray-600 dark:text-gray-300">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {profile.stats.creationsPosted}
                      </div>
                      <div className="text-xs">Creations</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {profile.followers.length}
                      </div>
                      <div className="text-xs">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {profile.following.length}
                      </div>
                      <div className="text-xs">Following</div>
                    </div>
                  </div>
                </div>
                
                {!isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto ${
                      isFollowing
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        : 'text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={!isFollowing ? { backgroundColor: 'var(--color-primary-600)' } : {}}
                    onMouseEnter={(e) => {
                      if (!isFollowing) {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-700)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isFollowing) {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-600)';
                      }
                    }}
                  >
                    {followLoading ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : isFollowing ? (
                      <>
                        <IoCheckmark size={18} />
                        <span className="text-sm">Following</span>
                      </>
                    ) : (
                      <>
                        <IoPersonAdd size={18} />
                        <span className="text-sm">Follow</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: 'var(--color-primary-600)' }}>
                  {profile.stats.recipesCreated}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Recipes Created
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {profile.stats.cookingHours}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Hours Cooking
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {profile.stats.onionsCut}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Onions Cut
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {profile.trophies.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Trophies
                </div>
              </div>
            </div>

            {/* Creations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <IoBook style={{ color: 'var(--color-primary-500)' }} />
                Recent Creations
              </h2>
              
              {creations.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {profile.isPrivate && !isFollowing && !isOwnProfile 
                    ? 'This profile is private. Follow to see their creations.'
                    : 'No creations yet'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {creations.slice(0, 6).map((creation) => (
                    <div key={creation._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img 
                        src={creation.image} 
                        alt={creation.title}
                        className="w-full h-32 object-cover"
                      />
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {creation.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <IoHeart />
                            {creation.likes.length}
                          </span>
                          <span>
                            {new Date(creation.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Profile not found
            </p>
          </div>
        )}
      </main>
    </div>
  );
}