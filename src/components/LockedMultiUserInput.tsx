'use client';

import { useState, useEffect, useRef } from 'react';
import { IoPersonCircle, IoClose, IoAdd } from 'react-icons/io5';

interface User {
  _id: string;
  name: string;
  image?: string;
}

interface LockedMultiUserInputProps {
  selectedUsers: User[];
  onUsersChange: (users: User[]) => void;
  placeholder?: string;
  label?: string;
  maxUsers?: number;
}

export default function LockedMultiUserInput({ 
  selectedUsers,
  onUsersChange,
  placeholder = "Search users to add...", 
  label,
  maxUsers = 10
}: LockedMultiUserInputProps) {
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
            !selectedUsers.some(selected => selected._id === user._id)
          );
          setAvailableUsers(filteredUsers);
          setShowDropdown(filteredUsers.length > 0);
        }
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUserAdd = (user: User) => {
    if (selectedUsers.length < maxUsers) {
      onUsersChange([...selectedUsers, user]);
      setSearchQuery('');
      setShowDropdown(false);
      inputRef.current?.focus();
    }
  };

  const handleUserRemove = (userId: string) => {
    onUsersChange(selectedUsers.filter(user => user._id !== userId));
  };

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      {/* Selected Users - Locked Chips */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user._id}
              className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg border border-blue-200 dark:border-blue-800"
            >
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                {user.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <IoPersonCircle size={12} className="text-gray-400" />
                )}
              </div>
              <span className="font-medium">{user.name}</span>
              <button
                type="button"
                onClick={() => handleUserRemove(user._id)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
              >
                <IoClose size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      {selectedUsers.length < maxUsers && (
        <div className="relative" ref={dropdownRef}>
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
              ) : availableUsers.length > 0 ? (
                availableUsers.map((user) => (
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
                ))
              ) : searchQuery.length >= 2 ? (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  No users found
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {selectedUsers.length >= maxUsers && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Maximum of {maxUsers} users can be selected
        </p>
      )}
    </div>
  );
}