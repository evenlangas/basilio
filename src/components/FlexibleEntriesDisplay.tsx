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
    <div className={`inline-flex items-center flex-wrap gap-1 ${className}`}>
      {displayEntries.map((entry, index) => {
        const needsComma = index < displayEntries.length - 1 || remainingCount > 0;
        
        if (entry.type === 'user' && entry.user) {
          // Display user with bold link (no profile picture)
          return (
            <div key={entry.id} className="inline-flex items-center">
              <Link
                href={`/profile/${entry.user._id}`}
                className="font-semibold hover:underline text-blue-600 dark:text-blue-400"
              >
                {entry.name}
              </Link>
              {needsComma && <span className="text-sm text-gray-500 ml-0.5">,</span>}
            </div>
          );
        } else {
          // Display custom text (no link)
          return (
            <div key={entry.id} className="inline-flex items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {entry.name}
              </span>
              {needsComma && <span className="text-sm text-gray-500 ml-0.5">,</span>}
            </div>
          );
        }
      })}
      
      {remainingCount > 0 && (
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
          and {remainingCount} other{remainingCount === 1 ? '' : 's'}
        </span>
      )}
    </div>
  );
}