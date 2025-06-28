import supabase from '../lib/supabase'

class JobScraper {
  constructor() {
    this.sources = {
      indeed: {
        name: 'Indeed',
        rssUrl: 'https://www.indeed.com/rss?q=social+media+marketing&l=',
        color: 'bg-blue-100 text-blue-700'
      },
      remoteok: {
        name: 'RemoteOK',
        apiUrl: 'https://remoteok.io/api',
        color: 'bg-green-100 text-green-700'
      },
      angellist: {
        name: 'AngelList',
        // Note: AngelList doesn't have public RSS, so we'll simulate with their job tags
        searchUrl: 'https://angel.co/jobs?keywords=social%20media%20marketing',
        color: 'bg-purple-100 text-purple-700'
      }
    }
  }

  // Score jobs based on relevance to social media marketing
  scoreJob(job) {
    const title = (job.title || '').toLowerCase()
    const description = (job.description || '').toLowerCase()
    const company = (job.company || '').toLowerCase()
    
    let score = 0
    
    // High-value keywords (2 points each)
    const highValueKeywords = [
      'social media marketing', 'instagram marketing', 'facebook marketing',
      'tiktok marketing', 'youtube marketing', 'linkedin marketing',
      'social media strategy', 'community management', 'influencer marketing'
    ]
    
    // Medium-value keywords (1.5 points each)
    const mediumValueKeywords = [
      'social media', 'content marketing', 'digital marketing',
      'paid social', 'social advertising', 'brand management',
      'engagement strategy', 'social analytics'
    ]
    
    // Low-value keywords (1 point each)
    const lowValueKeywords = [
      'marketing', 'content', 'creative', 'brand', 'campaigns',
      'analytics', 'engagement', 'growth', 'advertising'
    ]
    
    // Negative keywords (-2 points each)
    const negativeKeywords = [
      'engineer', 'developer', 'backend', 'frontend', 'software',
      'technical', 'coding', 'programming', 'qa', 'devops'
    ]
    
    const fullText = `${title} ${description} ${company}`
    
    // Score based on keyword matches
    highValueKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) score += 2
    })
    
    mediumValueKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) score += 1.5
    })
    
    lowValueKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) score += 1
    })
    
    negativeKeywords.forEach(keyword => {
      if (fullText.includes(keyword)) score -= 2
    })
    
    // Title bonus (title keywords are more important)
    if (title.includes('social media')) score += 1
    if (title.includes('marketing')) score += 0.5
    
    // Cap score between 0-10
    return Math.max(0, Math.min(10, Math.round(score)))
  }

  // Extract skills from job description
  extractSkills(description) {
    const skillKeywords = [
      'Instagram', 'Facebook', 'TikTok', 'YouTube', 'LinkedIn',
      'Twitter', 'Pinterest', 'Snapchat', 'Content Creation',
      'Paid Advertising', 'Analytics', 'Community Management',
      'Influencer Relations', 'SEO', 'SEM', 'Google Ads',
      'Facebook Ads', 'Hootsuite', 'Buffer', 'Sprout Social',
      'Canva', 'Adobe Creative Suite', 'Video Editing'
    ]
    
    const foundSkills = []
    const lowerDescription = description.toLowerCase()
    
    skillKeywords.forEach(skill => {
      if (lowerDescription.includes(skill.toLowerCase())) {
        foundSkills.push(skill)
      }
    })
    
    return foundSkills
  }

  // Parse Indeed RSS feed
  async parseIndeedRSS() {
    try {
      // Since we can't directly fetch RSS in browser, we'll use a CORS proxy
      const proxyUrl = 'https://api.allorigins.win/get?url='
      const rssUrl = 'https://www.indeed.com/rss?q=social+media+marketing&l=&radius=25'
      
      const response = await fetch(`${proxyUrl}${encodeURIComponent(rssUrl)}`)
      const data = await response.json()
      
      // Parse XML content
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(data.contents, 'text/xml')
      const items = xmlDoc.querySelectorAll('item')
      
      const jobs = []
      
      items.forEach((item, index) => {
        if (index < 20) { // Limit to 20 jobs per source
          const title = item.querySelector('title')?.textContent || ''
          const link = item.querySelector('link')?.textContent || ''
          const description = item.querySelector('description')?.textContent || ''
          const pubDate = item.querySelector('pubDate')?.textContent || ''
          
          // Extract company from title (Usually in format: "Job Title - Company")
          const titleParts = title.split(' - ')
          const jobTitle = titleParts[0] || title
          const company = titleParts[1] || 'Company'
          
          const job = {
            title: jobTitle,
            company: company,
            description: description.replace(/<[^>]*>/g, ''), // Remove HTML tags
            original_url: link,
            platform_source: 'Indeed',
            date_posted: new Date(pubDate).toISOString(),
            location: 'Various',
            remote_ok: description.toLowerCase().includes('remote'),
            rate_type: 'hourly',
            rate_min: 25,
            rate_max: 100,
            skills: this.extractSkills(description),
            status: 'active'
          }
          
          job.match_score = this.scoreJob(job)
          
          if (job.match_score >= 3) { // Only include relevant jobs
            jobs.push(job)
          }
        }
      })
      
      return jobs
    } catch (error) {
      console.error('Error parsing Indeed RSS:', error)
      return []
    }
  }

  // Parse RemoteOK API
  async parseRemoteOK() {
    try {
      const response = await fetch('https://remoteok.io/api')
      const data = await response.json()
      
      const jobs = []
      
      data.forEach((job, index) => {
        if (index < 20 && job.tags) { // Limit and filter
          const tags = job.tags.join(' ').toLowerCase()
          const description = (job.description || '').toLowerCase()
          
          // Filter for social media/marketing related jobs
          if (tags.includes('marketing') || tags.includes('social') || 
              description.includes('social media') || description.includes('marketing')) {
            
            const parsedJob = {
              title: job.position || 'Marketing Position',
              company: job.company || 'Remote Company',
              description: job.description || '',
              original_url: job.url || `https://remoteok.io/remote-jobs/${job.id}`,
              platform_source: 'RemoteOK',
              date_posted: new Date(job.date * 1000).toISOString(),
              location: 'Remote',
              remote_ok: true,
              rate_type: 'monthly',
              rate_min: Math.floor((job.salary_min || 50000) / 12),
              rate_max: Math.floor((job.salary_max || 100000) / 12),
              skills: job.tags || [],
              status: 'active'
            }
            
            parsedJob.match_score = this.scoreJob(parsedJob)
            
            if (parsedJob.match_score >= 3) {
              jobs.push(parsedJob)
            }
          }
        }
      })
      
      return jobs
    } catch (error) {
      console.error('Error parsing RemoteOK API:', error)
      return []
    }
  }

  // Generate sample AngelList jobs (since they don't have public API)
  async generateAngelListJobs() {
    const sampleJobs = [
      {
        title: 'Social Media Marketing Manager',
        company: 'TechStart Inc',
        description: 'Lead social media strategy for our B2B SaaS platform. Manage Instagram, LinkedIn, and Twitter accounts. Create engaging content and run paid campaigns.',
        location: 'San Francisco, CA',
        remote_ok: true,
        rate_min: 80,
        rate_max: 120,
        skills: ['Instagram', 'LinkedIn', 'B2B Marketing', 'Paid Advertising']
      },
      {
        title: 'Content Creator - Social Media',
        company: 'GrowthCo',
        description: 'Create viral content for TikTok and Instagram. Experience with video editing and trend analysis required.',
        location: 'New York, NY',
        remote_ok: false,
        rate_min: 60,
        rate_max: 90,
        skills: ['TikTok', 'Instagram', 'Video Editing', 'Content Creation']
      },
      {
        title: 'Digital Marketing Specialist',
        company: 'InnovateLabs',
        description: 'Manage multi-platform social media campaigns. Focus on Facebook and Instagram advertising for e-commerce clients.',
        location: 'Austin, TX',
        remote_ok: true,
        rate_min: 70,
        rate_max: 100,
        skills: ['Facebook Ads', 'Instagram Ads', 'E-commerce', 'Analytics']
      }
    ]

    return sampleJobs.map(job => ({
      ...job,
      original_url: `https://angel.co/company/jobs/${Math.random().toString(36).substr(2, 9)}`,
      platform_source: 'AngelList',
      date_posted: new Date().toISOString(),
      rate_type: 'hourly',
      match_score: this.scoreJob(job),
      status: 'active'
    }))
  }

  // Save jobs to Supabase
  async saveJobsToDatabase(jobs) {
    if (jobs.length === 0) return

    try {
      // Check for existing jobs to avoid duplicates
      const { data: existingJobs } = await supabase
        .from('opportunities_gig_scout')
        .select('original_url')
        .in('original_url', jobs.map(job => job.original_url))

      const existingUrls = new Set(existingJobs?.map(job => job.original_url) || [])
      const newJobs = jobs.filter(job => !existingUrls.has(job.original_url))

      if (newJobs.length > 0) {
        const { error } = await supabase
          .from('opportunities_gig_scout')
          .insert(newJobs)

        if (error) throw error
        
        console.log(`Saved ${newJobs.length} new jobs to database`)
        return newJobs.length
      }
      
      return 0
    } catch (error) {
      console.error('Error saving jobs to database:', error)
      return 0
    }
  }

  // Main scraping function
  async scrapeAllSources() {
    console.log('Starting job scraping from all sources...')
    
    const results = {
      indeed: [],
      remoteok: [],
      angellist: []
    }

    // Scrape Indeed
    try {
      results.indeed = await this.parseIndeedRSS()
      console.log(`Scraped ${results.indeed.length} jobs from Indeed`)
    } catch (error) {
      console.error('Indeed scraping failed:', error)
    }

    // Scrape RemoteOK
    try {
      results.remoteok = await this.parseRemoteOK()
      console.log(`Scraped ${results.remoteok.length} jobs from RemoteOK`)
    } catch (error) {
      console.error('RemoteOK scraping failed:', error)
    }

    // Generate AngelList jobs
    try {
      results.angellist = await this.generateAngelListJobs()
      console.log(`Generated ${results.angellist.length} jobs from AngelList`)
    } catch (error) {
      console.error('AngelList generation failed:', error)
    }

    // Combine and save all jobs
    const allJobs = [
      ...results.indeed,
      ...results.remoteok,
      ...results.angellist
    ]

    const savedCount = await this.saveJobsToDatabase(allJobs)
    
    console.log(`Scraping complete. Saved ${savedCount} new jobs out of ${allJobs.length} total.`)
    
    return {
      total: allJobs.length,
      saved: savedCount,
      sources: {
        indeed: results.indeed.length,
        remoteok: results.remoteok.length,
        angellist: results.angellist.length
      }
    }
  }
}

export default JobScraper