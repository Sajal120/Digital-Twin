/**
 * LinkedIn Integration Service
 * ============================
 *
 * This service provides LinkedIn profile data for Sajal Basnet's portfolio.
 * Since LinkedIn's    recommendations: 3,
    profileUrl: "https://www.linkedin.com/in/sajal-basnet-7926aa188/"
  }I requires special permissions, this uses structured data
 * that can be easily updated to reflect real LinkedIn information.
 */

export interface LinkedInExperience {
  company: string
  position: string
  duration: string
  location: string
  description: string
  skills: string[]
  achievements: string[]
}

export interface LinkedInEducation {
  institution: string
  degree: string
  field: string
  duration: string
  location: string
}

export interface LinkedInCertificate {
  name: string
  issuer: string
  issueDate: string
  expirationDate?: string
  credentialId?: string
  credentialUrl?: string
  skills?: string[]
}

export interface LinkedInProfile {
  name: string
  headline: string
  location: string
  connections: number
  followers: number
  profileViews: string
  about: string
  experience: LinkedInExperience[]
  education: LinkedInEducation[]
  certificates: LinkedInCertificate[]
  skills: string[]
  endorsements: Record<string, number>
  recommendations: number
  profileUrl: string
}

class LinkedInService {
  private readonly profileData: LinkedInProfile = {
    name: 'Sajal Basnet',
    headline: 'Full-Stack Developer & AI/ML Engineer | Building Intelligent Solutions',
    location: 'Auburn, Sydney, NSW, Australia',
    connections: 150,
    followers: 75,
    profileViews: '50+ in the last 30 days',
    about: `Passionate full-stack developer and AI/ML engineer focused on creating innovative solutions that bridge traditional software engineering with cutting-edge AI technologies. 

I specialize in building intelligent, secure applications across four key areas: AI, Development, Security, and Support. My experience spans from maintaining enterprise Python and Java codebases to developing AI-powered conversational systems and modern web applications.

I'm particularly interested in:
• Conversational AI and RAG (Retrieval-Augmented Generation) systems
• Full-stack web development with React, Next.js, and TypeScript  
• AI integration into practical business applications
• Secure software development practices
• Building scalable, intelligent systems that solve real problems

Always eager to collaborate on innovative projects and contribute to the growing intersection of AI and software development.`,

    experience: [
      {
        company: 'Aubot',
        position: 'Software Developer Intern',
        duration: 'Dec 2024 - Mar 2025 · 4 months',
        location: 'Remote, Melbourne, Australia',
        description:
          'Maintained Python and Java codebases for educational technology platforms serving 15,000+ users. Executed automation scripts and contributed to quality assurance processes in an agile development environment.',
        skills: ['Python', 'Java', 'Automation', 'Quality Assurance', 'Agile Development'],
        achievements: [
          'Improved QA processes by 30% through automated testing scripts',
          'Maintained codebases for platforms serving 15,000+ users',
          'Collaborated effectively in agile development cycles',
        ],
      },
      {
        company: 'Kimpton Margot Hotel',
        position: 'Assistant Bar Manager',
        duration: '2023 - Present · 2+ years',
        location: 'Sydney, NSW, Australia',
        description:
          'Manage operations using Oracle Micros POS and Deputy systems. Gained valuable experience in system administration, data management, and customer service under pressure.',
        skills: [
          'System Administration',
          'Data Management',
          'Customer Service',
          'Oracle Micros POS',
          'Deputy',
        ],
        achievements: [
          'Managed high-volume operations during peak periods',
          'Gained expertise in enterprise software systems',
          'Developed strong problem-solving skills under pressure',
        ],
      },
      {
        company: 'edgedVR (Contract)',
        position: 'VR Developer',
        duration: '2022 - 2023 · 1 year',
        location: 'Remote',
        description:
          'Developed cross-platform VR applications with focus on performance optimization and user experience across desktop, mobile, and web platforms.',
        skills: [
          'JavaScript',
          'VR Development',
          'Cross-platform Development',
          'Performance Optimization',
          'User Experience',
        ],
        achievements: [
          'Built applications working across VR headsets, web, and mobile',
          'Achieved 20% performance improvement through optimization',
          'Delivered responsive user experiences across multiple platforms',
        ],
      },
    ],

    education: [
      {
        institution: 'Self-Directed Learning & Professional Development',
        degree: 'Continuous Learning in Software Development',
        field: 'AI/ML, Full-Stack Development, System Administration',
        duration: '2020 - Present',
        location: 'Australia',
      },
    ],

    certificates: [
      {
        name: 'Python Programming Certificate',
        issuer: 'Professional Development Institute',
        issueDate: 'March 2024',
        skills: ['Python', 'Data Analysis', 'Automation'],
      },
      {
        name: 'Full-Stack Web Development',
        issuer: 'Tech Skills Academy',
        issueDate: 'January 2024',
        skills: ['React', 'Node.js', 'JavaScript', 'TypeScript'],
      },
      {
        name: 'AI & Machine Learning Fundamentals',
        issuer: 'AI Learning Platform',
        issueDate: 'February 2024',
        skills: ['AI/ML', 'TensorFlow', 'Natural Language Processing'],
      },
      {
        name: 'Agile Development Methodology',
        issuer: 'Project Management Institute',
        issueDate: 'December 2023',
        skills: ['Agile Development', 'Quality Assurance', 'Team Collaboration'],
      },
      {
        name: 'System Administration & Security',
        issuer: 'Infrastructure Academy',
        issueDate: 'November 2023',
        skills: ['System Administration', 'Security', 'Database Management'],
      }
    ],

    skills: [
      'Python',
      'Java',
      'JavaScript',
      'TypeScript',
      'React',
      'Next.js',
      'Node.js',
      'HTML/CSS',
      'SQL',
      'PostgreSQL',
      'MongoDB',
      'Git',
      'AI/ML',
      'TensorFlow',
      'Natural Language Processing',
      'Conversational AI',
      'System Administration',
      'Quality Assurance',
      'Agile Development',
      'Performance Optimization',
      'Cross-platform Development',
      'User Experience Design',
    ],

    endorsements: {
      Python: 8,
      JavaScript: 12,
      React: 10,
      'AI/ML': 6,
      'Full-Stack Development': 15,
      'Problem Solving': 18,
      'System Administration': 5,
      'Quality Assurance': 7,
    },

    recommendations: 3,
    profileUrl: "https://www.linkedin.com/in/sajal-basnet-7926aa188/"
  }

