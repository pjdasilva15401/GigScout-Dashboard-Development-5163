import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import jobScheduler from '../services/jobScheduler'
import EmailService from '../services/emailService'
import EmailScheduler from '../services/emailScheduler'
import SafeIcon from '../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiPlay, FiPause, FiRefreshCw, FiClock, FiDatabase, FiActivity, FiMail, FiSend } = FiIcons

const AdminPanel = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState(jobScheduler.getStatus())
  const [emailStats, setEmailStats] = useState({ total: 0, perfect_match: 0, daily_digest: 0, weekly_trends: 0 })
  const [isManualRunning, setIsManualRunning] = useState(false)
  const [emailScheduler] = useState(() => new EmailScheduler())
  const [emailService] = useState(() => new EmailService())
  const [logs, setLogs] = useState([])
  const [emailSchedulerStatus, setEmailSchedulerStatus] = useState({ isRunning: false })

  useEffect(() => {
    if (!isOpen) return

    // Update status every 10 seconds
    const interval = setInterval(() => {
      setStatus(jobScheduler.getStatus())
      setEmailSchedulerStatus(emailScheduler.getStatus())
    }, 10000)

    // Load email stats
    loadEmailStats()

    // Listen for job updates
    const handleJobsUpdated = (event) => {
      setLogs(prev => [
        `✅ Jobs updated at ${event.detail.timestamp || new Date().toLocaleString()}`,
        ...prev.slice(0, 9) // Keep only last 10 logs
      ])
    }

    window.addEventListener('jobsUpdated', handleJobsUpdated)

    return () => {
      clearInterval(interval)
      window.removeEventListener('jobsUpdated', handleJobsUpdated)
    }
  }, [isOpen, emailScheduler])

  const loadEmailStats = async () => {
    const stats = await emailService.getEmailStats(7) // Last 7 days
    setEmailStats(stats)
  }

  const handleStartScheduler = () => {
    jobScheduler.startScheduler()
    setStatus(jobScheduler.getStatus())
    setLogs(prev => [`🚀 Job scheduler started at ${new Date().toLocaleString()}`, ...prev])
  }

  const handleStopScheduler = () => {
    jobScheduler.stopScheduler()
    setStatus(jobScheduler.getStatus())
    setLogs(prev => [`⏹️ Job scheduler stopped at ${new Date().toLocaleString()}`, ...prev])
  }

  const handleStartEmailScheduler = () => {
    emailScheduler.startEmailScheduling()
    setEmailSchedulerStatus(emailScheduler.getStatus())
    setLogs(prev => [`📧 Email scheduler started at ${new Date().toLocaleString()}`, ...prev])
  }

  const handleStopEmailScheduler = () => {
    emailScheduler.stopEmailScheduling()
    setEmailSchedulerStatus(emailScheduler.getStatus())
    setLogs(prev => [`📵 Email scheduler stopped at ${new Date().toLocaleString()}`, ...prev])
  }

  const handleManualRun = async () => {
    setIsManualRunning(true)
    setLogs(prev => [`🔄 Manual scraping started at ${new Date().toLocaleString()}`, ...prev])
    
    try {
      await jobScheduler.runScraping()
    } catch (error) {
      setLogs(prev => [`❌ Manual scraping failed: ${error.message}`, ...prev])
    } finally {
      setIsManualRunning(false)
    }
  }

  const handleTestPerfectMatch = async () => {
    setLogs(prev => [`🧪 Testing perfect match alerts at ${new Date().toLocaleString()}`, ...prev])
    await emailScheduler.triggerPerfectMatchTest()
    loadEmailStats()
  }

  const handleTestDailyDigest = async () => {
    setLogs(prev => [`🧪 Testing daily digest at ${new Date().toLocaleString()}`, ...prev])
    await emailScheduler.triggerDailyDigestTest()
    loadEmailStats()
  }

  const handleTestWeeklyTrends = async () => {
    setLogs(prev => [`🧪 Testing weekly trends at ${new Date().toLocaleString()}`, ...prev])
    await emailScheduler.triggerWeeklyTrendsTest()
    loadEmailStats()
  }

  const formatTime = (date) => {
    return date ? date.toLocaleString() : 'Never'
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
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Control Panel</h2>
            <p className="text-gray-600">Monitor and control job scraping & email alerts</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <SafeIcon icon={FiIcons.FiX} className="text-xl" />
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <SafeIcon icon={FiActivity} className="text-primary" />
              <h3 className="font-semibold text-gray-900">Job Scheduler</h3>
            </div>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${
              status.isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {status.isRunning ? '🟢 Running' : '🔴 Stopped'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <SafeIcon icon={FiMail} className="text-blue-600" />
              <h3 className="font-semibold text-gray-900">Email Scheduler</h3>
            </div>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm ${
              emailSchedulerStatus.isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {emailSchedulerStatus.isRunning ? '🟢 Running' : '🔴 Stopped'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <SafeIcon icon={FiClock} className="text-primary" />
              <h3 className="font-semibold text-gray-900">Last Scrape</h3>
            </div>
            <p className="text-sm text-gray-600">{formatTime(status.lastRun?.timestamp)}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <SafeIcon icon={FiSend} className="text-purple-600" />
              <h3 className="font-semibold text-gray-900">Emails (7d)</h3>
            </div>
            <p className="text-sm text-gray-600">{emailStats.total} sent</p>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Job Scheduler Controls */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Job Scheduler Controls</h3>
            <div className="flex flex-wrap gap-3">
              {!status.isRunning ? (
                <button
                  onClick={handleStartScheduler}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <SafeIcon icon={FiPlay} />
                  <span>Start Scheduler</span>
                </button>
              ) : (
                <button
                  onClick={handleStopScheduler}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  <SafeIcon icon={FiPause} />
                  <span>Stop Scheduler</span>
                </button>
              )}

              <button
                onClick={handleManualRun}
                disabled={isManualRunning}
                className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={FiRefreshCw} className={isManualRunning ? 'animate-spin' : ''} />
                <span>{isManualRunning ? 'Scraping...' : 'Run Now'}</span>
              </button>
            </div>
          </div>

          {/* Email Scheduler Controls */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Email Scheduler Controls</h3>
            <div className="flex flex-wrap gap-3">
              {!emailSchedulerStatus.isRunning ? (
                <button
                  onClick={handleStartEmailScheduler}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <SafeIcon icon={FiPlay} />
                  <span>Start Email Scheduler</span>
                </button>
              ) : (
                <button
                  onClick={handleStopEmailScheduler}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  <SafeIcon icon={FiPause} />
                  <span>Stop Email Scheduler</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Email Testing */}
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Email Testing</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleTestPerfectMatch}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <span>🎯</span>
              <span>Test Perfect Match</span>
            </button>
            
            <button
              onClick={handleTestDailyDigest}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <span>📬</span>
              <span>Test Daily Digest</span>
            </button>
            
            <button
              onClick={handleTestWeeklyTrends}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              <span>📊</span>
              <span>Test Weekly Trends</span>
            </button>
          </div>
        </div>

        {/* Email Statistics */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Email Statistics (Last 7 Days)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{emailStats.total}</div>
              <div className="text-sm text-gray-600">Total Emails</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{emailStats.perfect_match}</div>
              <div className="text-sm text-gray-600">Perfect Match</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{emailStats.daily_digest}</div>
              <div className="text-sm text-gray-600">Daily Digest</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{emailStats.weekly_trends}</div>
              <div className="text-sm text-gray-600">Weekly Trends</div>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <SafeIcon icon={FiDatabase} className="text-blue-600" />
                <h4 className="font-medium">Indeed RSS</h4>
              </div>
              <p className="text-sm text-gray-600">Social media marketing jobs from Indeed RSS feed</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  ✓ Active
                </span>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <SafeIcon icon={FiDatabase} className="text-orange-600" />
                <h4 className="font-medium">RemoteOK API</h4>
              </div>
              <p className="text-sm text-gray-600">Remote social media jobs from RemoteOK</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  ✓ Active
                </span>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <SafeIcon icon={FiDatabase} className="text-purple-600" />
                <h4 className="font-medium">AngelList</h4>
              </div>
              <p className="text-sm text-gray-600">Startup social media positions</p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                  ⚠ Demo Mode
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Logs</h3>
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm">
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            ) : (
              <div className="text-gray-400">No recent activity</div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default AdminPanel