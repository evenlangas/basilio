'use client';

import { useState, useRef, useEffect } from 'react';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface MentionData {
  user: User;
  username: string;
  startIndex: number;
  endIndex: number;
  id: string; // Unique identifier for this mention instance
}

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: MentionData[]) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  reset?: boolean;
}

// Helper function to convert mention tokens to API format
export const convertTokensToApiFormat = (text: string, mentions: MentionData[]) => {
  let convertedText = text;
  const apiMentions: Array<{ user: any; username: string; startIndex: number; endIndex: number }> = [];
  
  // Sort mentions by position (reverse order to maintain indices)
  const sortedMentions = [...mentions].sort((a, b) => b.startIndex - a.startIndex);
  
  sortedMentions.forEach(mention => {
    // Replace token with simple @mention
    const token = `@[${mention.username}](${mention.id})`;
    const simpleMention = `@${mention.username}`;
    convertedText = convertedText.replace(token, simpleMention);
    
    // Calculate new position after replacements
    const newStartIndex = convertedText.indexOf(simpleMention);
    if (newStartIndex !== -1) {
      apiMentions.unshift({
        user: mention.user,
        username: mention.username,
        startIndex: newStartIndex,
        endIndex: newStartIndex + simpleMention.length
      });
    }
  });
  
  return { text: convertedText, mentions: apiMentions };
};

export default function MentionInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Write a comment...",
  className = "",
  disabled = false,
  reset = false
}: MentionInputProps) {
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [mentions, setMentions] = useState<MentionData[]>([]);
  const [confirmedUsers, setConfirmedUsers] = useState<User[]>([]);

  // Debounce search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Reset confirmed users when reset prop changes
  useEffect(() => {
    if (reset) {
      setConfirmedUsers([]);
      setMentions([]);
    }
  }, [reset]);

  const searchUsers = async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const users = await response.json();
        setSuggestions(users.slice(0, 5)); // Limit to 5 suggestions
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const extractMentions = (text: string): MentionData[] => {
    const extractedMentions: MentionData[] = [];
    const allUsers = [...suggestions, ...confirmedUsers];
    
    // Find mention tokens in format @[Name](mentionId)
    const mentionTokenRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    
    while ((match = mentionTokenRegex.exec(text)) !== null) {
      const username = match[1];
      const mentionId = match[2];
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      // Find the user
      const user = allUsers.find(u => u.name === username);
      if (user) {
        extractedMentions.push({
          user,
          username,
          startIndex,
          endIndex,
          id: mentionId
        });
      }
    }
    
    return extractedMentions.sort((a, b) => a.startIndex - b.startIndex);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check for @ mentions
    const beforeCursor = newValue.slice(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@([^@\s]*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionStart(beforeCursor.length - mentionMatch[0].length);
      setShowSuggestions(true);
      setSelectedSuggestion(0);
      
      // Debounce search
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => searchUsers(query), 300);
      setSearchTimeout(timeout);
    } else {
      setShowSuggestions(false);
      setMentionStart(null);
    }

    // Extract mentions from current text
    const currentMentions = extractMentions(newValue);
    setMentions(currentMentions);
    onChange(newValue, currentMentions);
  };

  const selectSuggestion = (user: User) => {
    if (mentionStart === null) return;

    const beforeMention = value.slice(0, mentionStart);
    const afterMention = value.slice(inputRef.current?.selectionStart || mentionStart);
    
    // Create a unique mention token
    const mentionId = `mention_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mentionToken = `@[${user.name}](${mentionId})`;
    const newValue = beforeMention + mentionToken + afterMention;
    
    setShowSuggestions(false);
    setMentionStart(null);
    
    // Add user to confirmed users if not already there
    const updatedConfirmedUsers = confirmedUsers.find(u => u._id === user._id) 
      ? confirmedUsers 
      : [...confirmedUsers, user];
    setConfirmedUsers(updatedConfirmedUsers);
    
    // Create mention data for this new mention
    const newMention: MentionData = {
      user,
      username: user.name,
      startIndex: mentionStart,
      endIndex: mentionStart + mentionToken.length,
      id: mentionId
    };
    
    const updatedMentions = [...mentions, newMention];
    setMentions(updatedMentions);
    onChange(newValue, updatedMentions);

    // Focus back on input at the end of the mention token
    setTimeout(() => {
      if (inputRef.current) {
        const cursorPos = beforeMention.length + mentionToken.length;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (suggestions[selectedSuggestion]) {
          selectSuggestion(suggestions[selectedSuggestion]);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    } else if (e.key === 'Backspace') {
      // Handle mention deletion
      const cursorPosition = inputRef.current?.selectionStart || 0;
      
      // Check if cursor is at the end of a mention token
      const mentionAtCursor = mentions.find(mention => 
        cursorPosition === mention.endIndex
      );
      
      if (mentionAtCursor) {
        e.preventDefault();
        
        // Remove the entire mention token
        const beforeMention = value.slice(0, mentionAtCursor.startIndex);
        const afterMention = value.slice(mentionAtCursor.endIndex);
        const newValue = beforeMention + afterMention;
        
        // Remove mention from array
        const updatedMentions = mentions.filter(m => m.id !== mentionAtCursor.id);
        setMentions(updatedMentions);
        onChange(newValue, updatedMentions);
        
        // Set cursor position
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.setSelectionRange(mentionAtCursor.startIndex, mentionAtCursor.startIndex);
          }
        }, 0);
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };


  const renderStyledText = () => {
    if (!mentions.length) {
      return null;
    }

    const parts = [];
    let lastIndex = 0;

    // Sort mentions by start index
    const sortedMentions = [...mentions].sort((a, b) => a.startIndex - b.startIndex);

    sortedMentions.forEach((mention, index) => {
      // Add text before mention
      if (mention.startIndex > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {value.slice(lastIndex, mention.startIndex)}
          </span>
        );
      }
      
      // Add styled mention (bold, show just the username)
      parts.push(
        <span key={`mention-${mention.id}`} className="font-bold bg-blue-100 dark:bg-blue-900 px-1 rounded">
          {mention.username}
        </span>
      );
      
      lastIndex = mention.endIndex;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {value.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <div className="relative">
      {/* Styled text overlay */}
      {mentions.length > 0 && (
        <div className="absolute inset-0 p-3 pointer-events-none whitespace-pre-wrap break-words overflow-hidden text-transparent">
          <div className="text-gray-900 dark:text-white">
            {renderStyledText()}
          </div>
        </div>
      )}
      
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 ${mentions.length > 0 ? 'text-transparent' : 'text-gray-900 dark:text-white'} placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ${className}`}
        rows={3}
        disabled={disabled}
      />
      
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((user, index) => (
            <button
              key={user._id}
              onClick={() => selectSuggestion(user)}
              className={`w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                index === selectedSuggestion ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 dark:text-gray-300 font-medium text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  @{user.name}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}