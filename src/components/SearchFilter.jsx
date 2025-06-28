import React, { useState } from 'react'
import { motion } from 'framer-motion'
import SafeIcon from '../common/SafeIcon'
import * as FiIcons from 'react-icons/fi'

const { FiSearch, FiFilter, FiX } = FiIcons

const SearchFilter = ({ onSearch, onFilter, filters, onClearFilters }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    onSearch(e.target.value)
  }

  const handleLocationChange = (e) => {
    onFilter({ ...filters, location: e.target.value })
  }

  const handleTypeChange = (e) => {
    onFilter({ ...filters, projectType: e.target.value })
  }

  const handleRateRangeChange = (e) => {
    const [min, max] = e.target.value.split('-').map(Number)
    onFilter({ ...filters, minRate: min, maxRate: max })
  }

  const handleMatchScoreChange = (e) => {
    onFilter({ ...filters, minMatchScore: Number(e.target.value) })
  }

  const handleDatePostedChange = (e) => {
    onFilter({ ...filters, datePosted: e.target.value })
  }

  const clearAllFilters = () => {
    setSearchTerm('')
    onClearFilters()
  }

  const hasActiveFilters = filters.location || filters.projectType || filters.minRate || filters.minMatchScore || filters.datePosted

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6"
    >
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <SafeIcon icon={FiSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for jobs, companies, or skills..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters || hasActiveFilters 
                ? 'border-primary bg-primary text-white' 
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <SafeIcon icon={FiFilter} className={showFilters || hasActiveFilters ? 'text-white' : 'text-gray-500'} />
            <span className={showFilters || hasActiveFilters ? 'text-white' : 'text-gray-700'}>Filters</span>
          </button>
          
          <select 
            value={filters.location || ''} 
            onChange={handleLocationChange}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Locations</option>
            <option value="remote">Remote</option>
            <option value="new-york">New York</option>
            <option value="san-francisco">San Francisco</option>
            <option value="los-angeles">Los Angeles</option>
          </select>
          
          <select 
            value={filters.projectType || ''} 
            onChange={handleTypeChange}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            <option value="hourly">Hourly</option>
            <option value="project">Project</option>
            <option value="monthly">Monthly</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-red-600 transition-colors"
              title="Clear all filters"
            >
              <SafeIcon icon={FiX} />
              <span className="hidden sm:block">Clear</span>
            </button>
          )}
        </div>
      </div>
      
      {showFilters && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="mt-4 pt-4 border-t border-gray-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate Range</label>
              <select 
                value={filters.minRate ? `${filters.minRate}-${filters.maxRate}` : ''} 
                onChange={handleRateRangeChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Any Rate</option>
                <option value="25-50">$25-50/hr</option>
                <option value="50-75">$50-75/hr</option>
                <option value="75-100">$75-100/hr</option>
                <option value="100-200">$100+/hr</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Match Score</label>
              <select 
                value={filters.minMatchScore || ''} 
                onChange={handleMatchScoreChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Any Score</option>
                <option value="8">8+ (Excellent)</option>
                <option value="6">6+ (Good)</option>
                <option value="4">4+ (Fair)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Posted</label>
              <select 
                value={filters.datePosted || ''} 
                onChange={handleDatePostedChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Any time</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last week</option>
                <option value="30d">Last month</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default SearchFilter