import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import SafeIcon from '../common/SafeIcon'
import supabase from '../lib/supabase'
import * as FiIcons from 'react-icons/fi'

const { FiBell, FiMail, FiTrendingUp, FiSave, FiCheck } = FiIcons

const EmailPreferences = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [preferences, setPreferences] = useState({
    perfect_match_alerts: true,
    daily_digest: true,
    weekly_trends: true,
    email_frequency: 'immediate',
    notification_time: '08:00'
  })

  useEffect(() => {
    if (user && isOpen) {
      loadPreferences()
    }
  }, [user, isOpen])

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences_gig_scout')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setPreferences({
          perfect_match_alerts: data.perfect_match_alerts ?? true,
          daily_digest: data.daily_digest ?? true,
          weekly_trends: data.weekly_trends ?? true,
          email_frequency: data.email_frequency || 'immediate',
          notification_time: data.notification_time || '08:00'
        })
      }
    } catch (err) {
      console.error('Error loading email preferences:', err)
    }
  }

  const savePreferences = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_preferences_gig_scout')
        .upsert([{
          user_id: user.id,
          perfect_match_alerts: preferences.perfect_match_alerts,
          daily_digest: preferences.daily_digest,
          weekly_trends: preferences.weekly_trends,
          email_frequency: preferences.email_frequency,
          notification_time: preferences.notification_time,
          updated_at: new Date().toISOString()
        }])

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error('Error saving email preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const updatePreference = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Email Preferences</h2>
            <p className="text-gray-600">Customize your notification settings</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <SafeIcon icon={FiIcons.FiX} className="text-xl" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Perfect Match Alerts */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <SafeIcon icon={FiBell} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Perfect Match Alerts</h3>
                  <p className="text-sm text-gray-600">Instant notifications for 8+ score jobs</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.perfect_match_alerts}
                  onChange={(e) => updatePreference('perfect_match_alerts', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Get notified immediately when we find jobs that perfectly match your skills and preferences.
            </p>
          </div>

          {/* Daily Digest */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <SafeIcon icon={FiMail} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Daily Digest</h3>
                  <p className="text-sm text-gray-600">Summary of good opportunities</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.daily_digest}
                  onChange={(e) => updatePreference('daily_digest', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Receive a curated list of the best opportunities found in the last 24 hours.
            </p>
          </div>

          {/* Weekly Trends */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <SafeIcon icon={FiTrendingUp} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Weekly Market Trends</h3>
                  <p className="text-sm text-gray-600">Market insights and analysis</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.weekly_trends}
                  onChange={(e) => updatePreference('weekly_trends', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Get weekly reports on market trends, salary insights, and personalized recommendations.
            </p>
          </div>

          {/* Notification Time */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Preferred Notification Time</h3>
            <select
              value={preferences.notification_time}
              onChange={(e) => updatePreference('notification_time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="06:00">6:00 AM</option>
              <option value="07:00">7:00 AM</option>
              <option value="08:00">8:00 AM</option>
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="18:00">6:00 PM</option>
              <option value="19:00">7:00 PM</option>
              <option value="20:00">8:00 PM</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Time when daily digests and weekly reports will be sent.
            </p>
          </div>

          {/* Email Frequency */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Email Frequency</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="immediate"
                  checked={preferences.email_frequency === 'immediate'}
                  onChange={(e) => updatePreference('email_frequency', e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">Immediate (for perfect matches)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="hourly"
                  checked={preferences.email_frequency === 'hourly'}
                  onChange={(e) => updatePreference('email_frequency', e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">Hourly digest</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  value="daily"
                  checked={preferences.email_frequency === 'daily'}
                  onChange={(e) => updatePreference('email_frequency', e.target.value)}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-sm">Daily only</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={savePreferences}
            disabled={loading}
            className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-medium transition-all ${
              saved 
                ? 'bg-green-600 text-white' 
                : 'bg-primary hover:bg-primary-dark text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <SafeIcon icon={saved ? FiCheck : FiSave} />
            <span>
              {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
            </span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default EmailPreferences