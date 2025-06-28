import EmailService from './emailService'
import supabase from '../lib/supabase'

class EmailScheduler {
  constructor() {
    this.emailService = new EmailService()
    this.intervals = {
      perfectMatch: null,
      dailyDigest: null,
      weeklyTrends: null
    }
    this.isRunning = false
  }

  // Start all email monitoring
  startEmailScheduling() {
    if (this.isRunning) {
      console.log('📧 Email scheduler already running')
      return
    }

    console.log('🔔 Starting email alert scheduling...')
    this.isRunning = true
    
    // Check for perfect matches every 15 minutes
    this.intervals.perfectMatch = setInterval(() => {
      this.checkPerfectMatches()
    }, 15 * 60 * 1000) // 15 minutes

    // Check for daily digests every hour
    this.intervals.dailyDigest = setInterval(() => {
      this.checkDailyDigest()
    }, 60 * 60 * 1000) // 1 hour

    // Check for weekly trends every 6 hours
    this.intervals.weeklyTrends = setInterval(() => {
      this.checkWeeklyTrends()
    }, 6 * 60 * 60 * 1000) // 6 hours

    // Run initial checks after a short delay
    setTimeout(() => {
      this.checkPerfectMatches()
      this.checkDailyDigest()
      this.checkWeeklyTrends()
    }, 5000) // 5 seconds delay
  }

  // Stop all email scheduling
  stopEmailScheduling() {
    Object.values(this.intervals).forEach(interval => {
      if (interval) clearInterval(interval)
    })
    this.isRunning = false
    console.log('🔕 Email scheduling stopped')
  }

  // Check for perfect matches to send immediate alerts
  async checkPerfectMatches() {
    try {
      console.log('🔍 Checking for perfect matches...')

      // Get users who want perfect match alerts
      const { data: users, error: usersError } = await supabase
        .from('user_preferences_gig_scout')
        .select(`
          user_id,
          skills,
          min_rate,
          max_rate,
          perfect_match_alerts
        `)
        .eq('perfect_match_alerts', true)

      if (usersError) {
        console.error('Error fetching users for perfect match alerts:', usersError)
        return
      }

      console.log(`👥 Found ${users.length} users with perfect match alerts enabled`)

      for (const userPref of users) {
        // Get user email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(userPref.user_id)
        if (!authUser.user?.email) continue

        // Get recent perfect matches (last 2 hours)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        
        const { data: perfectMatches, error: jobsError } = await supabase
          .from('opportunities_gig_scout')
          .select('*')
          .gte('match_score', 8)
          .gte('created_at', twoHoursAgo)
          .eq('status', 'active')

        if (jobsError) {
          console.error('Error fetching perfect match jobs:', jobsError)
          continue
        }

        console.log(`🎯 Found ${perfectMatches.length} perfect matches for user ${authUser.user.email}`)

        for (const job of perfectMatches) {
          // Check if we already sent alert for this job to this user
          const { data: existingAlert } = await supabase
            .from('email_logs_gig_scout')
            .select('id')
            .eq('user_id', userPref.user_id)
            .eq('opportunity_id', job.id)
            .eq('email_type', 'perfect_match')
            .single()

          if (!existingAlert && this.matchesUserPreferences(job, userPref)) {
            console.log(`📧 Sending perfect match alert for: ${job.title}`)
            
            await this.emailService.sendPerfectMatchAlert(
              { id: userPref.user_id, email: authUser.user.email },
              job
            )
          }
        }
      }
    } catch (error) {
      console.error('Error checking perfect matches:', error)
    }
  }

