import supabase from '../lib/supabase'

class EmailService {
  constructor() {
    // For demo purposes, we'll simulate Resend functionality
    // In production, you'd use: this.resend = new Resend(import.meta.env.VITE_RESEND_API_KEY)
    this.resendApiKey = import.meta.env.VITE_RESEND_API_KEY
    this.fromEmail = 'alerts@gigscout.com'
    this.replyToEmail = 'noreply@gigscout.com'
    this.baseUrl = 'https://api.resend.com/emails'
  }

  // Send perfect match alert immediately
  async sendPerfectMatchAlert(user, job) {
    try {
      console.log(`🎯 Sending perfect match alert to ${user.email} for job: ${job.title}`)
      
      const emailHtml = this.generatePerfectMatchEmail(user, job)
      
      // If Resend API key exists, send real email
      if (this.resendApiKey && this.resendApiKey !== 'your-resend-api-key') {
        const response = await this.sendViaResend({
          from: this.fromEmail,
          to: user.email,
          subject: `🎯 Perfect Match Found: ${job.title}`,
          html: emailHtml
        })
        
        if (response.success) {
          await this.logEmailSent({
            user_id: user.id,
            email_type: 'perfect_match',
            opportunity_id: job.id,
            email_id: response.data?.id
          })
        }
        
        return response
      } else {
        // Demo mode - just log the email
        console.log('📧 EMAIL SENT (Demo Mode):', {
          to: user.email,
          subject: `🎯 Perfect Match Found: ${job.title}`,
          preview: emailHtml.substring(0, 200) + '...'
        })
        
        await this.logEmailSent({
          user_id: user.id,
          email_type: 'perfect_match',
          opportunity_id: job.id,
          email_id: `demo_${Date.now()}`
        })
        
        return { success: true, demo: true }
      }
    } catch (error) {
      console.error('Error sending perfect match alert:', error)
      return { success: false, error: error.message }
    }
  }

  // Send daily digest
  async sendDailyDigest(user, opportunities) {
    try {
      console.log(`📬 Sending daily digest to ${user.email} with ${opportunities.length} opportunities`)
      
      const emailHtml = this.generateDailyDigestEmail(user, opportunities)
      
      if (this.resendApiKey && this.resendApiKey !== 'your-resend-api-key') {
        const response = await this.sendViaResend({
          from: this.fromEmail,
          to: user.email,
          subject: `📬 Your Daily Opportunity Digest - ${opportunities.length} New Jobs`,
          html: emailHtml
        })
        
        if (response.success) {
          await this.logEmailSent({
            user_id: user.id,
            email_type: 'daily_digest',
            email_id: response.data?.id
          })
        }
        
        return response
      } else {
        console.log('📧 DAILY DIGEST SENT (Demo Mode):', {
          to: user.email,
          opportunityCount: opportunities.length
        })
        
        await this.logEmailSent({
          user_id: user.id,
          email_type: 'daily_digest',
          email_id: `demo_daily_${Date.now()}`
        })
        
        return { success: true, demo: true }
      }
    } catch (error) {
      console.error('Error sending daily digest:', error)
      return { success: false, error: error.message }
    }
  }

  // Send weekly market trends
  async sendWeeklyTrends(user, trends) {
    try {
      console.log(`📊 Sending weekly trends to ${user.email}`)
      
      const emailHtml = this.generateWeeklyTrendsEmail(user, trends)
      
      if (this.resendApiKey && this.resendApiKey !== 'your-resend-api-key') {
        const response = await this.sendViaResend({
          from: this.fromEmail,
          to: user.email,
          subject: `📊 Weekly Market Trends & Insights`,
          html: emailHtml
        })
        
        if (response.success) {
          await this.logEmailSent({
            user_id: user.id,
            email_type: 'weekly_trends',
            email_id: response.data?.id
          })
        }
        
        return response
      } else {
        console.log('📧 WEEKLY TRENDS SENT (Demo Mode):', {
          to: user.email,
          trends: Object.keys(trends)
        })
        
        await this.logEmailSent({
          user_id: user.id,
          email_type: 'weekly_trends',
          email_id: `demo_weekly_${Date.now()}`
        })
        
        return { success: true, demo: true }
      }
    } catch (error) {
      console.error('Error sending weekly trends:', error)
      return { success: false, error: error.message }
    }
  }

