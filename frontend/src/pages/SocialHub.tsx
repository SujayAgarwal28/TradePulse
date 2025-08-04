import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Trophy, Plus, UserPlus } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UserSearch {
  id: number;
  username: string;
  full_name?: string;
  rank_points: number;
  competition_wins: number;
  is_friend: boolean;
}

interface Competition {
  id: number;
  name: string;
  creator: {
    username: string;
  };
  start_date: string;
  end_date: string;
  current_participants: number;
  max_participants: number;
  starting_balance: number;
  status: string;
}

const SocialHub: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearch[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const searchUsers = async () => {
    if (searchQuery.length < 2) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/social/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompetitions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/social/competitions`);
      if (response.ok) {
        const data = await response.json();
        setCompetitions(data.competitions || []);
      }
    } catch (err) {
      console.error('Failed to fetch competitions:', err);
    }
  };

  const sendFriendRequest = async (username: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/social/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ addressee_username: username }),
      });
      
      if (response.ok) {
        alert('Friend request sent!');
        searchUsers(); // Refresh search results
      }
    } catch (err) {
      console.error('Failed to send friend request:', err);
    }
  };

  const joinCompetition = async (competitionId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/social/competitions/${competitionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        alert('Successfully joined competition!');
        fetchCompetitions(); // Refresh competitions
      }
    } catch (err) {
      console.error('Failed to join competition:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Social Trading Hub</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Search */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Find Traders</span>
            </h2>

            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                placeholder="Search by username or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
              />
              <button
                onClick={searchUsers}
                disabled={loading || searchQuery.length < 2}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded-lg"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((user) => (
                <div key={user.id} className="bg-gray-700 rounded-lg p-4 flex items-center justify-between">
                  <Link to={`/profile/${user.id}`} className="flex-1">
                    <div>
                      <h3 className="font-semibold">{user.full_name || user.username}</h3>
                      <p className="text-sm text-gray-400">@{user.username}</p>
                      <p className="text-xs text-gray-500">
                        {user.rank_points} points • {user.competition_wins} wins
                      </p>
                    </div>
                  </Link>
                  {!user.is_friend && (
                    <button
                      onClick={() => sendFriendRequest(user.username)}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm flex items-center space-x-1"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Active Competitions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center space-x-2">
                <Trophy className="w-5 h-5" />
                <span>Active Competitions</span>
              </h2>
              <Link
                to="/competitions/create"
                className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-sm flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </Link>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {competitions.map((comp) => (
                <div key={comp.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold">{comp.name}</h3>
                      <p className="text-sm text-gray-400">by @{comp.creator.username}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      comp.status === 'active' ? 'bg-green-600' : 'bg-blue-600'
                    }`}>
                      {comp.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-300 mb-3">
                    <p>₹{comp.starting_balance.toLocaleString()} starting balance</p>
                    <p>{comp.current_participants}/{comp.max_participants} participants</p>
                    <p>Ends: {formatDate(comp.end_date)}</p>
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      to={`/competitions/${comp.id}`}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-center text-sm"
                    >
                      View Details
                    </Link>
                    {comp.current_participants < comp.max_participants && comp.status !== 'completed' && (
                      <button
                        onClick={() => joinCompetition(comp.id)}
                        className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialHub;