  // Check if it's time to send daily digest
  async checkDailyDigest() {
    try {
      const now = new Date()
      const hour = now.getHours()
      
      console.log(`📅 Checking daily digest at hour: ${hour}`)
      
      // Send between 8-9 AM
      if (hour !== 8) return

      console.log('⏰ Time for daily digests!')

      const { data: users, error: usersError } = await supabase
        .from('user_preferences_gig_scout')
        .select(`
          user_id,
          daily_digest,
          notification_time
        `)
        .eq('daily_digest', true)

      if (usersError) {
        console.error('Error fetching users for daily digest:', usersError)
        return
      }

      console.log(`👥 Found ${users.length} users with daily digest enabled`)

      for (const userPref of users) {
        // Check if we already sent digest today
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        
        const { data: existingDigest } = await supabase
          .from('email_logs_gig_scout')
          .select('id')
          .eq('user_id', userPref.user_id)
          .eq('email_type', 'daily_digest')
          .gte('sent_at', todayStart)
          .single()

        if (!existingDigest) {
          // Get user email
          const { data: authUser } = await supabase.auth.admin.getUserById(userPref.user_id)
          if (!authUser.user?.email) continue

          // Get yesterday's opportunities
          const yesterdayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
          
          const { data: opportunities, error: jobsError } = await supabase
            .from('opportunities_gig_scout')
            .select('*')
            .gte('created_at', yesterdayStart)
            .eq('status', 'active')
            .gte('match_score', 4) // Only include decent matches
            .order('match_score', { ascending: false })
            .limit(20)

          if (jobsError) {
            console.error('Error fetching opportunities for daily digest:', jobsError)
            continue
          }

          if (opportunities.length > 0) {
            console.log(`📧 Sending daily digest with ${opportunities.length} opportunities to ${authUser.user.email}`)
            
            await this.emailService.sendDailyDigest(
              { id: userPref.user_id, email: authUser.user.email },
              opportunities
            )
          }
        }
      }
    } catch (error) {
      console.error('Error sending daily digest:', error)
    }
  }

