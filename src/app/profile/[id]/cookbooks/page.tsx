'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { 
  IoArrowBack,
  IoBook, 
  IoLockClosed, 
  IoGlobe,
  IoPeople
} from 'react-icons/io5';

interface Cookbook {
  _id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  recipes: string[];
  createdBy: {
    _id: string;
    name: string;
  };
  invitedUsers: string[];
  createdAt: string;
}

interface UserProfile {
  _id: string;
  name: string;
  isPrivate: boolean;
}

export default function UserCookbooksPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    
    fetchUser();
    fetchCookbooks();
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

  const fetchCookbooks = async () => {
    try {
      const response = await fetch(`/api/user/${userId}/cookbooks`);
      if (response.ok) {
        const data = await response.json();
        setCookbooks(data);
      }
    } catch (error) {
      console.error('Error fetching cookbooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCookbooks = cookbooks.filter(cookbook =>
    cookbook.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cookbook.description.toLowerCase().includes(searchTerm.toLowerCase())
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
              <div key={i} className="skeleton h-40 rounded-lg" />
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
              {user.name}'s Cookbooks
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {cookbooks.length} cookbook{cookbooks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search cookbooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {filteredCookbooks.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 flex justify-center">
              <IoBook className="text-4xl text-gray-400" size={48} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm ? 'No cookbooks found' : user.isPrivate ? 'Private Profile' : 'No cookbooks yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : user.isPrivate
                ? 'This user\'s cookbooks are private'
                : `${user.name} hasn't created any cookbooks yet`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {filteredCookbooks.map((cookbook) => (
              <Link
                key={cookbook._id}
                href={`/cookbooks/${cookbook._id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {cookbook.name}
                    </h3>
                    <div className="flex items-center gap-1 ml-2">
                      {cookbook.isPrivate ? (
                        <IoLockClosed size={16} className="text-gray-500" />
                      ) : (
                        <IoGlobe size={16} className="text-green-500" />
                      )}
                    </div>
                  </div>
                  
                  {cookbook.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                      {cookbook.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{cookbook.recipes.length} recipes</span>
                    <div className="flex items-center gap-3">
                      {cookbook.invitedUsers.length > 0 && (
                        <div className="flex items-center gap-1">
                          <IoPeople size={14} />
                          <span>{cookbook.invitedUsers.length}</span>
                        </div>
                      )}
                      <span>{new Date(cookbook.createdAt).toLocaleDateString()}</span>
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