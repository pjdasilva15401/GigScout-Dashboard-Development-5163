import React, { useEffect, useState } from 'react'
import Dashboard from './components/Dashboard'
import jobScheduler from './services/jobScheduler'
import EmailScheduler from './services/emailScheduler'
import './App.css'

function App() {
  const [emailScheduler] = useState(() => new EmailScheduler())

  useEffect(() => {
    // Start the job scheduler when the app loads
    console.log('🚀 Starting GigScout with automatic job monitoring...')
    
    // Auto-start the job scheduler
    jobScheduler.startScheduler()
    
    // Start email scheduling
    console.log('📧 Starting email alert system...')
    emailScheduler.startEmailScheduling()

    // Cleanup on unmount
    return () => {
      jobScheduler.stopScheduler()
      emailScheduler.stopEmailScheduling()
    }
  }, [emailScheduler])

  return (
    <div className="App">
      <Dashboard />
    </div>
  )
}

export default App