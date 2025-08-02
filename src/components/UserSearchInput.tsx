'use client';

import { useState, useEffect, useRef } from 'react';
import { IoPersonCircle, IoClose } from 'react-icons/io5';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface UserSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onUserSelect?: (user: User | null) => void; // New callback for user selection
  placeholder?: string;
  label?: string;
  allowFreeText?: boolean; // Allow typing custom text instead of just selecting users
  mode?: 'legacy' | 'userIds'; // Choose between legacy string mode or new user ID mode
}

export default function UserSearchInput({ 
  value, 
  onChange, 
  onUserSelect,
  placeholder = "Search users...", 
  label,
  allowFreeText = true,
  mode = 'legacy'
}: UserSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [users, setUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with existing value
  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for users
  useEffect(() => {
    if (searchQuery.length < 2) {
      setUsers([]);
      setShowDropdown(false);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          setShowDropdown(data.length > 0);
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    setSelectedUser(null);
    
    if (allowFreeText) {
      onChange(newValue);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setSearchQuery(user.name);
    
    if (mode === 'userIds' && onUserSelect) {
      // New mode: pass user object to parent
      onUserSelect(user);
    } else {
      // Legacy mode: pass user name as string
      onChange(user.name);
    }
    
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedUser(null);
    
    if (mode === 'userIds' && onUserSelect) {
      onUserSelect(null);
    } else {
      onChange('');
    }
    
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => {
            if (users.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <IoClose size={16} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
              <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="ml-2">Searching...</span>
            </div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => handleUserSelect(user)}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.image ? (
                    <img 
                      src={user.image} 
                      alt={user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <IoPersonCircle size={20} className="text-gray-400" />
                  )}
                </div>
                <span className="text-gray-900 dark:text-white">{user.name}</span>
              </button>
            ))
          ) : searchQuery.length >= 2 ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
              No users found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}