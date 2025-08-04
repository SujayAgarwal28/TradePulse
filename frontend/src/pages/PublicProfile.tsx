import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, Trophy, TrendingUp, Calendar, Award } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UserPublicProfile {
  id: number;
  username: string;
  full_name?: string;
  created_at: string;
  total_trades: number;
  profitable_trades: number;
  win_rate: number;
  total_profit: number;
  rank_points: number;
  competition_wins: number;
  active_competitions: number;
}

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/social/profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-xl">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <div className="flex items-center space-x-6 mb-6">
            <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile.full_name || profile.username}</h1>
              <p className="text-gray-400 text-lg">@{profile.username}</p>
              <p className="text-sm text-gray-500 flex items-center space-x-1 mt-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{profile.total_trades}</div>
              <div className="text-sm text-gray-400">Total Trades</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{profile.win_rate.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Win Rate</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{profile.rank_points}</div>
              <div className="text-sm text-gray-400">Rank Points</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{profile.competition_wins}</div>
              <div className="text-sm text-gray-400">Competition Wins</div>
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Trading Performance */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span>Trading Performance</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Trades</span>
                <span className="font-semibold">{profile.total_trades}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Profitable Trades</span>
                <span className="font-semibold text-green-400">{profile.profitable_trades}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Loss Trades</span>
                <span className="font-semibold text-red-400">{profile.total_trades - profile.profitable_trades}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Win Rate</span>
                <span className="font-semibold text-blue-400">{profile.win_rate.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Profit/Loss</span>
                <span className={`font-semibold ${profile.total_profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profile.total_profit >= 0 ? '+' : ''}₹{profile.total_profit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Competitions & Achievements */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span>Competitions & Achievements</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Competition Wins</span>
                <span className="font-semibold text-yellow-400">{profile.competition_wins}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Active Competitions</span>
                <span className="font-semibold">{profile.active_competitions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Rank Points</span>
                <span className="font-semibold text-purple-400">{profile.rank_points}</span>
              </div>
              
              {/* Achievement Badges */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Achievement Badges</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.competition_wins > 0 && (
                    <span className="bg-yellow-600 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                      <Award className="w-3 h-3" />
                      <span>Winner</span>
                    </span>
                  )}
                  {profile.total_trades >= 100 && (
                    <span className="bg-blue-600 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Active Trader</span>
                    </span>
                  )}
                  {profile.win_rate >= 60 && (
                    <span className="bg-green-600 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                      <Trophy className="w-3 h-3" />
                      <span>Skilled Trader</span>
                    </span>
                  )}
                  {profile.rank_points >= 1000 && (
                    <span className="bg-purple-600 px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                      <Award className="w-3 h-3" />
                      <span>Elite</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
