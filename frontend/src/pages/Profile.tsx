import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'

interface UserProfile {
  id: number
  email: string
  username?: string
  full_name?: string
  bio?: string
  profile_picture_url?: string
  is_active: boolean
  created_at: string
}

interface UserPreferences {
  theme: 'dark' | 'light'
  email_notifications: boolean
  portfolio_reset_count: number
  last_reset_date?: string
}

const Profile: React.FC = () => {
  const { } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: '',
    full_name: '',
    bio: '',
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    theme: 'dark' as 'dark' | 'light',
    email_notifications: true,
  })

  useEffect(() => {
    loadProfileData()
  }, [])

  const loadProfileData = async () => {
    try {
      setLoading(true)
      const [profileData, preferencesData] = await Promise.all([
        authAPI.getProfile(),
        authAPI.getPreferences()
      ])

      setProfile(profileData)
      setPreferences(preferencesData)

      // Initialize forms with current data
      setProfileForm({
        username: profileData.username || '',
        full_name: profileData.full_name || '',
        bio: profileData.bio || '',
      })

      setSettingsForm({
        theme: preferencesData.theme,
        email_notifications: preferencesData.email_notifications,
      })

    } catch (err) {
      setError('Failed to load profile data')
      console.error('Profile load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      const updatedProfile = await authAPI.updateProfile(profileForm)
      setProfile(updatedProfile)
      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError('Failed to update profile')
      console.error('Profile update error:', err)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    try {
      setError(null)
      await authAPI.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setSuccessMessage('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError('Failed to change password. Please check your current password.')
      console.error('Password change error:', err)
    }
  }

  const handleSettingsUpdate = async () => {
    try {
      setError(null)
      const updatedPreferences = await authAPI.updatePreferences(settingsForm)
      setPreferences(updatedPreferences)
      setSuccessMessage('Settings updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError('Failed to update settings')
      console.error('Settings update error:', err)
    }
  }

  const handlePortfolioReset = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset your portfolio? This will:\n\n' +
      '• Reset your balance to $100,000\n' +
      '• Clear all positions\n' +
      '• Archive your trade history\n\n' +
      'This action cannot be undone!'
    )

    if (!confirmed) return

    const doubleConfirm = window.prompt(
      'Type "RESET" to confirm portfolio reset:'
    )

    if (doubleConfirm !== 'RESET') {
      setError('Portfolio reset cancelled - confirmation text did not match')
      return
    }

    try {
      setError(null)
      await authAPI.resetPortfolio()
      setSuccessMessage('Portfolio reset successfully! Redirecting to dashboard...')
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
    } catch (err) {
      setError('Failed to reset portfolio')
      console.error('Portfolio reset error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-xl">Loading profile...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile & Settings</h1>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500/20 border border-green-500 text-green-400 p-4 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
            
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white opacity-60"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  placeholder="Choose a username"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  placeholder="Your full name"
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Update Profile
              </button>
            </form>
          </div>

          {/* Settings */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={settingsForm.theme}
                  onChange={(e) => {
                    const newTheme = e.target.value as 'dark' | 'light'
                    setSettingsForm({ ...settingsForm, theme: newTheme })
                  }}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Email Notifications
                  </label>
                  <p className="text-xs text-gray-400">
                    Receive email updates about your trades and portfolio
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settingsForm.email_notifications}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email_notifications: e.target.checked })}
                  className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                />
              </div>

              <button
                onClick={handleSettingsUpdate}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Update Settings
              </button>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Change Password</h2>
            
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Change Password
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-gray-800 rounded-lg p-6 border border-red-500/30">
            <h2 className="text-xl font-semibold mb-6 text-red-400">Danger Zone</h2>
            
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg">
                <h3 className="font-medium text-red-400 mb-2">Reset Portfolio</h3>
                <p className="text-sm text-gray-300 mb-4">
                  This will reset your portfolio to $100,000 and clear all positions and trade history.
                  This action cannot be undone!
                </p>
                
                {preferences && (
                  <p className="text-xs text-gray-400 mb-4">
                    Portfolio has been reset {preferences.portfolio_reset_count} times
                    {preferences.last_reset_date && (
                      <span> (last reset: {new Date(preferences.last_reset_date).toLocaleDateString()})</span>
                    )}
                  </p>
                )}

                <button
                  onClick={handlePortfolioReset}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Reset Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Stats */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Member since:</span>
              <p className="font-medium">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-gray-400">Portfolio resets:</span>
              <p className="font-medium">{preferences?.portfolio_reset_count || 0}</p>
            </div>
            <div>
              <span className="text-gray-400">Account status:</span>
              <p className={`font-medium ${profile?.is_active ? 'text-green-400' : 'text-red-400'}`}>
                {profile?.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
