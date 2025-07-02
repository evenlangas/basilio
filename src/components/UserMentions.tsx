'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IoPersonCircle } from 'react-icons/io5';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface UserMentionsProps {
  text: string;
  className?: string;
}

export default function UserMentions({ text, className = "" }: UserMentionsProps) {
  const [foundUsers, setFoundUsers] = useState<{ user: User; startIndex: number; endIndex: number }[]>([]);
  const [loading, setLoading] = useState(false);

  // Extract potential user names from text (names that might be users)
  const extractPotentialUserNames = (text: string): string[] => {
    // Split by common separators and clean up
    const names = text
      .split(/[,&+\n]/)
      .map(name => name.replace(/\band\b/gi, '').trim())
      .filter(name => name.length > 1)
      .filter(name => !['with', 'the', 'my', 'a', 'an', 'me', 'myself'].includes(name.toLowerCase()));
    
    return names;
  };

  useEffect(() => {
    const potentialNames = extractPotentialUserNames(text);
    if (potentialNames.length === 0) return;

    const searchUsers = async () => {
      setLoading(true);
      try {
        const allFoundUsers: { user: User; startIndex: number; endIndex: number }[] = [];

        for (const name of potentialNames) {
          const response = await fetch(`/api/users/search?q=${encodeURIComponent(name)}`);
          if (response.ok) {
            const searchResults = await response.json();
            // Find exact match first, then close match
            const exactMatch = searchResults.find((user: User) => 
              user.name.toLowerCase() === name.toLowerCase()
            );
            const closeMatch = searchResults.find((user: User) => 
              user.name.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(user.name.toLowerCase())
            );
            
            const matchedUser = exactMatch || closeMatch;
            if (matchedUser) {
              // Find the position of this name in the original text
              const regex = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
              const match = text.match(regex);
              if (match && match.index !== undefined) {
                allFoundUsers.push({
                  user: matchedUser,
                  startIndex: match.index,
                  endIndex: match.index + match[0].length
                });
              }
            }
          }
        }

        // Sort by position in text
        allFoundUsers.sort((a, b) => a.startIndex - b.startIndex);
        setFoundUsers(allFoundUsers);
      } catch (error) {
        console.error('Error searching for users:', error);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [text]);

  const renderTextWithUserLinks = () => {
    if (foundUsers.length === 0) {
      return text;
    }

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    foundUsers.forEach((foundUser, index) => {
      // Add text before this user mention
      if (foundUser.startIndex > lastIndex) {
        elements.push(text.slice(lastIndex, foundUser.startIndex));
      }

      // Add the user link
      elements.push(
        <Link
          key={`${foundUser.user._id}-${index}`}
          href={`/profile/${foundUser.user._id}`}
          className="inline-flex items-center gap-1 transition-colors font-medium"
          style={{ color: 'var(--color-primary-600)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-700)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary-600)'}
        >
          <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            {foundUser.user.image ? (
              <img 
                src={foundUser.user.image} 
                alt={foundUser.user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <IoPersonCircle size={12} className="text-gray-400" />
            )}
          </div>
          {foundUser.user.name}
        </Link>
      );

      lastIndex = foundUser.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }

    return elements;
  };

  if (loading) {
    return (
      <span className={className}>
        {text}
        <span className="ml-1 inline-block w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
      </span>
    );
  }

  return <span className={className}>{renderTextWithUserLinks()}</span>;
}