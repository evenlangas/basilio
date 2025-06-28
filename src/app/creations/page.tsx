'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Link from 'next/link';
import { 
  IoHeart, 
  IoTime,
  IoPersonCircle,
  IoAdd
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

export default function CreationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    fetchCreations();
  }, [session, status, router]);

  const fetchCreations = async () => {
    try {
      const response = await fetch('/api/creations');
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
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8">
            <div className="mb-4 sm:mb-0 text-center sm:text-left">
              <div className="skeleton h-10 mb-4 mx-auto sm:mx-0" style={{width: '300px'}} />
              <div className="skeleton h-6 mx-auto sm:mx-0" style={{width: '400px'}} />
            </div>
          </div>

          <div className="mb-6">
            <div className="skeleton h-10" style={{maxWidth: '384px'}} />
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

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-0 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              My Creations
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
              {creations.length} creation{creations.length !== 1 ? 's' : ''} shared by you
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
              {searchTerm ? 'No creations found' : 'No creations yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Share your first cooking creation to get started!'
              }
            </p>
            {!searchTerm && (
              <Link
                href="/create"
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
              >
                <IoAdd size={20} />
                Share Your First Creation
              </Link>
            )}
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