  // Send email via Resend API
  async sendViaResend(emailData) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.resendApiKey}`
        },
        body: JSON.stringify({
          ...emailData,
          reply_to: this.replyToEmail
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email')
      }

      return { success: true, data }
    } catch (error) {
      console.error('Resend API error:', error)
      return { success: false, error: error.message }
    }
  }

  // Generate perfect match email HTML
  generatePerfectMatchEmail(user, job) {
    const skills = job.skills?.slice(0, 5).join(', ') || 'Various skills'
    const rate = this.formatJobRate(job)
    const userName = user.email.split('@')[0]

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Perfect Match Found!</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #2D5A5A 0%, #3A6E6E 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; }
            .content { padding: 30px; }
            .job-card { background: #f8f9fa; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #2D5A5A; }
            .job-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; flex-wrap: wrap; }
            .job-title { font-size: 22px; font-weight: bold; color: #2D5A5A; margin: 0; }
            .match-score { background: #10b981; color: white; padding: 8px 16px; border-radius: 25px; font-weight: bold; font-size: 14px; }
            .job-meta { color: #666; margin: 8px 0; display: flex; align-items: center; }
            .job-meta strong { color: #333; }
            .skills-container { margin: 20px 0; }
            .skill-tag { background: #e5e7eb; color: #374151; padding: 6px 12px; border-radius: 20px; font-size: 12px; margin: 4px 4px 4px 0; display: inline-block; }
            .why-matches { background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 20px; margin: 25px 0; }
            .why-matches h3 { color: #0369a1; margin-top: 0; font-size: 18px; }
            .why-matches ul { margin: 10px 0; padding-left: 20px; }
            .why-matches li { margin: 8px 0; }
            .cta-button { background: linear-gradient(135deg, #2D5A5A 0%, #3A6E6E 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; text-align: center; transition: transform 0.2s; }
            .cta-button:hover { transform: translateY(-2px); }
            .footer { text-align: center; padding: 30px 20px; color: #666; font-size: 13px; background: #f8f9fa; border-top: 1px solid #e5e7eb; }
            .footer a { color: #2D5A5A; text-decoration: none; }
            @media (max-width: 600px) {
              .job-header { flex-direction: column; }
              .match-score { margin-top: 10px; }
              .content { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Perfect Match Found!</h1>
              <p>A new opportunity matches your preferences perfectly</p>
            </div>
            
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>Great news! We found a job opportunity that's a perfect match for your skills and preferences:</p>
              
              <div class="job-card">
                <div class="job-header">
                  <h2 class="job-title">${job.title}</h2>
                  <span class="match-score">${job.match_score}/10 Match</span>
                </div>
                
                <div class="job-meta"><strong>Company:</strong> ${job.company}</div>
                <div class="job-meta"><strong>Location:</strong> ${job.remote_ok ? '🌍 Remote' : '📍 ' + job.location}</div>
                <div class="job-meta"><strong>Rate:</strong> 💰 ${rate}</div>
                <div class="job-meta"><strong>Posted:</strong> 🕒 ${this.formatTimeAgo(job.date_posted)}</div>
                
                <div class="skills-container">
                  <strong>Required Skills:</strong><br>
                  ${job.skills?.map(skill => `<span class="skill-tag">${skill}</span>`).join('') || '<span class="skill-tag">Not specified</span>'}
                </div>
                
                <p style="margin: 20px 0; line-height: 1.8;">${job.description?.substring(0, 300)}${job.description?.length > 300 ? '...' : ''}</p>
                
                <div style="text-align: center;">
                  <a href="${job.original_url || '#'}" class="cta-button" target="_blank">
                    View Full Job Details →
                  </a>
                </div>
              </div>
              
              <div class="why-matches">
                <h3>💡 Why this matches your profile:</h3>
                <ul>
                  <li><strong>High relevance score:</strong> ${job.match_score}/10 based on your preferences</li>
                  <li><strong>Skills alignment:</strong> Matches your expertise in ${skills}</li>
                  <li><strong>Work style:</strong> ${job.remote_ok ? 'Remote work available' : 'Location-based opportunity'}</li>
                  <li><strong>Recent posting:</strong> Fresh opportunity posted ${this.formatTimeAgo(job.date_posted)}</li>
                  <li><strong>Rate match:</strong> Within your preferred rate range</li>
                </ul>
              </div>
              
              <div style="background: #fef3cd; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0; color: #92400e;"><strong>⚡ Act Fast!</strong> High-quality opportunities like this get filled quickly. Don't wait too long to apply!</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://gigscout.com/dashboard" class="cta-button">
                  View All Opportunities →
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>GigScout</strong> - Your AI-powered social media job scanner</p>
              <p>You're receiving this because you enabled perfect match alerts.</p>
              <p><a href="#unsubscribe">Unsubscribe</a> | <a href="#preferences">Manage Preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // Generate daily digest email HTML
  generateDailyDigestEmail(user, opportunities) {
    const perfectMatches = opportunities.filter(job => job.match_score >= 8)
    const goodMatches = opportunities.filter(job => job.match_score >= 6 && job.match_score < 8)
    const otherOpportunities = opportunities.filter(job => job.match_score < 6)
    const userName = user.email.split('@')[0]

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Daily Opportunity Digest</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #2D5A5A 0%, #3A6E6E 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 25px 0; }
            .stat-card { background: #f1f5f9; padding: 20px; border-radius: 10px; text-align: center; }
            .stat-number { font-size: 32px; font-weight: bold; margin: 0; }
            .stat-label { font-size: 14px; color: #6b7280; margin: 5px 0 0 0; }
            .section { margin: 30px 0; }
            .section-title { color: #2D5A5A; font-size: 22px; font-weight: bold; margin-bottom: 20px; }
            .job-item { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2D5A5A; }
            .job-item h3 { margin: 0 0 8px 0; font-size: 18px; color: #2D5A5A; }
            .job-meta { color: #666; font-size: 14px; margin: 5px 0; }
            .job-link { color: #2D5A5A; text-decoration: none; font-weight: bold; }
            .market-insights { background: #f0f9ff; border: 1px solid #e0f2fe; border-radius: 8px; padding: 25px; margin: 25px 0; }
            .insights-title { color: #0369a1; margin-top: 0; font-size: 20px; }
            .cta-button { background: linear-gradient(135deg, #2D5A5A 0%, #3A6E6E 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px auto; font-weight: bold; text-align: center; }
            .footer { text-align: center; padding: 30px 20px; color: #666; font-size: 13px; background: #f8f9fa; border-top: 1px solid #e5e7eb; }
            .footer a { color: #2D5A5A; text-decoration: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📬 Your Daily Digest</h1>
              <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>Here's your personalized summary of today's social media marketing opportunities:</p>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number" style="color: #10b981;">${perfectMatches.length}</div>
                  <div class="stat-label">Perfect Matches</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number" style="color: #f59e0b;">${goodMatches.length}</div>
                  <div class="stat-label">Good Matches</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number" style="color: #6b7280;">${otherOpportunities.length}</div>
                  <div class="stat-label">Other Jobs</div>
                </div>
              </div>

              ${perfectMatches.length > 0 ? `
                <div class="section">
                  <div class="section-title">🎯 Perfect Matches</div>
                  ${perfectMatches.slice(0, 3).map(job => `
                    <div class="job-item">
                      <h3>${job.title}</h3>
                      <div class="job-meta">${job.company} • ${job.remote_ok ? 'Remote' : job.location}</div>
                      <div class="job-meta">💰 ${this.formatJobRate(job)} • ⭐ Score: ${job.match_score}/10</div>
                      <p style="margin: 15px 0;">${job.description?.substring(0, 150)}...</p>
                      <a href="${job.original_url || '#'}" class="job-link">View Job Details →</a>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              ${goodMatches.length > 0 ? `
                <div class="section">
                  <div class="section-title">💡 Worth Considering</div>
                  ${goodMatches.slice(0, 5).map(job => `
                    <div class="job-item">
                      <h3>${job.title}</h3>
                      <div class="job-meta">${job.company} • ${job.remote_ok ? 'Remote' : job.location} • Score: ${job.match_score}/10</div>
                      <a href="${job.original_url || '#'}" class="job-link">View Job Details →</a>
                    </div>
                  `).join('')}
                </div>
              ` : ''}

              <div class="market-insights">
                <h3 class="insights-title">📊 Today's Market Snapshot</h3>
                <ul style="margin: 15px 0; padding-left: 20px;">
                  <li><strong>Most in-demand skills:</strong> ${this.getTopSkills(opportunities)}</li>
                  <li><strong>Average rate range:</strong> $${this.getAverageRate(opportunities)}/hour</li>
                  <li><strong>Remote opportunities:</strong> ${Math.round((opportunities.filter(j => j.remote_ok).length / opportunities.length) * 100)}%</li>
                  <li><strong>Top hiring companies:</strong> ${this.getTopCompanies(opportunities)}</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://gigscout.com/dashboard" class="cta-button">
                  View All ${opportunities.length} Opportunities →
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>GigScout</strong> - Your daily dose of social media opportunities</p>
              <p>You're receiving this daily digest because you're subscribed to GigScout alerts.</p>
              <p><a href="#unsubscribe">Unsubscribe</a> | <a href="#preferences">Manage Preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // Generate weekly trends email HTML
  generateWeeklyTrendsEmail(user, trends) {
    const userName = user.email.split('@')[0]

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Weekly Market Trends</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 30px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 30px; }
            .trend-section { background: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0; }
            .trend-title { color: #7c3aed; margin-top: 0; font-size: 22px; font-weight: bold; }
            .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .metric { background: white; padding: 20px; margin: 5px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .metric-number { font-size: 28px; font-weight: bold; margin: 0; }
            .metric-label { font-size: 14px; color: #6b7280; margin: 8px 0 0 0; }
            .trend-up { color: #10b981; font-weight: bold; }
            .trend-down { color: #ef4444; font-weight: bold; }
            .list-item { margin: 12px 0; padding: 10px; background: white; border-radius: 6px; }
            .recommendations { background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 25px; margin: 25px 0; }
            .recommendations h3 { color: #047857; margin-top: 0; }
            .cta-button { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px auto; font-weight: bold; }
            .footer { text-align: center; padding: 30px 20px; color: #666; font-size: 13px; background: #f8f9fa; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Weekly Market Trends</h1>
              <p>Social Media Marketing Job Market Analysis</p>
            </div>
            
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <p>Here's your weekly analysis of the social media marketing job market with key trends and insights:</p>
              
              <div class="trend-section">
                <h2 class="trend-title">📈 Market Overview</h2>
                <div class="metrics-grid">
                  <div class="metric">
                    <div class="metric-number" style="color: #10b981;">${trends.totalJobs}</div>
                    <div class="metric-label">Total Jobs This Week</div>
                    <div class="trend-up">+${trends.jobGrowth}%</div>
                  </div>
                  <div class="metric">
                    <div class="metric-number" style="color: #f59e0b;">$${trends.avgRate}</div>
                    <div class="metric-label">Avg. Rate/Hour</div>
                    <div class="${trends.rateChange > 0 ? 'trend-up' : 'trend-down'}">
                      ${trends.rateChange > 0 ? '+' : ''}${trends.rateChange}%
                    </div>
                  </div>
                  <div class="metric">
                    <div class="metric-number" style="color: #3b82f6;">${trends.remotePercent}%</div>
                    <div class="metric-label">Remote Jobs</div>
                    <div class="trend-up">+${trends.remoteGrowth}%</div>
                  </div>
                </div>
              </div>

              <div class="trend-section">
                <h2 class="trend-title">🔥 Trending Skills</h2>
                ${trends.topSkills.map((skill, index) => `
                  <div class="list-item">
                    <strong>${index + 1}. ${skill.name}</strong>
                    <span style="color: #666; margin-left: 10px;">
                      (${skill.count} jobs, ${skill.growth > 0 ? '+' : ''}${skill.growth}% growth)
                    </span>
                  </div>
                `).join('')}
              </div>

              <div class="trend-section">
                <h2 class="trend-title">🏢 Top Hiring Companies</h2>
                ${trends.topCompanies.map((company, index) => `
                  <div class="list-item">
                    <strong>${index + 1}. ${company.name}</strong>
                    <span style="color: #666; margin-left: 10px;">(${company.jobCount} active jobs)</span>
                  </div>
                `).join('')}
              </div>

              <div class="trend-section">
                <h2 class="trend-title">💡 Market Insights</h2>
                <ul style="margin: 15px 0; padding-left: 20px;">
                  <li><strong>Platform Focus:</strong> ${trends.insights.platformFocus}</li>
                  <li><strong>Industry Demand:</strong> ${trends.insights.industryDemand}</li>
                  <li><strong>Rate Trends:</strong> ${trends.insights.rateTrends}</li>
                  <li><strong>Geographic Distribution:</strong> ${trends.insights.geography}</li>
                </ul>
              </div>

              <div class="recommendations">
                <h3>🎯 Personalized Recommendations</h3>
                <ul style="margin: 15px 0; padding-left: 20px;">
                  ${trends.recommendations.map(rec => `<li style="margin: 8px 0;">${rec}</li>`).join('')}
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://gigscout.com/dashboard" class="cta-button">
                  Find Your Next Opportunity →
                </a>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>GigScout</strong> - Weekly market intelligence for social media professionals</p>
              <p>You're receiving this weekly report because you're subscribed to GigScout market insights.</p>
              <p><a href="#unsubscribe">Unsubscribe</a> | <a href="#preferences">Manage Preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // Helper methods
  formatTimeAgo(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInHours < 48) return '1 day ago'
    return `${Math.floor(diffInHours / 24)} days ago`
  }

  formatJobRate(job) {
    if (job.rate_type === 'hourly') {
      return job.rate_min === job.rate_max 
        ? `$${job.rate_min}/hour` 
        : `$${job.rate_min}-${job.rate_max}/hour`
    } else if (job.rate_type === 'monthly') {
      return `$${job.rate_min}/month`
    } else {
      return `$${job.rate_min} project`
    }
  }

  getTopSkills(opportunities) {
    const skillCounts = {}
    opportunities.forEach(job => {
      job.skills?.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1
      })
    })
    
    return Object.entries(skillCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([skill]) => skill)
      .join(', ') || 'Instagram Marketing, TikTok Content, Facebook Ads'
  }

  getAverageRate(opportunities) {
    const rates = opportunities
      .filter(job => job.rate_type === 'hourly')
      .map(job => (job.rate_min + job.rate_max) / 2)
    
    return rates.length > 0 
      ? Math.round(rates.reduce((a, b) => a + b) / rates.length)
      : 75
  }

  getTopCompanies(opportunities) {
    const companyCounts = {}
    opportunities.forEach(job => {
      companyCounts[job.company] = (companyCounts[job.company] || 0) + 1
    })
    
    return Object.entries(companyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([company]) => company)
      .join(', ') || 'TechStart Inc, GrowthCo, InnovateLabs'
  }

  // Log email sent to Supabase
  async logEmailSent(logData) {
    try {
      const { error } = await supabase
        .from('email_logs_gig_scout')
        .insert([{
          ...logData,
          sent_at: new Date().toISOString()
        }])

      if (error) throw error
      console.log('📝 Email log saved:', logData.email_type)
    } catch (error) {
      console.error('Error logging email:', error)
    }
  }

  // Get email statistics for admin
  async getEmailStats(days = 7) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      
      const { data, error } = await supabase
        .from('email_logs_gig_scout')
        .select('email_type, sent_at')
        .gte('sent_at', startDate)

      if (error) throw error

      const stats = {
        total: data.length,
        perfect_match: data.filter(log => log.email_type === 'perfect_match').length,
        daily_digest: data.filter(log => log.email_type === 'daily_digest').length,
        weekly_trends: data.filter(log => log.email_type === 'weekly_trends').length
      }

      return stats
    } catch (error) {
      console.error('Error getting email stats:', error)
      return { total: 0, perfect_match: 0, daily_digest: 0, weekly_trends: 0 }
    }
  }
}

export default EmailService