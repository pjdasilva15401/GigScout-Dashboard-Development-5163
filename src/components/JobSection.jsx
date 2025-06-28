import React from 'react'
import { motion } from 'framer-motion'
import JobCard from './JobCard'

const JobSection = ({ title, jobs, icon, onJobAction }) => {
  if (jobs.length === 0) return null

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-sm">
          {jobs.length}
        </span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {jobs.map((job, index) => (
          <JobCard 
            key={job.id} 
            job={job} 
            index={index} 
            onJobAction={onJobAction}
          />
        ))}
      </div>
    </motion.section>
  )
}

export default JobSection