  // Check if it's Monday 9 AM for weekly trends
  async checkWeeklyTrends() {
    try {
      const now = new Date()
      const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday
      const hour = now.getHours()
      
      console.log(`📊 Checking weekly trends - Day: ${dayOfWeek}, Hour: ${hour}`)
      
      // Send on Mondays between 9-10 AM
      if (dayOfWeek !== 1 || hour !== 9) return

      console.log('📊 Time for weekly trends!')

      const { data: users, error: usersError } = await supabase
        .from('user_preferences_gig_scout')
        .select(`
          user_id,
          weekly_trends
        `)
        .eq('weekly_trends', true)

      if (usersError) {
        console.error('Error fetching users for weekly trends:', usersError)
        return
      }

      console.log(`👥 Found ${users.length} users with weekly trends enabled`)

      // Generate market trends for the week
      const trends = await this.generateWeeklyTrends()

      for (const userPref of users) {
        // Check if we already sent trends this week
        const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000).toISOString()
        
        const { data: existingTrends } = await supabase
          .from('email_logs_gig_scout')
          .select('id')
          .eq('user_id', userPref.user_id)
          .eq('email_type', 'weekly_trends')
          .gte('sent_at', weekStart)
          .single()

        if (!existingTrends) {
          // Get user email
          const { data: authUser } = await supabase.auth.admin.getUserById(userPref.user_id)
          if (!authUser.user?.email) continue

          console.log(`📧 Sending weekly trends to ${authUser.user.email}`)
          
          await this.emailService.sendWeeklyTrends(
            { id: userPref.user_id, email: authUser.user.email },
            trends
          )
        }
      }
    } catch (error) {
      console.error('Error sending weekly trends:', error)
    }
  }

  // Generate weekly market trends data
  async generateWeeklyTrends() {
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

      // Get this week's jobs
      const { data: thisWeekJobs } = await supabase
        .from('opportunities_gig_scout')
        .select('*')
        .gte('created_at', oneWeekAgo)
        .eq('status', 'active')

      // Get last week's jobs for comparison
      const { data: lastWeekJobs } = await supabase
        .from('opportunities_gig_scout')
        .select('*')
        .gte('created_at', twoWeeksAgo)
        .lt('created_at', oneWeekAgo)
        .eq('status', 'active')

      // Calculate trends
      const jobGrowth = lastWeekJobs?.length > 0 
        ? Math.round(((thisWeekJobs.length - lastWeekJobs.length) / lastWeekJobs.length) * 100)
        : 100

      const avgRate = this.calculateAverageRate(thisWeekJobs)
      const lastWeekAvgRate = this.calculateAverageRate(lastWeekJobs)
      const rateChange = lastWeekAvgRate > 0 
        ? Math.round(((avgRate - lastWeekAvgRate) / lastWeekAvgRate) * 100)
        : 0

      const remotePercent = thisWeekJobs.length > 0 
        ? Math.round((thisWeekJobs.filter(j => j.remote_ok).length / thisWeekJobs.length) * 100)
        : 67

      const lastWeekRemotePercent = lastWeekJobs?.length > 0
        ? Math.round((lastWeekJobs.filter(j => j.remote_ok).length / lastWeekJobs.length) * 100)
        : 60

      const remoteGrowth = remotePercent - lastWeekRemotePercent

      return {
        totalJobs: thisWeekJobs.length,
        jobGrowth,
        avgRate,
        rateChange,
        remotePercent,
        remoteGrowth,
        topSkills: this.getTopSkillsTrends(thisWeekJobs, lastWeekJobs),
        topCompanies: this.getTopCompanies(thisWeekJobs),
        insights: this.generateInsights(thisWeekJobs, lastWeekJobs),
        recommendations: this.generateRecommendations(thisWeekJobs)
      }
    } catch (error) {
      console.error('Error generating weekly trends:', error)
      return this.getDefaultTrends()
    }
  }

  // Helper methods
  matchesUserPreferences(job, userPref) {
    // Check if job matches user's skill preferences
    if (userPref.skills && userPref.skills.length > 0) {
      const hasMatchingSkill = job.skills?.some(skill => 
        userPref.skills.some(userSkill => 
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      )
      if (!hasMatchingSkill) return false
    }

    // Check rate preferences
    if (userPref.min_rate && job.rate_min < userPref.min_rate) return false
    if (userPref.max_rate && job.rate_max > userPref.max_rate) return false

    return true
  }

  calculateAverageRate(jobs) {
    if (!jobs || jobs.length === 0) return 75
    
    const hourlyJobs = jobs.filter(job => job.rate_type === 'hourly')
    if (hourlyJobs.length === 0) return 75
    
    const totalRate = hourlyJobs.reduce((sum, job) => sum + ((job.rate_min + job.rate_max) / 2), 0)
    return Math.round(totalRate / hourlyJobs.length)
  }

  getTopSkillsTrends(thisWeek, lastWeek) {
    if (!thisWeek || thisWeek.length === 0) {
      return [
        { name: 'Instagram Marketing', count: 15, growth: 20 },
        { name: 'TikTok Content', count: 12, growth: 25 },
        { name: 'Facebook Ads', count: 10, growth: 15 },
        { name: 'Content Creation', count: 8, growth: 10 },
        { name: 'Analytics', count: 6, growth: 5 }
      ]
    }

    // Count skills this week
    const thisWeekSkills = {}
    thisWeek.forEach(job => {
      job.skills?.forEach(skill => {
        thisWeekSkills[skill] = (thisWeekSkills[skill] || 0) + 1
      })
    })

    // Count skills last week
    const lastWeekSkills = {}
    lastWeek?.forEach(job => {
      job.skills?.forEach(skill => {
        lastWeekSkills[skill] = (lastWeekSkills[skill] || 0) + 1
      })
    })

    // Calculate growth and return top skills
    return Object.entries(thisWeekSkills)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([skill, count]) => ({
        name: skill,
        count,
        growth: lastWeekSkills[skill] 
          ? Math.round(((count - lastWeekSkills[skill]) / lastWeekSkills[skill]) * 100)
          : 100
      }))
  }

  getTopCompanies(jobs) {
    if (!jobs || jobs.length === 0) {
      return [
        { name: 'TechStart Inc', jobCount: 5 },
        { name: 'GrowthCo', jobCount: 4 },
        { name: 'InnovateLabs', jobCount: 3 }
      ]
    }

    const companyCounts = {}
    jobs.forEach(job => {
      companyCounts[job.company] = (companyCounts[job.company] || 0) + 1
    })

    return Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, jobCount]) => ({ name, jobCount }))
  }

  generateInsights(thisWeek, lastWeek) {
    const topSkill = this.getTopSkillsTrends(thisWeek, lastWeek)[0]?.name || 'Instagram Marketing'
    const avgRate = this.calculateAverageRate(thisWeek)
    const remotePercent = thisWeek?.length > 0 
      ? Math.round((thisWeek.filter(j => j.remote_ok).length / thisWeek.length) * 100)
      : 67

    return {
      platformFocus: `${topSkill} continues to dominate job requirements`,
      industryDemand: 'E-commerce and SaaS companies showing highest demand',
      rateTrends: `Average hourly rates ${avgRate > 75 ? 'increased' : 'remained stable'} at $${avgRate}/hour`,
      geography: `${remotePercent}% of opportunities offer remote work options`
    }
  }

  generateRecommendations(jobs) {
    const recommendations = [
      'Focus on building a strong portfolio showcasing Instagram and TikTok content',
      'Consider specializing in video content creation as demand is growing',
      'Remote opportunities are abundant - expand your search globally'
    ]

    if (jobs && jobs.length > 0) {
      // Add dynamic recommendations based on data
      const topSkill = jobs.reduce((acc, job) => {
        job.skills?.forEach(skill => {
          acc[skill] = (acc[skill] || 0) + 1
        })
        return acc
      }, {})

      const mostDemandedSkill = Object.entries(topSkill).sort(([,a], [,b]) => b - a)[0]?.[0]
      if (mostDemandedSkill) {
        recommendations.push(`Consider upskilling in ${mostDemandedSkill} - it's currently in high demand`)
      }
    }

    return recommendations
  }

  getDefaultTrends() {
    return {
      totalJobs: 156,
      jobGrowth: 12,
      avgRate: 78,
      rateChange: 5,
      remotePercent: 67,
      remoteGrowth: 8,
      topSkills: [
        { name: 'Instagram Marketing', count: 45, growth: 15 },
        { name: 'TikTok Content', count: 38, growth: 22 },
        { name: 'Facebook Ads', count: 32, growth: 8 },
        { name: 'Content Creation', count: 28, growth: 12 },
        { name: 'Analytics', count: 24, growth: 6 }
      ],
      topCompanies: [
        { name: 'TechStart Inc', jobCount: 8 },
        { name: 'GrowthCo', jobCount: 6 },
        { name: 'InnovateLabs', jobCount: 5 }
      ],
      insights: {
        platformFocus: 'Instagram Marketing continues to dominate job requirements',
        industryDemand: 'E-commerce and SaaS companies showing highest demand',
        rateTrends: 'Average hourly rates increased to $78/hour',
        geography: '67% of opportunities offer remote work options'
      },
      recommendations: [
        'Focus on building a strong portfolio showcasing Instagram and TikTok content',
        'Consider specializing in video content creation as demand is growing',
        'Remote opportunities are abundant - expand your search globally',
        'Consider upskilling in TikTok Content - it\'s currently in high demand'
      ]
    }
  }

  // Get email scheduler status for admin
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervals: Object.keys(this.intervals).reduce((acc, key) => {
        acc[key] = !!this.intervals[key]
        return acc
      }, {})
    }
  }

  // Manual trigger for testing
  async triggerPerfectMatchTest() {
    console.log('🧪 Testing perfect match alerts...')
    await this.checkPerfectMatches()
  }

  async triggerDailyDigestTest() {
    console.log('🧪 Testing daily digest...')
    await this.checkDailyDigest()
  }

  async triggerWeeklyTrendsTest() {
    console.log('🧪 Testing weekly trends...')
    await this.checkWeeklyTrends()
  }
}

export default EmailScheduler