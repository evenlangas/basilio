'use client';

import { useState, useEffect, useRef } from 'react';
import { IoPersonCircle, IoClose, IoAdd } from 'react-icons/io5';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface FlexibleEntry {
  id: string;
  type: 'user' | 'custom';
  name: string;
  user?: User; // Only present if type is 'user'
}

interface FlexibleMultiInputProps {
  selectedEntries: FlexibleEntry[];
  onEntriesChange: (entries: FlexibleEntry[]) => void;
  placeholder?: string;
  label?: string;
  maxEntries?: number;
  allowCustomText?: boolean;
}

export default function FlexibleMultiInput({ 
  selectedEntries,
  onEntriesChange,
  placeholder = "Search users or add custom names...", 
  label,
  maxEntries = 10,
  allowCustomText = true
}: FlexibleMultiInputProps) {
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
          // Filter out already selected users
          const filteredUsers = data.filter((user: User) => 
            !selectedEntries.some(entry => entry.type === 'user' && entry.user?._id === user._id)
          );
          setAvailableUsers(filteredUsers);
          setShowDropdown(filteredUsers.length > 0 || allowCustomText);
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedEntries, allowCustomText]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Show dropdown if there's text and we allow custom text
    if (value.length >= 1 && allowCustomText && availableUsers.length === 0) {
      setShowDropdown(true);
    }
  };

  const handleUserAdd = (user: User) => {
    if (selectedEntries.length < maxEntries) {
      const newEntry: FlexibleEntry = {
        id: `user_${user._id}`,
        type: 'user',
        name: user.name,
        user: user
      };
      onEntriesChange([...selectedEntries, newEntry]);
      setSearchQuery('');
      setShowDropdown(false);
      inputRef.current?.focus();
    }
  };

  const handleCustomAdd = () => {
    if (searchQuery.trim() && selectedEntries.length < maxEntries && allowCustomText) {
      // Check if this custom text already exists
      const exists = selectedEntries.some(entry => 
        entry.type === 'custom' && entry.name.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      
      if (!exists) {
        const newEntry: FlexibleEntry = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'custom',
          name: searchQuery.trim()
        };
        onEntriesChange([...selectedEntries, newEntry]);
      }
      
      setSearchQuery('');
      setShowDropdown(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim() && allowCustomText) {
      e.preventDefault();
      handleCustomAdd();
    }
  };

  const handleEntryRemove = (entryId: string) => {
    onEntriesChange(selectedEntries.filter(entry => entry.id !== entryId));
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Selected Entries - Locked Chips */}
      {selectedEntries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedEntries.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                entry.type === 'user' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
              }`}
            >
              {entry.type === 'user' && entry.user && (
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {entry.user.image ? (
                    <img 
                      src={entry.user.image} 
                      alt={entry.user.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <IoPersonCircle size={12} className="text-gray-400" />
                  )}
                </div>
              )}
              <span className="font-medium">{entry.name}</span>
              <button
                type="button"
                onClick={() => handleEntryRemove(entry.id)}
                className={`${
                  entry.type === 'user'
                    ? 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'
                    : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <IoClose size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      {selectedEntries.length < maxEntries && (
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (availableUsers.length > 0 || (allowCustomText && searchQuery.length >= 1)) {
                  setShowDropdown(true);
                }
              }}
              placeholder={placeholder}
              className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            
            <IoAdd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  <div className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span className="ml-2">Searching...</span>
                </div>
              ) : (
                <>
                  {/* User Results */}
                  {availableUsers.length > 0 && (
                    <>
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                        Users
                      </div>
                      {availableUsers.map((user) => (
                        <button
                          key={user._id}
                          type="button"
                          onClick={() => handleUserAdd(user)}
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
                      ))}
                    </>
                  )}
                  
                  {/* Custom Text Option */}
                  {allowCustomText && searchQuery.trim().length >= 1 && (
                    <>
                      {availableUsers.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-600"></div>
                      )}
                      <button
                        type="button"
                        onClick={handleCustomAdd}
                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <IoAdd size={16} className="text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                          <div className="text-gray-900 dark:text-white">Add "{searchQuery.trim()}"</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Custom name</div>
                        </div>
                      </button>
                    </>
                  )}
                  
                  {/* No Results */}
                  {!isSearching && availableUsers.length === 0 && searchQuery.length >= 2 && !allowCustomText && (
                    <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                      No users found
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {selectedEntries.length >= maxEntries && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Maximum of {maxEntries} entries can be selected
        </p>
      )}
    </div>
  );
}