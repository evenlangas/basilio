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
  IoCheckmark,
  IoRestaurant
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

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [cookbooks, setCookbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setUserId(id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (status === 'loading' || !userId) return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadProfile();
    loadCreations();
    loadRecipes();
    loadCookbooks();
  }, [session, status, router, userId]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`/api/user/${userId}`);
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
      const response = await fetch(`/api/user/${userId}/creations`);
      if (response.ok) {
        const data = await response.json();
        setCreations(data);
      }
    } catch (error) {
      console.error('Error loading creations:', error);
    }
  };

  const loadRecipes = async () => {
    try {
      const response = await fetch(`/api/user/${userId}/recipes`);
      if (response.ok) {
        const data = await response.json();
        setRecipes(data);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const loadCookbooks = async () => {
    try {
      const response = await fetch(`/api/user/${userId}/cookbooks`);
      if (response.ok) {
        const data = await response.json();
        setCookbooks(data);
      }
    } catch (error) {
      console.error('Error loading cookbooks:', error);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;

    setFollowLoading(true);
    try {
      const response = await fetch(`/api/user/${userId}/follow`, {
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

            

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Recipes */}
              <Link
                href={`/profile/${userId}/recipes`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-100)' }}>
                    <IoRestaurant size={24} style={{ color: 'var(--color-primary-600)' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recipes</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profile.isPrivate && !isFollowing && !isOwnProfile ? '?' : recipes.length} recipes
                    </p>
                  </div>
                </div>
              </Link>

              {/* Creations */}
              <Link
                href={`/profile/${userId}/creations`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                    <IoHeart size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Creations</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profile.isPrivate && !isFollowing && !isOwnProfile ? '?' : creations.length} creations
                    </p>
                  </div>
                </div>
              </Link>

              {/* Cookbooks */}
              <Link
                href={`/profile/${userId}/cookbooks`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-100)' }}>
                    <IoBook size={24} style={{ color: 'var(--color-primary-600)' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cookbooks</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {profile.isPrivate && !isFollowing && !isOwnProfile ? '?' : cookbooks.length} cookbooks
                    </p>
                  </div>
                </div>
              </Link>
            </div>

{/* Trophies */}
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <IoTrophy className="text-yellow-500" />
                Trophies
              </h2>
              
              {profile.trophies.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No trophies yet. Keep cooking to unlock achievements!
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {profile.trophies.map((trophy, index) => (
                    <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="text-2xl mb-2">
                        <IoTrophy className="text-yellow-500 mx-auto" />
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {trophy.type}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(trophy.unlockedAt).toLocaleDateString()}
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