'use client';

import { useState, useEffect, useRef } from 'react';
import { IoPersonCircle, IoClose } from 'react-icons/io5';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface LockedUserInputProps {
  selectedUser: User | null;
  onUserChange: (user: User | null) => void;
  placeholder?: string;
  label?: string;
}

export default function LockedUserInput({ 
  selectedUser,
  onUserChange,
  placeholder = "Search for a user...", 
  label
}: LockedUserInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setAvailableUsers([]);
      setShowDropdown(false);
      return;
    }

    const searchUsers = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableUsers(data);
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
    setSearchQuery(e.target.value);
  };

  const handleUserSelect = (user: User) => {
    onUserChange(user);
    setSearchQuery('');
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onUserChange(null);
    setSearchQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // If user is selected, show locked chip
  if (selectedUser) {
    return (
      <div>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            {selectedUser.image ? (
              <img 
                src={selectedUser.image} 
                alt={selectedUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <IoPersonCircle size={16} className="text-gray-400" />
            )}
          </div>
          <span className="font-medium flex-1">{selectedUser.name}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
          >
            <IoClose size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Show search input
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
            if (availableUsers.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
              <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              <span className="ml-2">Searching...</span>
            </div>
          ) : availableUsers.length > 0 ? (
            availableUsers.map((user) => (
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