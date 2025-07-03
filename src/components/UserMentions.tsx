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
  const [foundUsers, setFoundUsers] = useState<{ user: User; startIndex: number; endIndex: number; mention: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Extract @mentions from text (including names with spaces)
  const extractMentions = (text: string): { mention: string; startIndex: number; endIndex: number }[] => {
    // Simple approach: match @ followed by letters/spaces until space/punctuation/end
    const mentionRegex = /@([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({
        mention: match[1].trim(), // Username without @ symbol, trimmed
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
    
    console.log('Extracted mentions from text:', text, '→', mentions);
    return mentions;
  };

  // Also extract potential user names from text (names that might be users) for backward compatibility
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
    const mentions = extractMentions(text);
    const potentialNames = extractPotentialUserNames(text);
    
    if (mentions.length === 0 && potentialNames.length === 0) return;

    const searchUsers = async () => {
      setLoading(true);
      try {
        const allFoundUsers: { user: User; startIndex: number; endIndex: number; mention: string }[] = [];

        // Handle @mentions first (higher priority)
        for (const mention of mentions) {
          console.log('Searching for mention:', mention.mention);
          const response = await fetch(`/api/users/search?q=${encodeURIComponent(mention.mention)}`);
          if (response.ok) {
            const searchResults = await response.json();
            console.log('Search results for', mention.mention, ':', searchResults);
            console.log('Looking for exact match. Mention name:', `"${mention.mention.toLowerCase()}"`, 'User names:', searchResults.map((u: User) => `"${u.name.toLowerCase()}"`));
            
            // Find exact match for @mentions (case insensitive)
            const exactMatch = searchResults.find((user: User) => 
              user.name.toLowerCase() === mention.mention.toLowerCase()
            );
            
            // If no exact match, try a close match
            const closeMatch = !exactMatch ? searchResults.find((user: User) => 
              user.name.toLowerCase().includes(mention.mention.toLowerCase()) ||
              mention.mention.toLowerCase().includes(user.name.toLowerCase())
            ) : null;
            
            const foundUser = exactMatch || closeMatch;
            console.log('Exact match found:', exactMatch, 'Close match found:', closeMatch, 'Using:', foundUser);
            if (foundUser) {
              allFoundUsers.push({
                user: foundUser,
                startIndex: mention.startIndex,
                endIndex: mention.endIndex,
                mention: mention.mention
              });
            }
          }
        }

        // Handle natural language mentions for backward compatibility
        for (const name of potentialNames) {
          // Skip if this area is already covered by @mentions
          const isAlreadyCovered = allFoundUsers.some(found => 
            name.toLowerCase() === found.user.name.toLowerCase()
          );
          
          if (!isAlreadyCovered) {
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
                  // Make sure this doesn't overlap with @mentions
                  const overlaps = allFoundUsers.some(found => 
                    (match.index! >= found.startIndex && match.index! < found.endIndex) ||
                    (match.index! + match[0].length > found.startIndex && match.index! + match[0].length <= found.endIndex)
                  );
                  
                  if (!overlaps) {
                    allFoundUsers.push({
                      user: matchedUser,
                      startIndex: match.index,
                      endIndex: match.index + match[0].length,
                      mention: name
                    });
                  }
                }
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

      // Check if this is a @mention or natural language mention
      const isMention = text.slice(foundUser.startIndex, foundUser.endIndex).startsWith('@');
      
      // Add the user link
      elements.push(
        <Link
          key={`${foundUser.user._id}-${index}`}
          href={`/profile/${foundUser.user._id}`}
          className={`transition-colors font-medium ${isMention ? 'hover:underline' : 'inline-flex items-center gap-1'}`}
          style={{ color: 'var(--color-primary-600)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary-700)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-primary-600)'}
        >
          {isMention ? (
            // For @mentions, show just the username without @ symbol
            foundUser.user.name
          ) : (
            // For natural mentions, show with avatar
            <>
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
            </>
          )}
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