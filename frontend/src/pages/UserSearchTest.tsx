import React, { useState } from 'react';
import UserSearchDropdown from '../components/UserSearchDropdown';
import { Users, Search, TestTube } from 'lucide-react';

interface UserSearchResult {
  id: number;
  username: string;
  full_name?: string;
  email: string;
  competition_wins: number;
  rank_points: number;
  is_friend: boolean;
}

const UserSearchTest: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [searchHistory, setSearchHistory] = useState<UserSearchResult[]>([]);

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUser(user);
    // Add to search history if not already there
    if (!searchHistory.find(u => u.id === user.id)) {
      setSearchHistory(prev => [user, ...prev.slice(0, 4)]); // Keep last 5
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <TestTube className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">User Search Test</h1>
          <p className="text-gray-400">Testing the user search dropdown with spinner functionality</p>
        </div>

        {/* Test Instructions */}
        <div className="bg-blue-900 border border-blue-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-3">🧪 How to Test</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Type at least 2 characters in the search box below</li>
            <li>You should see a loading spinner appear briefly</li>
            <li>Search results will appear in a dropdown below the input</li>
            <li>Click on any user to select them</li>
            <li>You can also add friends or view profiles directly from the dropdown</li>
            <li>Try searching for common usernames like "test", "user", "admin", etc.</li>
          </ol>
        </div>

        {/* Main Search Component */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2" />
            User Search Dropdown
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Search for users (with dropdown and spinner):
            </label>
            <UserSearchDropdown
              onUserSelect={handleUserSelect}
              placeholder="Start typing to search for users..."
              showAddFriend={true}
            />
          </div>

          {/* Selected User Display */}
          {selectedUser && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2">Selected User:</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{selectedUser.full_name || selectedUser.username}</p>
                  <p className="text-sm text-gray-400">@{selectedUser.username}</p>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                  <div className="flex items-center mt-2 text-sm">
                    <span className="mr-4">🏆 {selectedUser.competition_wins} wins</span>
                    <span>⭐ {selectedUser.rank_points} points</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedUser.is_friend ? 'bg-green-600' : 'bg-gray-600'
                  }`}>
                    {selectedUser.is_friend ? 'Friend' : 'Not Friend'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Different Variants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Without Add Friend */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Search Only (No Add Friend)</h3>
            <UserSearchDropdown
              placeholder="Search users (view only)..."
              showAddFriend={false}
            />
          </div>

          {/* Custom Placeholder */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Custom Placeholder</h3>
            <UserSearchDropdown
              placeholder="Find trading competitors..."
              onUserSelect={(user) => console.log('Selected:', user)}
            />
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Recent Searches
            </h3>
            <div className="space-y-2">
              {searchHistory.map((user) => (
                <div key={user.id} className="flex justify-between items-center py-2 px-3 bg-gray-700 rounded">
                  <div>
                    <span className="font-medium">{user.full_name || user.username}</span>
                    <span className="text-gray-400 ml-2">@{user.username}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    🏆 {user.competition_wins} | ⭐ {user.rank_points}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Details */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-bold mb-4">🔧 Technical Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">User Experience:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Debounced search (300ms delay)</li>
                <li>Loading spinner during API calls</li>
                <li>Real-time dropdown results</li>
                <li>Click outside to close</li>
                <li>Clear button for quick reset</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">API Integration:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                <li>Backend: <code>/social/search?q=...</code></li>
                <li>Minimum 2 characters required</li>
                <li>Limit of 10 results per search</li>
                <li>Error handling and retry logic</li>
                <li>JWT authentication</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mt-8 p-4 bg-green-900 border border-green-700 rounded-lg">
          <p className="text-green-200">
            ✅ User search dropdown is ready for testing! Try typing some usernames above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserSearchTest;
