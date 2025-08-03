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
  const remainingCount = Math.max(0, entries.length - maxDisplay);

  // Simple approach: build the text with proper grammar
  const renderEntries = () => {
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < displayEntries.length; i++) {
      const entry = displayEntries[i];
      const isLast = i === displayEntries.length - 1;
      const isSecondToLast = i === displayEntries.length - 2;
      
      // Render the entry (user or custom)
      if (entry.type === 'user' && entry.user) {
        elements.push(
          <Link
            key={entry.id}
            href={`/profile/${entry.user._id}`}
            className="font-semibold hover:underline text-gray-900 dark:text-white break-words"
          >
            {entry.name}
          </Link>
        );
      } else {
        elements.push(
          <span key={entry.id} className="text-gray-900 dark:text-white break-words">
            {entry.name}
          </span>
        );
      }
      
      // Add separator
      if (!isLast) {
        if (displayEntries.length === 2 && remainingCount === 0) {
          // For exactly 2 items with no overflow: "A and B"
          elements.push(' and ');
        } else if (isSecondToLast && remainingCount === 0) {
          // For 3+ items with no overflow, second to last: "A, B, and C"
          elements.push(', and ');
        } else {
          // For other non-last items or when there's overflow: "A, B, C"
          elements.push(', ');
        }
      }
    }
    
    // Add overflow text if there are more entries
    if (remainingCount > 0) {
      elements.push(', and ');
      elements.push(
        <span key="overflow" className="text-sm text-gray-500 dark:text-gray-400">
          {remainingCount} other{remainingCount === 1 ? '' : 's'}
        </span>
      );
    }
    
    return elements;
  };

  return (
    <span className={`inline ${className}`}>
      {renderEntries()}
    </span>
  );
}