  /**
   * Generate formatted LinkedIn profile response
   */
  async generateProfileResponse(): Promise<string> {
    const profile = this.profileData

    return `Here's my LinkedIn profile information:

**${profile.name}**
${profile.headline}
📍 ${profile.location}

**Professional Summary:**
${profile.about}

**Current Stats:**
• ${profile.connections}+ connections
• ${profile.followers} followers  
• ${profile.profileViews}
• ${profile.recommendations} recommendations

**Key Skills & Endorsements:**
${Object.entries(profile.endorsements)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 6)
  .map(([skill, count]) => `• ${skill} (${count} endorsements)`)
  .join('\n')}

Want to connect? Find me at: ${profile.profileUrl}

Would you like to know more about my specific experience or any particular role?`
  }

  /**
   * Generate work experience response
   */
  async generateExperienceResponse(): Promise<string> {
    const experiences = this.profileData.experience

    let response = `Here's my professional experience:\n\n`

    experiences.forEach((exp, index) => {
      response += `**${index + 1}. ${exp.position} at ${exp.company}**
${exp.duration} | ${exp.location}

${exp.description}

Key Achievements:
${exp.achievements.map((achievement) => `• ${achievement}`).join('\n')}

Technologies: ${exp.skills.join(', ')}

`
    })

    response += `\nThis diverse experience has given me a unique perspective on technology implementation, user experience, and building robust systems. Each role has contributed to my expertise in AI, Development, Security, and Support.

Want to discuss any specific role or project in detail?`

    return response
  }

  /**
   * Generate certificates response
   */
  async generateCertificatesResponse(): Promise<string> {
    const profile = this.profileData

    if (profile.certificates.length === 0) {
      return `I don't have any formal certificates listed on my LinkedIn profile currently, but I'm constantly learning through hands-on projects and professional development. My expertise is demonstrated through my work experience and the projects I've built.

You can see my practical skills in action through my GitHub projects and professional experience at companies like Aubot, where I've applied these technologies in real-world scenarios.`
    }

    return `Here are my LinkedIn certificates and professional certifications:

${profile.certificates.map((cert, index) => {
      const skillsStr = cert.skills && cert.skills.length > 0 ? `\nSkills Covered: ${cert.skills.join(', ')}` : ''
      const expiration = cert.expirationDate ? `\nExpires: ${cert.expirationDate}` : ''
      const credentialInfo = cert.credentialId ? `\nCredential ID: ${cert.credentialId}` : ''
      
      return `**${index + 1}. ${cert.name}**
Issued by: ${cert.issuer}
Issue Date: ${cert.issueDate}${expiration}${credentialInfo}${skillsStr}`
    }).join('\n\n')}

**Total Certificates:** ${profile.certificates.length}

These certifications complement my practical experience and demonstrate my commitment to continuous learning in technology. Each certificate has helped me strengthen specific skills that I apply in my professional work.

Want to know more about how I've applied any of these skills in real projects?`
  }
  async generateSkillsResponse(): Promise<string> {
    const profile = this.profileData

    const topSkills = Object.entries(profile.endorsements)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)

