import React, { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { useOpportunities } from '../hooks/useOpportunities'
import { useUserActions } from '../hooks/useUserActions'
import Header from './Header'
import SearchFilter from './SearchFilter'
import JobSection from './JobSection'
import OnboardingModal from './OnboardingModal'
import JobScrapingStatus from './JobScrapingStatus'
import supabase from '../lib/supabase'

const Dashboard = () => {
  const { user } = useAuth()
  const { opportunities, loading } = useOpportunities()
  const { userActions } = useUserActions()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [userPreferences, setUserPreferences] = useState(null)

  // Check if user needs onboarding
  useEffect(() => {
    if (user) {
      checkUserPreferences()
    }
  }, [user])

  const checkUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences_gig_scout')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (!data) {
        setShowOnboarding(true)
      } else {
        setUserPreferences(data)
      }
    } catch (err) {
      console.error('Error checking user preferences:', err)
    }
  }

  const filteredJobs = useMemo(() => {
    if (!opportunities) return []

    return opportunities.filter(job => {
      // Text search
      const matchesSearch = searchTerm === '' || 
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))

      // Location filter
      const matchesLocation = !filters.location || 
        (filters.location === 'remote' && job.remote_ok) ||
        job.location?.toLowerCase().includes(filters.location.replace('-', ' '))

      // Project type filter
      const matchesType = !filters.projectType || job.rate_type === filters.projectType

      // Rate filter
      const matchesRate = !filters.minRate || 
        (job.rate_min >= filters.minRate && job.rate_max <= filters.maxRate)

      // Match score filter
      const matchesScore = !filters.minMatchScore || job.match_score >= filters.minMatchScore

      // Date filter
      const matchesDate = !filters.datePosted || (() => {
        const jobDate = new Date(job.date_posted)
        const now = new Date()
        const diffInMs = now - jobDate
        const diffInHours = diffInMs / (1000 * 60 * 60)

        switch (filters.datePosted) {
          case '24h': return diffInHours <= 24
          case '7d': return diffInHours <= 168 // 7 * 24
          case '30d': return diffInHours <= 720 // 30 * 24
          default: return true
        }
      })()

      // Exclude passed jobs
      const isPassed = userActions.some(action => 
        action.opportunity_id === job.id && action.action_type === 'passed'
      )

      return matchesSearch && matchesLocation && matchesType && 
             matchesRate && matchesScore && matchesDate && !isPassed
    })
  }, [searchTerm, filters, opportunities, userActions])

  const categorizedJobs = useMemo(() => {
    const perfectMatches = filteredJobs.filter(job => job.match_score >= 8)
    const worthConsidering = filteredJobs.filter(job => job.match_score >= 6 && job.match_score < 8)
    const allOthers = filteredJobs.filter(job => job.match_score < 6)

    return { perfectMatches, worthConsidering, allOthers }
  }, [filteredJobs])

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  const handleFilter = (newFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearchTerm('')
  }

  const handleJobAction = (jobId, actionType) => {
    // This will trigger a re-render due to the userActions dependency in filteredJobs
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading opportunities...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Your Next Opportunity
          </h1>
          <p className="text-gray-600">
            {filteredJobs.length} social media marketing opportunities found
          </p>
        </motion.div>

        <JobScrapingStatus />

        <SearchFilter
          onSearch={handleSearch}
          onFilter={handleFilter}
          filters={filters}
          onClearFilters={handleClearFilters}
        />

        <div className="space-y-8">
          <JobSection
            title="Perfect Matches"
            jobs={categorizedJobs.perfectMatches}
            icon="🎯"
            onJobAction={handleJobAction}
          />
          
          <JobSection
            title="Worth Considering"
            jobs={categorizedJobs.worthConsidering}
            icon="💡"
            onJobAction={handleJobAction}
          />
          
          <JobSection
            title="All Opportunities"
            jobs={categorizedJobs.allOthers}
            icon="📋"
            onJobAction={handleJobAction}
          />
        </div>

        {filteredJobs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No opportunities found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters, or wait for the next scan
            </p>
          </motion.div>
        )}
      </main>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
    </div>
  )
}

export default Dashboard