import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Users, Clock, DollarSign, TrendingUp, Calendar } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface CompetitionDetails {
  id: number;
  name: string;
  description: string;
  creator: {
    username: string;
  };
  start_date: string;
  end_date: string;
  max_participants: number;
  starting_balance: number;
  status: string;
  rules?: string;
}

interface Participant {
  user: {
    id: number;
    username: string;
    full_name?: string;
  };
  current_value: number;
  profit_loss: number;
  profit_loss_percentage: number;
  rank: number;
}

const CompetitionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [competition, setCompetition] = useState<CompetitionDetails | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCompetitionDetails();
      fetchLeaderboard();
    }
  }, [id]);

  const fetchCompetitionDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/social/competitions/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCompetition(data);
      }
    } catch (err) {
      console.error('Failed to fetch competition details:', err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/social/competitions/${id}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
        
        // Check if current user is a participant
        const token = localStorage.getItem('access_token');
        if (token) {
          // You would need to decode the token or make an API call to get current user
          // For now, we'll assume the user is a participant if they're in the list
          setIsParticipant(data.participants.some((p: Participant) => p.user.username === 'current_user'));
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const joinCompetition = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/social/competitions/${id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        alert('Successfully joined competition!');
        setIsParticipant(true);
        fetchLeaderboard();
      }
    } catch (err) {
      console.error('Failed to join competition:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = () => {
    if (!competition) return '';
    
    const now = new Date();
    const end = new Date(competition.end_date);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Competition ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    return 'text-gray-400';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading competition details...</div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Competition not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Competition Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{competition.name}</h1>
              <p className="text-gray-400">Created by @{competition.creator.username}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm ${
                competition.status === 'active' ? 'bg-green-600' : 
                competition.status === 'upcoming' ? 'bg-blue-600' : 'bg-gray-600'
              }`}>
                {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
              </span>
            </div>
          </div>

          {competition.description && (
            <p className="text-gray-300 mb-4">{competition.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Starts</p>
                <p className="font-semibold">{formatDate(competition.start_date)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-sm text-gray-400">Time Left</p>
                <p className="font-semibold">{getTimeRemaining()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-gray-400">Participants</p>
                <p className="font-semibold">{participants.length}/{competition.max_participants}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm text-gray-400">Starting Balance</p>
                <p className="font-semibold">₹{competition.starting_balance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {competition.rules && (
            <div className="bg-gray-700 rounded p-4 mb-4">
              <h3 className="font-semibold mb-2">Competition Rules</h3>
              <p className="text-sm text-gray-300">{competition.rules}</p>
            </div>
          )}

          {!isParticipant && competition.status !== 'completed' && participants.length < competition.max_participants && (
            <button
              onClick={joinCompetition}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium"
            >
              Join Competition
            </button>
          )}

          {isParticipant && competition.status === 'active' && (
            <Link
              to={`/competitions/${competition.id}/trade`}
              className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium"
            >
              Trade Now
            </Link>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span>Leaderboard</span>
          </h2>

          {participants.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No participants yet. Be the first to join!
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.user.id}
                  className={`bg-gray-700 rounded-lg p-4 flex items-center justify-between ${
                    participant.rank <= 3 ? 'border-l-4 border-yellow-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`text-2xl font-bold ${getRankColor(participant.rank)}`}>
                      {getRankIcon(participant.rank)}
                    </div>
                    <div>
                      <Link
                        to={`/profile/${participant.user.id}`}
                        className="font-semibold hover:text-blue-400"
                      >
                        {participant.user.full_name || participant.user.username}
                      </Link>
                      <p className="text-sm text-gray-400">@{participant.user.username}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">₹{participant.current_value.toLocaleString()}</p>
                    <p className={`text-sm flex items-center space-x-1 ${
                      participant.profit_loss >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                      <span>
                        {participant.profit_loss >= 0 ? '+' : ''}₹{participant.profit_loss.toLocaleString()}
                        ({participant.profit_loss_percentage.toFixed(2)}%)
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionDetails;
