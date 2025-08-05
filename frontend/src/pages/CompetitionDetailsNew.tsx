import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Trophy, Users, Clock, DollarSign, TrendingUp, Star, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config/environment';

interface CompetitionDetails {
  id: number;
  name: string;
  description: string;
  creator: {
    id: number;
    username: string;
    full_name?: string;
  };
  status: string;
  start_date: string;
  end_date: string;
  starting_balance: number;
  max_participants: number;
  current_participants: number;
  is_public: boolean;
  time_remaining_seconds?: number;
  created_at: string;
}

interface LeaderboardEntry {
  rank: number;
  user: {
    id: number;
    username: string;
    full_name?: string;
  };
  starting_balance: number;
  current_balance: number;
  total_return: number;
  return_percentage: number;
  trades_count: number;
  status: string;
}

interface Leaderboard {
  competition: CompetitionDetails;
  participants: LeaderboardEntry[];
}

const CompetitionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [competition, setCompetition] = useState<CompetitionDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCompetitionData();
      // Set up interval for live updates
      const interval = setInterval(fetchCompetitionData, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [id]);

  const fetchCompetitionData = async () => {
    try {
      // Fetch competition details
      const detailsResponse = await fetch(`${config.api.baseURL}/social/competitions/${id}`);
      if (detailsResponse.ok) {
        const details = await detailsResponse.json();
        setCompetition(details);
      }

      // Fetch leaderboard
      const leaderboardResponse = await fetch(`${config.api.baseURL}/social/competitions/${id}/leaderboard`);
      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData);
        
        // Check if current user is participant
        if (token) {
          // Get current user ID by calling a user endpoint or decoding token
          try {
            const userResponse = await fetch(`${config.api.baseURL}/auth/me`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (userResponse.ok) {
              const userData = await userResponse.json();
              const currentUserId = userData.id;
              
              // Check if current user is in the participants list
              const userIsParticipant = leaderboardData.participants.some(
                (participant: LeaderboardEntry) => participant.user.id === currentUserId
              );
              setIsParticipant(userIsParticipant);
            }
          } catch (error) {
            console.error('Failed to check user participation:', error);
            setIsParticipant(false);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch competition data:', err);
    } finally {
      setLoading(false);
    }
  };

  const joinCompetition = async () => {
    if (!id) return;
    
    setJoining(true);
    try {
      const response = await fetch(`${config.api.baseURL}/social/competitions/${id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        setIsParticipant(true);
        fetchCompetitionData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Failed to join: ${error.detail}`);
      }
    } catch (err) {
      console.error('Failed to join competition:', err);
      alert('Failed to join competition. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Ended';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'upcoming': return 'text-yellow-400';
      case 'completed': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <TrendingUp className="h-5 w-5" />;
      case 'upcoming': return <Clock className="h-5 w-5" />;
      case 'completed': return <Trophy className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading competition details...</div>
      </div>
    );
  }

  if (!competition || !leaderboard) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Competition not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate('/social')}
            className="mr-4 p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">{competition.name}</h1>
            <p className="text-gray-400">{competition.description}</p>
          </div>
        </div>

        {/* Competition Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-2">
              {getStatusIcon(competition.status)}
              <span className={`ml-2 font-semibold ${getStatusColor(competition.status)}`}>
                {competition.status.toUpperCase()}
              </span>
            </div>
            {competition.time_remaining_seconds && competition.time_remaining_seconds > 0 && (
              <p className="text-sm text-gray-400">
                {formatTimeRemaining(competition.time_remaining_seconds)}
              </p>
            )}
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-2">
              <Users className="h-5 w-5 text-blue-400" />
              <span className="ml-2 font-semibold">Participants</span>
            </div>
            <p className="text-2xl font-bold">
              {competition.current_participants}/{competition.max_participants}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              <span className="ml-2 font-semibold">Starting Balance</span>
            </div>
            <p className="text-2xl font-bold">
              ${competition.starting_balance.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="ml-2 font-semibold">Creator</span>
            </div>
            <p className="text-lg font-semibold">
              {competition.creator?.full_name || competition.creator?.username || 'Unknown User'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          {!isParticipant && competition.status === 'active' && (
            <button
              onClick={joinCompetition}
              disabled={joining || competition.current_participants >= competition.max_participants}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {joining ? 'Joining...' : 'Join Competition'}
            </button>
          )}
          
          {isParticipant && competition.status === 'active' && (
            <Link
              to={`/competitions/${id}/trade`}
              className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              Start Trading
            </Link>
          )}
          
          {isParticipant && (
            <Link
              to={`/competitions/${id}/portfolio`}
              className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors inline-block"
            >
              View Portfolio
            </Link>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-700 border-b border-gray-600">
            <h2 className="text-xl font-bold flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-yellow-400" />
              Leaderboard
            </h2>
          </div>
          
          {leaderboard.participants.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No participants yet. Be the first to join!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Trader
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Portfolio Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      P&L
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Return %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Trades
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {leaderboard.participants.map((participant, index) => (
                    <tr key={participant.user.id} className={index < 3 ? 'bg-yellow-900/20' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index === 0 && <Trophy className="h-5 w-5 text-yellow-400 mr-2" />}
                          {index === 1 && <Trophy className="h-5 w-5 text-gray-400 mr-2" />}
                          {index === 2 && <Trophy className="h-5 w-5 text-orange-400 mr-2" />}
                          <span className="text-lg font-bold">#{participant.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium">
                            {participant.user?.full_name || participant.user?.username || 'Unknown User'}
                          </div>
                          <div className="text-sm text-gray-400">
                            @{participant.user?.username || 'unknown'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-lg font-semibold">
                        ${participant.current_balance.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-semibold ${
                          participant.total_return >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {participant.total_return >= 0 ? '+' : ''}${participant.total_return.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-semibold ${
                          participant.return_percentage >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {participant.return_percentage >= 0 ? '+' : ''}{participant.return_percentage.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {participant.trades_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionDetailsPage;
