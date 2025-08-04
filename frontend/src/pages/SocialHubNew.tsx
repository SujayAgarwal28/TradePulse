import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, Trophy, Plus, Clock, Star, TrendingUp, DollarSign } from 'lucide-react';
import UserSearchDropdown from '../components/UserSearchDropdown';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Competition {
  id: number;
  name: string;
  description: string;
  creator: {
    id: number;
    username: string;
    full_name?: string;
  };
  start_date: string;
  end_date: string;
  current_participants: number;
  max_participants: number;
  starting_balance: number;
  status: string;
  time_remaining_seconds?: number;
}

const SocialHubNew: React.FC = () => {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [myCompetitions, setMyCompetitions] = useState<Competition[]>([]);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-competitions' | 'search-users'>('discover');
  const { token } = useAuth(); // Get token from auth context

  useEffect(() => {
    fetchCompetitions();
    fetchMyCompetitions();
  }, []);

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

  const fetchMyCompetitions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/social/competitions/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMyCompetitions(data.competitions || []);
      }
    } catch (err) {
      console.error('Failed to fetch my competitions:', err);
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Ended';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'upcoming': return 'bg-yellow-600';
      case 'completed': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const CompetitionCard: React.FC<{ competition: Competition; showJoinButton?: boolean }> = ({ 
    competition, 
    showJoinButton = true 
  }) => (
    <div className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h3 className="text-xl font-bold text-white">{competition.name}</h3>
            <span className={`ml-3 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(competition.status)} text-white`}>
              {competition.status.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-400 mb-3">{competition.description}</p>
          
          {/* Competition Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-green-400 mr-2" />
              <span className="text-sm text-gray-300">
                ${competition.starting_balance.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-blue-400 mr-2" />
              <span className="text-sm text-gray-300">
                {competition.current_participants}/{competition.max_participants}
              </span>
            </div>
          </div>
          
          {/* Creator */}
          <div className="flex items-center mb-3">
            <Star className="h-4 w-4 text-yellow-400 mr-2" />
            <span className="text-sm text-gray-400">
              Created by {competition.creator?.full_name || competition.creator?.username || 'Unknown User'}
            </span>
          </div>
          
          {/* Time Remaining */}
          {competition.time_remaining_seconds && competition.time_remaining_seconds > 0 && (
            <div className="flex items-center mb-4">
              <Clock className="h-4 w-4 text-orange-400 mr-2" />
              <span className="text-sm text-orange-400">
                {formatTimeRemaining(competition.time_remaining_seconds)} remaining
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Link
          to={`/competitions/${competition.id}`}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-center"
        >
          View Details
        </Link>
        {showJoinButton && competition.status === 'active' && (
          <Link
            to={`/competitions/${competition.id}/trade`}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Trade
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Social Hub</h1>
            <p className="text-gray-400">Discover competitions, connect with traders, and compete for glory!</p>
          </div>
          <Link
            to="/competitions/create"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Competition
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-8">
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'discover'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trophy className="h-5 w-5 inline mr-2" />
            Discover Competitions
          </button>
          <button
            onClick={() => setActiveTab('my-competitions')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'my-competitions'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="h-5 w-5 inline mr-2" />
            My Competitions
          </button>
          <button
            onClick={() => setActiveTab('search-users')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'search-users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search className="h-5 w-5 inline mr-2" />
            Find Traders
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'discover' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Active Competitions</h2>
            {competitions.length === 0 ? (
              <div className="text-center py-12">
                <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Active Competitions</h3>
                <p className="text-gray-500 mb-6">Be the first to create a trading competition!</p>
                <Link
                  to="/competitions/create"
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Competition
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {competitions.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-competitions' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">My Competitions</h2>
            {myCompetitions.length === 0 ? (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No Competitions Yet</h3>
                <p className="text-gray-500 mb-6">Join a competition to start trading!</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Discover Competitions
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCompetitions.map((competition) => (
                  <CompetitionCard key={competition.id} competition={competition} showJoinButton={false} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'search-users' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Find Traders</h2>
            
            {/* Enhanced Search Form with Dropdown */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Search for users by username or email:
                </label>
                <UserSearchDropdown
                  placeholder="Search users by username or email..."
                  showAddFriend={true}
                />
              </div>
              
              <div className="text-sm text-gray-400">
                💡 <strong>Tip:</strong> Type at least 2 characters to see results with a loading spinner. 
                Click on any user to view their profile or add them as a friend.
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">How to use:</h3>
              <ul className="text-sm space-y-1">
                <li>• Start typing a username or email</li>
                <li>• Results appear in a dropdown with loading spinner</li>
                <li>• Click "View" to see their profile</li>
                <li>• Click "Add" to send a friend request</li>
                <li>• Click outside the dropdown to close it</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialHubNew;
