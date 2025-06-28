import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SafeIcon from '../common/SafeIcon'
import jobScheduler from '../services/jobScheduler'
import * as FiIcons from 'react-icons/fi'

const { FiRefreshCw, FiClock, FiCheck, FiAlertCircle, FiDatabase } = FiIcons

const JobScrapingStatus = () => {
  const [status, setStatus] = useState(jobScheduler.getStatus())
  const [isManualScraping, setIsManualScraping] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  useEffect(() => {
    // Start the scheduler when component mounts
    jobScheduler.startScheduler()

    // Listen for job updates
    const handleJobsUpdated = (event) => {
      setLastUpdate(event.detail)
      setStatus(jobScheduler.getStatus())
      setIsManualScraping(false)
    }

    window.addEventListener('jobsUpdated', handleJobsUpdated)

    // Update status every 30 seconds
    const statusInterval = setInterval(() => {
      setStatus(jobScheduler.getStatus())
    }, 30000)

    return () => {
      window.removeEventListener('jobsUpdated', handleJobsUpdated)
      clearInterval(statusInterval)
    }
  }, [])

  const handleManualScrape = async () => {
    setIsManualScraping(true)
    await jobScheduler.runScraping()
  }

  const formatLastRun = (timestamp) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
    return date.toLocaleDateString()
  }

  const getStatusColor = () => {
    if (isManualScraping) return 'text-blue-600'
    if (status.isRunning) return 'text-green-600'
    return 'text-gray-600'
  }

  const getStatusIcon = () => {
    if (isManualScraping) return FiRefreshCw
    if (status.isRunning) return FiCheck
    return FiAlertCircle
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <SafeIcon 
            icon={getStatusIcon()} 
            className={`text-lg ${getStatusColor()} ${isManualScraping ? 'animate-spin' : ''}`} 
          />
          <div>
            <h3 className="font-medium text-gray-900">Job Feed Status</h3>
            <p className="text-sm text-gray-600">
              {isManualScraping 
                ? 'Scanning for new opportunities...' 
                : status.isRunning 
                ? 'Auto-scanning active (hourly)' 
                : 'Auto-scanning paused'
              }
            </p>
          </div>
        </div>

        <button
          onClick={handleManualScrape}
          disabled={isManualScraping}
          className="flex items-center space-x-2 px-3 py-2 bg-primary hover:bg-primary-dark text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SafeIcon icon={FiRefreshCw} className={isManualScraping ? 'animate-spin' : ''} />
          <span>{isManualScraping ? 'Scanning...' : 'Scan Now'}</span>
        </button>
      </div>

      {status.lastRun && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiClock} className="text-gray-400" />
              <div>
                <p className="text-gray-500">Last Scan</p>
                <p className="font-medium">{formatLastRun(status.lastRun.timestamp)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiDatabase} className="text-gray-400" />
              <div>
                <p className="text-gray-500">New Jobs</p>
                <p className="font-medium">{status.lastRun.results?.saved || 0}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-gray-500">Indeed</p>
                <p className="font-medium">{status.lastRun.results?.sources?.indeed || 0}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-gray-500">RemoteOK</p>
                <p className="font-medium">{status.lastRun.results?.sources?.remoteok || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {lastUpdate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800"
        >
          ✅ Found {lastUpdate.saved} new opportunities from {lastUpdate.total} scanned jobs
        </motion.div>
      )}
    </motion.div>
  )
}

export default JobScrapingStatus