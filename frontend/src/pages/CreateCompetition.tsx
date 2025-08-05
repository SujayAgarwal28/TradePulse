import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Users, DollarSign, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../config/environment';

const CreateCompetition: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_days: 2,
    max_participants: 10,
    starting_balance: 10000,
    rules: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${config.api.baseURL}/social/competitions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const competition = await response.json();
        alert('Competition created successfully!');
        navigate(`/competitions/${competition.id}`);
      } else {
        const error = await response.json();
        alert(`Failed to create competition: ${error.detail}`);
      }
    } catch (err) {
      console.error('Failed to create competition:', err);
      alert('Failed to create competition. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'max_participants' || name === 'starting_balance' || name === 'duration_days' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">Create Trading Competition</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 space-y-6">
          {/* Competition Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Competition Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter competition name..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Describe your competition..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Duration */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium mb-2">
                <Clock className="w-4 h-4" />
                <span>Duration (Days)</span>
              </label>
              <select
                name="duration_days"
                value={formData.duration_days}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 Day</option>
                <option value={2}>2 Days</option>
                <option value={3}>3 Days</option>
                <option value={7}>1 Week</option>
                <option value={14}>2 Weeks</option>
                <option value={30}>1 Month</option>
              </select>
            </div>

            {/* Max Participants */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium mb-2">
                <Users className="w-4 h-4" />
                <span>Max Participants</span>
              </label>
              <input
                type="number"
                name="max_participants"
                value={formData.max_participants}
                onChange={handleChange}
                min={2}
                max={100}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Starting Balance */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium mb-2">
              <DollarSign className="w-4 h-4" />
              <span>Starting Balance (₹)</span>
            </label>
            <select
              name="starting_balance"
              value={formData.starting_balance}
              onChange={handleChange}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5000}>₹5,000</option>
              <option value={10000}>₹10,000</option>
              <option value={25000}>₹25,000</option>
              <option value={50000}>₹50,000</option>
              <option value={100000}>₹1,00,000</option>
            </select>
          </div>

          {/* Rules */}
          <div>
            <label className="block text-sm font-medium mb-2">Competition Rules (Optional)</label>
            <textarea
              name="rules"
              value={formData.rules}
              onChange={handleChange}
              rows={4}
              placeholder="Enter specific rules for this competition..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Competition Info */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Competition Preview</span>
            </h3>
            <div className="text-sm text-gray-300 space-y-1">
              <p>• Competition will start immediately after creation</p>
              <p>• Duration: {formData.duration_days} day{formData.duration_days !== 1 ? 's' : ''}</p>
              <p>• Starting balance: ₹{formData.starting_balance.toLocaleString()}</p>
              <p>• Maximum {formData.max_participants} participants allowed</p>
              <p>• Winner determined by highest portfolio value at end</p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate('/social')}
              className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 py-3 rounded-lg font-medium"
            >
              {loading ? 'Creating...' : 'Create Competition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCompetition;
