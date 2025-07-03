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
    const mentionRegex = /@(\w+)/g;
    const extractedMentions: MentionData[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1];
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      // Find if this username matches any of our known users (current suggestions or confirmed users)
      const allUsers = [...suggestions, ...confirmedUsers];
      const user = allUsers.find(u => u.name.toLowerCase() === username.toLowerCase());
      if (user) {
        extractedMentions.push({
          user,
          username,
          startIndex,
          endIndex
        });
      }
    }

    return extractedMentions;
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Check for @ mentions
    const beforeCursor = newValue.slice(0, cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);
    
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
    const newValue = beforeMention + `@${user.name} ` + afterMention;
    
    setShowSuggestions(false);
    setMentionStart(null);
    
    // Add user to confirmed users if not already there
    const updatedConfirmedUsers = confirmedUsers.find(u => u._id === user._id) 
      ? confirmedUsers 
      : [...confirmedUsers, user];
    setConfirmedUsers(updatedConfirmedUsers);
    
    // Extract all mentions from the new text using updated confirmed users
    const allUsers = [...suggestions, ...updatedConfirmedUsers];
    const mentionRegex = /@(\w+)/g;
    const extractedMentions: MentionData[] = [];
    let match;

    while ((match = mentionRegex.exec(newValue)) !== null) {
      const username = match[1];
      const startIndex = match.index;
      const endIndex = match.index + match[0].length;
      
      const foundUser = allUsers.find(u => u.name.toLowerCase() === username.toLowerCase());
      if (foundUser) {
        extractedMentions.push({
          user: foundUser,
          username,
          startIndex,
          endIndex
        });
      }
    }
    
    setMentions(extractedMentions);
    onChange(newValue, extractedMentions);

    // Focus back on input
    setTimeout(() => {
      if (inputRef.current) {
        const cursorPos = beforeMention.length + user.name.length + 2;
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
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };


  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none ${className}`}
        rows={3}
        disabled={disabled}
      />
      
      {/* Show count of confirmed mentions */}
      {mentions.length > 0 && (
        <div className="absolute bottom-1 right-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
          {mentions.length} mention{mentions.length === 1 ? '' : 's'}
        </div>
      )}
      
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