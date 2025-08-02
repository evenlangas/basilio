'use client';

import Link from 'next/link';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface Mention {
  user: User;
  username: string;
  startIndex: number;
  endIndex: number;
}

interface CommentTextProps {
  text: string;
  mentions?: Mention[];
  className?: string;
}

export default function CommentText({ text, mentions = [], className = "" }: CommentTextProps) {
  const renderTextWithLinks = () => {
    if (!mentions.length) {
      return text;
    }

    const parts = [];
    let lastIndex = 0;

    // Sort mentions by start index to process them in order
    const sortedMentions = [...mentions].sort((a, b) => a.startIndex - b.startIndex);

    sortedMentions.forEach((mention, index) => {
      // Add text before mention
      if (mention.startIndex > lastIndex) {
        parts.push(text.slice(lastIndex, mention.startIndex));
      }
      
      // Add linked mention
      parts.push(
        <Link
          key={`mention-${mention.startIndex}-${index}`}
          href={`/profile/${mention.user._id}`}
          className="font-bold hover:underline"
        >
          {mention.username}
        </Link>
      );
      
      lastIndex = mention.endIndex;
    });

    // Add remaining text after last mention
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <span className={className}>
      {renderTextWithLinks()}
    </span>
  );
}