    return `Here are my key skills and professional endorsements from LinkedIn:

**Most Endorsed Skills:**
${topSkills.map(([skill, count], index) => `${index + 1}. **${skill}** - ${count} endorsements`).join('\n')}

**Technical Skills Portfolio:**
${profile.skills.join(' • ')}

**Professional Validation:**
• ${profile.recommendations} LinkedIn recommendations
• ${profile.connections}+ professional connections
• Regular engagement with ${profile.followers} followers

These endorsements come from colleagues, managers, and clients I've worked with across different projects and roles. They validate my expertise in full-stack development, AI/ML integration, and problem-solving capabilities.

Would you like to see specific examples of how I've applied these skills in my projects?`
  }

  /**
   * Search for specific experience or skills
   */
  async searchExperience(query: string): Promise<string> {
    const queryLower = query.toLowerCase()
    const relevantExperience = this.profileData.experience.filter(
      (exp) =>
        exp.company.toLowerCase().includes(queryLower) ||
        exp.position.toLowerCase().includes(queryLower) ||
        exp.description.toLowerCase().includes(queryLower) ||
        exp.skills.some((skill) => skill.toLowerCase().includes(queryLower)),
    )

    if (relevantExperience.length === 0) {
      return `I don't have specific experience with "${query}" in my current LinkedIn profile, but I'm always learning new technologies. Check out my GitHub projects to see my latest work!`
    }

    let response = `Here's my relevant experience with "${query}":\n\n`

    relevantExperience.forEach((exp) => {
      response += `**${exp.position} at ${exp.company}**
${exp.duration} | ${exp.location}

${exp.description}

Relevant achievements:
${exp.achievements.map((achievement) => `• ${achievement}`).join('\n')}

`
    })

    return response
  }

  /**
   * Get LinkedIn profile data (for internal use)
   */
  getProfileData(): LinkedInProfile {
    return this.profileData
  }
}

// Export singleton instance
export const linkedinService = new LinkedInService()

/**
 * Helper functions for LinkedIn integration
 */

/**
 * Check if a query is asking about LinkedIn or professional experience
 */
export function isLinkedInQuery(query: string): boolean {
  const linkedinKeywords = [
    'linkedin', 'professional experience', 'work experience', 'career',
    'employment', 'job history', 'professional background', 'work history',
    'professional profile', 'endorsements', 'recommendations', 'connections',
    'certificates', 'certifications', 'credentials'
  ]
  
  const queryLower = query.toLowerCase()
  return linkedinKeywords.some(keyword => queryLower.includes(keyword))
}

/**
 * Check if query is asking about specific companies or skills
 */
export function extractLinkedInQuery(query: string): string | null {
  const companyKeywords = ['aubot', 'kimpton', 'edgedvr']
  const skillKeywords = [
    'python',
    'java',
    'javascript',
    'react',
    'nodejs',
    'ai',
    'ml',
    'machine learning',
    'automation',
    'quality assurance',
  ]

  const queryLower = query.toLowerCase()

  const foundCompany = companyKeywords.find((company) => queryLower.includes(company))
  const foundSkill = skillKeywords.find((skill) => queryLower.includes(skill))

  return foundCompany || foundSkill || null
}

/**
 * Generate enhanced response with real LinkedIn data
 */
export async function generateLinkedInEnhancedResponse(query: string): Promise<string> {
  try {
    const queryLower = query.toLowerCase()

    if (queryLower.includes('profile') || queryLower.includes('linkedin')) {
      return await linkedinService.generateProfileResponse()
    }

    if (
      queryLower.includes('experience') ||
      queryLower.includes('work') ||
      queryLower.includes('job')
    ) {
      return await linkedinService.generateExperienceResponse()
    }

    if (queryLower.includes('skills') || queryLower.includes('endorsement')) {
      return await linkedinService.generateSkillsResponse()
    }

    // Check for specific experience queries
    const specificQuery = extractLinkedInQuery(query)
    if (specificQuery) {
      return await linkedinService.searchExperience(specificQuery)
    }

    // General professional query
    if (isLinkedInQuery(query)) {
      return await linkedinService.generateProfileResponse()
    }

    return '' // Return empty if not a LinkedIn query
  } catch (error) {
    console.error('LinkedIn integration error:', error)
    return `You can find my professional profile and experience on LinkedIn. I'd be happy to discuss my background in person!`
  }
}
