'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoPersonCircle } from 'react-icons/io5';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface ChefDisplayProps {
  chefName: string;
  className?: string;
  showProfilePicture?: boolean;
}

export default function ChefDisplay({ chefName, className = "", showProfilePicture = true }: ChefDisplayProps) {
  const [chefUser, setChefUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chefName.trim()) return;

    const searchChef = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(chefName.trim())}`);
        if (response.ok) {
          const searchResults = await response.json();
          // Find exact match first, then close match
          const exactMatch = searchResults.find((user: User) => 
            user.name.toLowerCase() === chefName.trim().toLowerCase()
          );
          const closeMatch = searchResults.find((user: User) => 
            user.name.toLowerCase().includes(chefName.trim().toLowerCase()) ||
            chefName.trim().toLowerCase().includes(user.name.toLowerCase())
          );
          
          setChefUser(exactMatch || closeMatch || null);
        }
      } catch (error) {
        console.error('Error searching for chef:', error);
      } finally {
        setLoading(false);
      }
    };

    searchChef();
  }, [chefName]);

  if (!chefName.trim()) return null;

  if (chefUser) {
    return (
      <Link
        href={`/profile/${chefUser._id}`}
        className={`inline-flex items-center gap-1 transition-colors font-medium ${className}`}
        style={{ color: 'var(--color-primary-600)' }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-700)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary-600)'}
      >
        {showProfilePicture && (
          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            {chefUser.image ? (
              <img 
                src={chefUser.image} 
                alt={chefUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <IoPersonCircle size={12} className="text-gray-400" />
            )}
          </div>
        )}
        {chefUser.name}
      </Link>
    );
  }

  // If no user found, display as plain text
  return (
    <span className={className}>
      {loading && (
        <span className="inline-block w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin mr-1"></span>
      )}
      {chefName}
    </span>
  );
}