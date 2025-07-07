'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import { 
  IoPersonCircle, 
  IoSettings, 
  IoTrophy, 
  IoBook, 
  IoStar,
  IoFlame,
  IoTime,
  IoRestaurant
} from 'react-icons/io5';
import { FaGrinHearts } from 'react-icons/fa';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image?: string;
  bio: string;
  isPrivate: boolean;
  followers: string[];
  following: string[];
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

const trophyIcons: { [key: string]: JSX.Element } = {
  '100_creations': <FaGrinHearts style={{ color: 'var(--color-primary-600)' }} />,
  '50_onions': <IoFlame className="text-orange-500" />,
  '100_hours': <IoTime style={{ color: 'var(--color-primary-500)' }} />,
  'first_recipe': <IoStar className="text-yellow-500" />,
  'master_chef': <IoTrophy className="text-purple-500" />,
};

const trophyNames: { [key: string]: string } = {
  '100_creations': '100 Creations',
  '50_onions': '50 Onions Cut',
  '100_hours': '100 Hours Cooking',
  'first_recipe': 'First Recipe',
  'master_chef': 'Master Chef',
};

export default function YouPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cookbooks, setCookbooks] = useState<any[]>([]);
  const [creations, setCreations] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    loadProfile();
    loadCookbooks();
    loadCreations();
    loadRecipes();
  }, [session, status, router]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadCookbooks = async () => {
    try {
      const response = await fetch('/api/cookbooks');
      if (response.ok) {
        const data = await response.json();
        setCookbooks(data);
      }
    } catch (error) {
      console.error('Error loading cookbooks:', error);
    }
  };

  const loadCreations = async () => {
    try {
      const response = await fetch('/api/creations');
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
      const response = await fetch('/api/user/recipes');
      if (response.ok) {
        const data = await response.json();
        setRecipes(data);
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
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
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderBottomColor: 'var(--color-primary-600)' }}></div>
          </div>
        ) : profile ? (
          <div className="space-y-8">
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
                    {profile.hasBasilioPlus && (
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                        Plus
                      </span>
                    )}
                  </div>
                  
                  {profile.bio && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm sm:text-base">
                      {profile.bio}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 text-sm text-gray-600 dark:text-gray-300">
                    <span>{profile.stats.creationsPosted} creations</span>
                    <span>{profile.followers.length} followers</span>
                    <span>{profile.following.length} following</span>
                  </div>
                </div>
                
                <Link
                  href="/settings"
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-full sm:w-auto justify-center"
                >
                  <IoSettings size={18} />
                  <span className="text-sm">Settings</span>
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* My Recipes */}
              <Link
                href={`/profile/${session?.user?.id}/recipes`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-100)' }}>
                    <IoRestaurant size={24} style={{ color: 'var(--color-primary-600)' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Recipes</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{recipes.length} recipes</p>
                  </div>
                </div>
              </Link>

              {/* My Creations */}
              <Link
                href={`/profile/${session?.user?.id}/creations`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-100)' }}>
                    <FaGrinHearts size={24} style={{ color: 'var(--color-primary-600)' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Creations</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{creations.length} creations</p>
                  </div>
                </div>
              </Link>

              {/* My Cookbooks */}
              <Link
                href="/cookbooks"
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary-100)' }}>
                    <IoBook size={24} style={{ color: 'var(--color-primary-600)' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Cookbooks</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{cookbooks.length} cookbooks</p>
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
                        {trophyIcons[trophy.type] || <IoTrophy className="text-gray-400" />}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {trophyNames[trophy.type] || trophy.type}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(trophy.unlockedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


            {/* Basilio Plus */}
            {!profile.hasBasilioPlus && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-2">
                      Upgrade to Basilio Plus
                    </h2>
                    <p className="opacity-90">
                      Unlock AI recipe upload, advanced features, and more!
                    </p>
                  </div>
                  <Link
                    href="/you/upgrade"
                    className="bg-white text-orange-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Upgrade
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              Unable to load profile
            </p>
          </div>
        )}
      </main>
    </div>
  );
}