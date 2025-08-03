'use client';

import Link from 'next/link';
import { IoPersonCircle } from 'react-icons/io5';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface FlexibleEntry {
  id: string;
  type: 'user' | 'custom';
  name: string;
  user?: User;
}

interface FlexibleEntriesDisplayProps {
  entries: FlexibleEntry[];
  maxDisplay?: number;
  className?: string;
}

export default function FlexibleEntriesDisplay({ 
  entries, 
  maxDisplay = 3, 
  className = "" 
}: FlexibleEntriesDisplayProps) {
  if (!entries || entries.length === 0) {
    return null;
  }

  const displayEntries = entries.slice(0, maxDisplay);
  const remainingCount = entries.length - maxDisplay;

  return (
    <span className={`inline ${className}`}>
      {displayEntries.map((entry, index) => {
        const isLast = index === displayEntries.length - 1;
        const isSecondToLast = index === displayEntries.length - 2;
        
        let separator = '';
        if (!isLast) {
          if (isSecondToLast && remainingCount === 0) {
            // Second to last item with no overflow - add "and"
            separator = displayEntries.length === 2 ? ' and ' : ', and ';
          } else if (isSecondToLast && remainingCount > 0) {
            // Second to last item with overflow - just comma
            separator = ', ';
          } else {
            // Any other non-last item - comma
            separator = ', ';
          }
        }
        
        if (entry.type === 'user' && entry.user) {
          // Display user with bold black link (no profile picture)
          return (
            <span key={entry.id}>
              <Link
                href={`/profile/${entry.user._id}`}
                className="font-semibold hover:underline text-gray-900 dark:text-white break-words"
              >
                {entry.name}
              </Link>
              {separator}
            </span>
          );
        } else {
          // Display custom text (no link, not bold)
          return (
            <span key={entry.id}>
              <span className="text-gray-900 dark:text-white break-words">
                {entry.name}
              </span>
              {separator}
            </span>
          );
        }
      })}
      
      {remainingCount > 0 && (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {displayEntries.length > 0 ? ', and ' : ''}{remainingCount} other{remainingCount === 1 ? '' : 's'}
        </span>
      )}
    </span>
  );
}