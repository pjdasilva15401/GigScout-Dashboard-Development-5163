import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import supabase from '../lib/supabase'
import SafeIcon from '../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiX, FiCheck } = FiIcons

const OnboardingModal = ({ isOpen, onClose }) => {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [preferences, setPreferences] = useState({
    skills: [],
    minRate: 50,
    maxRate: 150,
    industries: [],
    projectTypes: []
  })

  const skillOptions = [
    'Instagram Marketing',
    'TikTok Content',
    'Facebook Ads',
    'Content Strategy',
    'Community Management',
    'Paid Advertising',
    'Analytics & Reporting',
    'YouTube Marketing',
    'LinkedIn B2B',
    'Influencer Relations'
  ]

  const industryOptions = [
    'E-commerce',
    'Health & Wellness',
    'Tech/SaaS',
    'Fashion & Beauty',
    'Food & Beverage',
    'Non-profit',
    'Education',
    'Gaming',
    'Professional Services'
  ]

  const projectTypeOptions = [
    'One-time projects',
    'Monthly retainers',
    'Long-term contracts',
    'Hourly consulting'
  ]

  const handleSkillToggle = (skill) => {
    setPreferences(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const handleIndustryToggle = (industry) => {
    setPreferences(prev => ({
      ...prev,
      industries: prev.industries.includes(industry)
        ? prev.industries.filter(i => i !== industry)
        : [...prev.industries, industry]
    }))
  }

  const handleProjectTypeToggle = (type) => {
    setPreferences(prev => ({
      ...prev,
      projectTypes: prev.projectTypes.includes(type)
        ? prev.projectTypes.filter(t => t !== type)
        : [...prev.projectTypes, type]
    }))
  }

  const savePreferences = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_preferences_gig_scout')
        .upsert([{
          user_id: user.id,
          skills: preferences.skills,
          min_rate: preferences.minRate,
          max_rate: preferences.maxRate,
          industries: preferences.industries,
          project_types: preferences.projectTypes,
          updated_at: new Date().toISOString()
        }])

      if (error) throw error
      onClose()
    } catch (err) {
      console.error('Error saving preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (step < 4) setStep(step + 1)
    else savePreferences()
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Let's personalize your experience
                </h2>
                <p className="text-gray-600">Step {step} of 4</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <SafeIcon icon={FiX} className="text-xl" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${
                      i <= step ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {step === 1 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">What are your core skills?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {skillOptions.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      className={`p-3 text-left border rounded-lg transition-all ${
                        preferences.skills.includes(skill)
                          ? 'border-primary bg-primary-light bg-opacity-10 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{skill}</span>
                        {preferences.skills.includes(skill) && (
                          <SafeIcon icon={FiCheck} className="text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">What's your preferred rate range?</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Rate: ${preferences.minRate}/hour
                    </label>
                    <input
                      type="range"
                      min="25"
                      max="200"
                      value={preferences.minRate}
                      onChange={(e) => setPreferences(prev => ({ ...prev, minRate: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Rate: ${preferences.maxRate}/hour
                    </label>
                    <input
                      type="range"
                      min="25"
                      max="200"
                      value={preferences.maxRate}
                      onChange={(e) => setPreferences(prev => ({ ...prev, maxRate: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-center text-lg font-semibold text-gray-900">
                      ${preferences.minRate} - ${preferences.maxRate} per hour
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Which industries interest you?</h3>
                <div className="grid grid-cols-2 gap-3">
                  {industryOptions.map((industry) => (
                    <button
                      key={industry}
                      onClick={() => handleIndustryToggle(industry)}
                      className={`p-3 text-left border rounded-lg transition-all ${
                        preferences.industries.includes(industry)
                          ? 'border-primary bg-primary-light bg-opacity-10 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{industry}</span>
                        {preferences.industries.includes(industry) && (
                          <SafeIcon icon={FiCheck} className="text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">What project types do you prefer?</h3>
                <div className="space-y-3">
                  {projectTypeOptions.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleProjectTypeToggle(type)}
                      className={`w-full p-4 text-left border rounded-lg transition-all ${
                        preferences.projectTypes.includes(type)
                          ? 'border-primary bg-primary-light bg-opacity-10 text-primary'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{type}</span>
                        {preferences.projectTypes.includes(type) && (
                          <SafeIcon icon={FiCheck} className="text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={nextStep}
                disabled={loading}
                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : step === 4 ? 'Complete Setup' : 'Next'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default OnboardingModal