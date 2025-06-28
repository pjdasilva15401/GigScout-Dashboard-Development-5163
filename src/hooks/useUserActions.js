import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import supabase from '../lib/supabase'

export const useUserActions = () => {
  const { user } = useAuth()
  const [userActions, setUserActions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchUserActions = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_actions_gig_scout')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      setUserActions(data || [])
    } catch (err) {
      console.error('Error fetching user actions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserActions()
  }, [user])

  const addUserAction = async (opportunityId, actionType) => {
    if (!user) return

    try {
      // Remove existing action for this opportunity
      await supabase
        .from('user_actions_gig_scout')
        .delete()
        .eq('user_id', user.id)
        .eq('opportunity_id', opportunityId)

      // Add new action
      const { data, error } = await supabase
        .from('user_actions_gig_scout')
        .insert([{
          user_id: user.id,
          opportunity_id: opportunityId,
          action_type: actionType
        }])
        .select()

      if (error) throw error

      // Update local state
      setUserActions(prev => [
        ...prev.filter(action => 
          !(action.user_id === user.id && action.opportunity_id === opportunityId)
        ),
        ...(data || [])
      ])

      return data
    } catch (err) {
      console.error('Error adding user action:', err)
      throw err
    }
  }

  const getUserActionForOpportunity = (opportunityId) => {
    return userActions.find(action => 
      action.opportunity_id === opportunityId && action.user_id === user?.id
    )
  }

  return {
    userActions,
    loading,
    addUserAction,
    getUserActionForOpportunity,
    refetch: fetchUserActions
  }
}