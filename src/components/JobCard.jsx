import React from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useUserActions } from '../hooks/useUserActions'
import SafeIcon from '../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiMapPin, FiClock, FiBookmark, FiThumbsUp, FiX, FiUsers, FiExternalLink } = FiIcons

const JobCard = ({ job, index, onJobAction }) => {
  const { user } = useAuth()
  const { addUserAction, getUserActionForOpportunity } = useUserActions()
  
  const userAction = getUserActionForOpportunity(job.id)
  
  const getMatchScoreColor = (score) => {
    if (score >= 8) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getPlatformColor = (platform) => {
    const colors = {
      'Upwork': 'bg-green-100 text-green-700',
      'Fiverr': 'bg-emerald-100 text-emerald-700',
      'Indeed': 'bg-blue-100 text-blue-700',
      'LinkedIn': 'bg-blue-100 text-blue-700',
      'Freelancer': 'bg-orange-100 text-orange-700',
      'AngelList': 'bg-purple-100 text-purple-700',
      'FlexJobs': 'bg-indigo-100 text-indigo-700',
      'ZipRecruiter': 'bg-red-100 text-red-700'
    }
    return colors[platform] || 'bg-gray-100 text-gray-700'
  }

  const formatRate = (job) => {
    if (job.rate_type === 'hourly') {
      return job.rate_min === job.rate_max 
        ? `$${job.rate_min}/hour`
        : `$${job.rate_min}-${job.rate_max}/hour`
    } else if (job.rate_type === 'monthly') {
      return `$${job.rate_min}/month`
    } else {
      return `$${job.rate_min} project`
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now - date
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInDays === 1) return '1 day ago'
    return `${diffInDays} days ago`
  }

  const truncateDescription = (text, maxLength = 120) => {
    return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const handleAction = async (actionType) => {
    if (!user) return

    try {
      await addUserAction(job.id, actionType)
      if (onJobAction) {
        onJobAction(job.id, actionType)
      }
    } catch (error) {
      console.error('Error handling action:', error)
    }
  }

  const getWhyMatches = () => {
    const matches = []
    if (job.skills) {
      const relevantSkills = job.skills.slice(0, 2)
      if (relevantSkills.length > 0) {
        matches.push(`Skills: ${relevantSkills.join(', ')}`)
      }
    }
    if (job.industry) {
      matches.push(`Industry: ${job.industry}`)
    }
    return matches
  }

  const estimatedApplicants = Math.floor(Math.random() * 50) + 5

  if (userAction?.action_type === 'passed') {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {job.title}
            </h3>
            {job.platform_source && (
              <span className={`px-2 py-1 text-xs rounded-full ${getPlatformColor(job.platform_source)}`}>
                {job.platform_source}
              </span>
            )}
          </div>
          <p className="text-primary font-medium">{job.company}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getMatchScoreColor(job.match_score)}`}>
          {job.match_score}/10
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <span className="font-semibold text-gray-900">{formatRate(job)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <SafeIcon icon={FiMapPin} className="text-gray-400" />
          <span>{job.remote_ok ? 'Remote' : job.location}</span>
        </div>
        <div className="flex items-center space-x-1">
          <SafeIcon icon={FiClock} className="text-gray-400" />
          <span>{formatDate(job.date_posted)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <SafeIcon icon={FiUsers} className="text-gray-400" />
          <span>{estimatedApplicants} applicants</span>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {truncateDescription(job.description)}
      </p>

      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {job.skills.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
              +{job.skills.length - 3} more
            </span>
          )}
        </div>
      )}

      {job.match_score >= 7 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <h4 className="text-sm font-medium text-green-800 mb-1">Why this matches:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            {getWhyMatches().map((match, index) => (
              <li key={index}>• {match}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <button 
          onClick={() => handleAction('interested')}
          disabled={!user}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
            userAction?.action_type === 'interested'
              ? 'bg-green-600 text-white'
              : 'bg-accent hover:bg-accent-dark text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <SafeIcon icon={FiThumbsUp} className="text-sm" />
          <span>{userAction?.action_type === 'interested' ? 'Interested ✓' : 'Interested'}</span>
        </button>
        
        <button 
          onClick={() => handleAction('saved')}
          disabled={!user}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
            userAction?.action_type === 'saved'
              ? 'bg-primary text-white'
              : 'border border-primary text-primary hover:bg-primary hover:text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <SafeIcon icon={FiBookmark} className="text-sm" />
          <span>{userAction?.action_type === 'saved' ? 'Saved ✓' : 'Save Later'}</span>
        </button>
        
        <button 
          onClick={() => handleAction('passed')}
          disabled={!user}
          className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SafeIcon icon={FiX} className="text-sm" />
        </button>
      </div>

      {!user && (
        <p className="text-xs text-gray-500 text-center mt-2">
          Sign in to save jobs and track your applications
        </p>
      )}
    </motion.div>
  )
}

export default JobCard