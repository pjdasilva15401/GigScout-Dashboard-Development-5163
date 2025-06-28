import { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export const useOpportunities = () => {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('opportunities_gig_scout')
        .select('*')
        .eq('status', 'active')
        .order('date_posted', { ascending: false })
        .limit(100) // Limit to prevent too many results

      if (error) throw error
      setOpportunities(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()

    // Listen for job updates from scraper
    const handleJobsUpdated = () => {
      fetchOpportunities()
    }

    window.addEventListener('jobsUpdated', handleJobsUpdated)

    // Set up real-time subscription for new opportunities
    const subscription = supabase
      .channel('opportunities_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'opportunities_gig_scout'
        },
        (payload) => {
          setOpportunities(prev => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener('jobsUpdated', handleJobsUpdated)
      subscription.unsubscribe()
    }
  }, [])

  return { opportunities, loading, error, refetch: fetchOpportunities }
}