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
  IoPersonAdd,
  IoPersonRemove,
  IoCheckmark
} from 'react-icons/io5';

interface User {
  _id: string;
  name: string;
  image?: string;
  bio?: string;
  followers: string[];
  following: string[];
}

export default function MyFollowingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<{[key: string]: boolean}>({});
  const [followLoading, setFollowLoading] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadFollowing();
  }, [session, status, router]);

  const loadFollowing = async () => {
    try {
      const response = await fetch(`/api/user/${session?.user?.id}/following`);
      if (response.ok) {
        const data = await response.json();
        setFollowing(data);
        
        // Initialize following states (all should be true since these are people we follow)
        const states: {[key: string]: boolean} = {};
        data.forEach((followedUser: User) => {
          states[followedUser._id] = true; // We follow all of these users
        });
        setFollowingStates(states);
      }
    } catch (error) {
      console.error('Error loading following:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (followLoading[targetUserId]) return;

    setFollowLoading(prev => ({ ...prev, [targetUserId]: true }));
    
    try {
      const response = await fetch(`/api/user/${targetUserId}/follow`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove from the following list
        setFollowing(prev => prev.filter(user => user._id !== targetUserId));
        setFollowingStates(prev => ({
          ...prev,
          [targetUserId]: false
        }));
      }
    } catch (error) {
      console.error('Error unfollowing:', error);
    } finally {
      setFollowLoading(prev => ({ ...prev, [targetUserId]: false }));
    }
  };

  if (status === 'loading') {
    return <PageLoadingSkeleton />;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-2xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow flex-shrink-0"
          >
            <IoArrowBack size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
              Following
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 truncate">
              People you follow
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
          </div>
        ) : following.length === 0 ? (
          <div className="text-center py-8 sm:py-12 px-4">
            <IoPersonCircle size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-3 sm:mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Not following anyone yet
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
              Discover amazing chefs and food enthusiasts to follow!
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              Discover People to Follow
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {following.map((followedUser) => (
              <div key={followedUser._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <Link href={`/profile/${followedUser._id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      {followedUser.image ? (
                        <img 
                          src={followedUser.image} 
                          alt={followedUser.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <IoPersonCircle size={30} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate text-sm sm:text-base">
                        {followedUser.name}
                      </h3>
                      {followedUser.bio && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate mt-0.5">
                          {followedUser.bio}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {followedUser.followers.length} followers • {followedUser.following.length} following
                      </p>
                    </div>
                  </Link>
                  
                  <button
                    onClick={() => handleUnfollow(followedUser._id)}
                    disabled={followLoading[followedUser._id]}
                    className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 min-w-[80px] sm:min-w-[90px]"
                  >
                    {followLoading[followedUser._id] ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <IoPersonRemove size={14} />
                        <span className="hidden sm:inline">Unfollow</span>
                        <span className="sm:hidden">Remove</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}