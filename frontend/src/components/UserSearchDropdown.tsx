import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, Users, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UserSearchResult {
  id: number;
  username: string;
  full_name?: string;
  email: string;
  competition_wins: number;
  rank_points: number;
  is_friend: boolean;
}

interface UserSearchDropdownProps {
  onUserSelect?: (user: UserSearchResult) => void;
  placeholder?: string;
  showAddFriend?: boolean;
}

const UserSearchDropdown: React.FC<UserSearchDropdownProps> = ({
  onUserSelect,
  placeholder = "Search users by username or email...",
  showAddFriend = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchUsers();
      } else {
        setSearchResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const searchUsers = async () => {
    if (searchQuery.length < 2) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/social/search?q=${encodeURIComponent(searchQuery)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data || []);
        setIsOpen(true);
      } else {
        setError('Failed to search users');
      }
    } catch (err) {
      console.error('Failed to search users:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/social/friend-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        // Update the user in search results to show they're now a friend
        setSearchResults(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, is_friend: true }
              : user
          )
        );
      }
    } catch (err) {
      console.error('Failed to send friend request:', err);
    }
  };

  const handleUserClick = (user: UserSearchResult) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsOpen(false);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.length >= 2 && searchResults.length > 0 && setIsOpen(true)}
          className="w-full pl-10 pr-10 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        />
        
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          </div>
        )}
        
        {/* Clear Button */}
        {searchQuery && !loading && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Dropdown Results */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {searchResults.map((user, index) => (
            <div
              key={user.id}
              className={`p-4 hover:bg-gray-700 cursor-pointer transition-colors ${
                index !== searchResults.length - 1 ? 'border-b border-gray-700' : ''
              }`}
              onClick={() => handleUserClick(user)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">
                        {user.full_name || user.username}
                      </h4>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                      <div className="flex items-center mt-1 text-xs text-gray-500">
                        <span className="mr-3 flex items-center">
                          🏆 {user.competition_wins} wins
                        </span>
                        <span className="flex items-center">
                          ⭐ {user.rank_points} points
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 ml-4">
                  <Link
                    to={`/profile/${user.id}`}
                    className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-sm transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </Link>
                  {showAddFriend && !user.is_friend && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sendFriendRequest(user.id);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors flex items-center"
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  )}
                  {user.is_friend && (
                    <span className="bg-green-600 px-3 py-1 rounded text-xs">
                      Friend
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* No Results Message */}
          {searchQuery.length >= 2 && searchResults.length === 0 && !loading && (
            <div className="p-4 text-center text-gray-400">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No users found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}

      {/* Search Instructions */}
      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-4">
          <div className="text-center text-gray-400 text-sm">
            <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p>Type at least 2 characters to search</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSearchDropdown;
