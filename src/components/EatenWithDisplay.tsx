'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoPersonCircle, IoPeople } from 'react-icons/io5';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface EatenWithDisplayProps {
  // Legacy mode: accepts text string (for backward compatibility)
  eatenWith?: string;
  // New mode: accepts user objects directly (optimized)
  eatenWithUsers?: User[];
  className?: string;
  showProfilePictures?: boolean;
  asLinks?: boolean;
  maxDisplay?: number; // Maximum number of users to display before showing "and X others"
}

export default function EatenWithDisplay({ 
  eatenWith, 
  eatenWithUsers, 
  className = "", 
  showProfilePictures = true, 
  asLinks = true,
  maxDisplay = 3
}: EatenWithDisplayProps) {
  const [resolvedUsers, setResolvedUsers] = useState<User[]>(eatenWithUsers || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If user objects are provided, use them directly (new optimized mode)
    if (eatenWithUsers && eatenWithUsers.length > 0) {
      setResolvedUsers(eatenWithUsers);
      return;
    }
    
    // Fallback to legacy text parsing mode for backward compatibility
    if (!eatenWith?.trim()) return;

    const resolveUsers = async () => {
      setLoading(true);
      try {
        // Extract mentions and potential user names from text
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;
        while ((match = mentionRegex.exec(eatenWith)) !== null) {
          mentions.push(match[1]);
        }

        // Also try to find names in the text (simple word extraction)
        const words = eatenWith.split(/[,\s]+/).filter(word => 
          word.length > 2 && 
          !['and', 'with', 'the', 'was', 'were', 'ate'].includes(word.toLowerCase())
        );

        const searchTerms = [...mentions, ...words].slice(0, 5); // Limit searches
        const foundUsers: User[] = [];

        for (const term of searchTerms) {
          try {
            const response = await fetch(`/api/users/search?q=${encodeURIComponent(term)}`);
            if (response.ok) {
              const searchResults = await response.json();
              const exactMatch = searchResults.find((user: User) => 
                user.name.toLowerCase() === term.toLowerCase()
              );
              if (exactMatch && !foundUsers.some(u => u._id === exactMatch._id)) {
                foundUsers.push(exactMatch);
              }
            }
          } catch (error) {
            console.error('Error searching for user:', error);
          }
        }

        setResolvedUsers(foundUsers);
      } catch (error) {
        console.error('Error resolving eaten with users:', error);
      } finally {
        setLoading(false);
      }
    };

    resolveUsers();
  }, [eatenWith, eatenWithUsers]);

  if (!eatenWithUsers?.length && !eatenWith?.trim()) return null;

  // If we have resolved users, display them
  if (resolvedUsers.length > 0) {
    const displayUsers = resolvedUsers.slice(0, maxDisplay);
    const remainingCount = resolvedUsers.length - maxDisplay;

    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <IoPeople size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <span className="text-gray-600 dark:text-gray-300">with</span>
        {displayUsers.map((user, index) => {
          const content = (
            <>
              {showProfilePictures && (
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <IoPersonCircle size={12} className="text-gray-400" />
                  )}
                </div>
              )}
              {user.name}
            </>
          );

          const isLast = index === displayUsers.length - 1;
          const needsComma = index < displayUsers.length - 1 && displayUsers.length > 2;
          const needsAnd = isLast && displayUsers.length > 1;

          return (
            <span key={user._id} className="inline-flex items-center gap-1">
              {needsAnd && displayUsers.length === 2 && <span className="text-gray-600 dark:text-gray-300">and</span>}
              {needsAnd && displayUsers.length > 2 && <span className="text-gray-600 dark:text-gray-300">, and</span>}
              {asLinks ? (
                <Link
                  href={`/profile/${user._id}`}
                  className="inline-flex items-center gap-1 transition-colors font-medium"
                  style={{ color: 'var(--color-primary-600)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-700)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary-600)'}
                >
                  {content}
                </Link>
              ) : (
                <span 
                  className="inline-flex items-center gap-1 font-medium"
                  style={{ color: 'var(--color-primary-600)' }}
                >
                  {content}
                </span>
              )}
              {needsComma && <span className="text-gray-600 dark:text-gray-300">,</span>}
            </span>
          );
        })}
        {remainingCount > 0 && (
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            and {remainingCount} other{remainingCount > 1 ? 's' : ''}
          </span>
        )}
      </span>
    );
  }

  // Fallback to displaying raw text if no users were resolved
  if (eatenWith?.trim()) {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <IoPeople size={14} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
        {loading && (
          <span className="inline-block w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
        )}
        <span className="text-gray-600 dark:text-gray-300">{eatenWith}</span>
      </span>
    );
  }

  return null;
}