import JobScraper from './jobScraper'

class JobScheduler {
  constructor() {
    this.scraper = new JobScraper()
    this.intervalId = null
    this.isRunning = false
  }

  // Start automatic scraping every hour
  startScheduler() {
    if (this.isRunning) {
      console.log('Job scheduler is already running')
      return
    }

    console.log('Starting job scheduler - will run every hour')
    
    // Run immediately
    this.runScraping()
    
    // Then run every hour (3600000 ms)
    this.intervalId = setInterval(() => {
      this.runScraping()
    }, 3600000) // 1 hour
    
    this.isRunning = true
  }

  // Stop the scheduler
  stopScheduler() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.isRunning = false
      console.log('Job scheduler stopped')
    }
  }

  // Manual scraping trigger
  async runScraping() {
    try {
      console.log('Running scheduled job scraping...')
      const results = await this.scraper.scrapeAllSources()
      
      // Store last run info in localStorage for UI display
      const lastRun = {
        timestamp: new Date().toISOString(),
        results: results
      }
      
      localStorage.setItem('lastJobScrape', JSON.stringify(lastRun))
      
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('jobsUpdated', { detail: results }))
      
      return results
    } catch (error) {
      console.error('Error in scheduled scraping:', error)
      return null
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: JSON.parse(localStorage.getItem('lastJobScrape') || 'null')
    }
  }
}

// Create singleton instance
const jobScheduler = new JobScheduler()

export default jobScheduler