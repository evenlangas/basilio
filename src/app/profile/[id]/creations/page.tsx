'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { 
  IoArrowBack,
  IoHeart, 
  IoTime,
  IoPersonCircle
} from 'react-icons/io5';

interface Creation {
  _id: string;
  title: string;
  description: string;
  image: string;
  likes: string[];
  createdBy: { _id: string; name: string };
  createdAt: string;
}

interface UserProfile {
  _id: string;
  name: string;
  isPrivate: boolean;
}

export default function UserCreationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creations, setCreations] = useState<Creation[]>([]);
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
      const response = await fetch(`/api/user/${userId}/creations`);
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
              {user.name}'s Creations
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
              <IoHeart className="text-4xl text-red-400" size={48} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {searchTerm ? 'No creations found' : user.isPrivate ? 'Private Profile' : 'No creations yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : user.isPrivate
                ? 'This user\'s creations are private'
                : `${user.name} hasn't shared any creations yet`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {filteredCreations.map((creation) => (
              <div key={creation._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {creation.image && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={creation.image}
                      alt={creation.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {creation.title}
                  </h3>
                  
                  {creation.description && (
                    <p className="text-gray-600 dark:text-gray-300 mb-3 text-sm">
                      {creation.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <IoHeart className="text-red-500" />
                        {creation.likes.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <IoTime />
                        {new Date(creation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <IoPersonCircle />
                      {creation.createdBy.name}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}