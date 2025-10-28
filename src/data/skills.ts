export interface Skill {
  name: string
  icon: string
  level: number
  category: 'AI Tools' | 'Development' | 'Security' | 'IT Support'
}

export const skills: Skill[] = [
  // AI Tools (22 skills)
  { name: 'AI Agents', icon: '🤖', level: 92, category: 'AI Tools' },
  { name: 'OpenAI API', icon: '🧠', level: 95, category: 'AI Tools' },
  { name: 'Claude API', icon: '🎭', level: 90, category: 'AI Tools' },
  { name: 'Prompt Engineering', icon: '🎯', level: 95, category: 'AI Tools' },
  { name: 'AI-Assisted Coding', icon: '💻', level: 92, category: 'AI Tools' },
  { name: 'LangChain', icon: '⛓️', level: 85, category: 'AI Tools' },
  { name: 'Hugging Face', icon: '🤗', level: 80, category: 'AI Tools' },
  { name: 'RAG Systems', icon: '📚', level: 88, category: 'AI Tools' },
  { name: 'Vector Databases', icon: '🔢', level: 85, category: 'AI Tools' },
  { name: 'ChatGPT Integration', icon: '💬', level: 95, category: 'AI Tools' },
  { name: 'AI Workflow Automation', icon: '⚡', level: 90, category: 'AI Tools' },
  { name: 'Machine Learning', icon: '🎓', level: 82, category: 'AI Tools' },
  { name: 'Natural Language Processing', icon: '📝', level: 85, category: 'AI Tools' },
  { name: 'AI Content Generation', icon: '✨', level: 90, category: 'AI Tools' },
  { name: 'AI Model Fine-tuning', icon: '🎛️', level: 78, category: 'AI Tools' },
  { name: 'Deepgram API', icon: '🎙️', level: 88, category: 'AI Tools' },
  { name: 'Voice AI', icon: '🗣️', level: 85, category: 'AI Tools' },
  { name: 'AI Document Analysis', icon: '📄', level: 87, category: 'AI Tools' },
  { name: 'Semantic Search', icon: '🔍', level: 88, category: 'AI Tools' },
  { name: 'AI Ethics', icon: '⚖️', level: 80, category: 'AI Tools' },
  { name: 'AI Testing', icon: '🧪', level: 83, category: 'AI Tools' },
  { name: 'AI Deployment', icon: '🚀', level: 85, category: 'AI Tools' },

  // Development (23 skills)
  { name: 'JavaScript', icon: '📜', level: 95, category: 'Development' },
  { name: 'React', icon: '⚛️', level: 95, category: 'Development' },
  { name: 'TypeScript', icon: '🔷', level: 88, category: 'Development' },
  { name: 'Python', icon: '🐍', level: 88, category: 'Development' },
  { name: 'Node.js', icon: '💚', level: 90, category: 'Development' },
  { name: 'Next.js', icon: '▲', level: 88, category: 'Development' },
  { name: 'HTML5', icon: '🌐', level: 98, category: 'Development' },
  { name: 'CSS3', icon: '🎨', level: 95, category: 'Development' },
  { name: 'Tailwind CSS', icon: '💨', level: 92, category: 'Development' },
  { name: 'Supabase', icon: '⚡', level: 90, category: 'Development' },
  { name: 'Firebase', icon: '🔥', level: 88, category: 'Development' },
  { name: 'MongoDB', icon: '🍃', level: 85, category: 'Development' },
  { name: 'MySQL', icon: '🐬', level: 85, category: 'Development' },
  { name: 'PostgreSQL', icon: '🐘', level: 88, category: 'Development' },
  { name: 'REST APIs', icon: '🔌', level: 92, category: 'Development' },
  { name: 'GraphQL', icon: '📊', level: 80, category: 'Development' },
  { name: 'Git/GitHub', icon: '🐙', level: 92, category: 'Development' },
  { name: 'Docker', icon: '🐳', level: 82, category: 'Development' },
  { name: 'AWS', icon: '☁️', level: 85, category: 'Development' },
  { name: 'Vercel', icon: '▲', level: 90, category: 'Development' },
  { name: 'Redis', icon: '🔴', level: 80, category: 'Development' },
  { name: 'Terraform', icon: '🏗️', level: 80, category: 'Development' },
  { name: 'Three.js', icon: '🎮', level: 82, category: 'Development' },

  // Security (13 skills)
  { name: 'Penetration Testing', icon: '🔓', level: 88, category: 'Security' },
  { name: 'Vulnerability Assessment', icon: '🛡️', level: 85, category: 'Security' },
  { name: 'SIEM/Splunk', icon: '📊', level: 80, category: 'Security' },
  { name: 'Wireshark', icon: '🦈', level: 82, category: 'Security' },
  { name: 'Nessus', icon: '🔍', level: 80, category: 'Security' },
  { name: 'Burp Suite', icon: '🕷️', level: 78, category: 'Security' },
  { name: 'OWASP Top 10', icon: '🔟', level: 88, category: 'Security' },
  { name: 'Network Security', icon: '🌐', level: 85, category: 'Security' },
  { name: 'Security Auditing', icon: '🔐', level: 83, category: 'Security' },
  { name: 'Threat Analysis', icon: '⚠️', level: 85, category: 'Security' },
  { name: 'Incident Response', icon: '🚨', level: 82, category: 'Security' },
  { name: 'Compliance (ISO/NIST)', icon: '📋', level: 80, category: 'Security' },
  { name: 'Security Best Practices', icon: '✅', level: 88, category: 'Security' },

  // IT Support (10 skills)
  { name: 'Help Desk Management', icon: '🎧', level: 95, category: 'IT Support' },
  { name: 'Ticketing Systems', icon: '🎫', level: 92, category: 'IT Support' },
  { name: 'Remote Support', icon: '🖥️', level: 90, category: 'IT Support' },
  { name: 'Hardware Troubleshooting', icon: '🔧', level: 88, category: 'IT Support' },
  { name: 'System Administration', icon: '⚙️', level: 88, category: 'IT Support' },
  { name: 'Software Installation', icon: '💿', level: 92, category: 'IT Support' },
  { name: 'Windows Admin', icon: '🪟', level: 90, category: 'IT Support' },
  { name: 'macOS Support', icon: '🍎', level: 85, category: 'IT Support' },
  { name: 'Network Configuration', icon: '🌐', level: 85, category: 'IT Support' },
  { name: 'Customer Service', icon: '🤝', level: 95, category: 'IT Support' },
]

// Category definitions
export const skillCategories = ['All', 'AI Tools', 'Development', 'Security', 'IT Support'] as const

export type SkillCategory = (typeof skillCategories)[number]

// Get skills by category
export const getSkillsByCategory = (category: SkillCategory): Skill[] => {
  if (category === 'All') {
    return skills
  }
  return skills.filter((skill) => skill.category === category)
}

// Get category color
export const getCategoryColor = (category: Skill['category']): string => {
  const colors = {
    'AI Tools': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Development: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Security: 'bg-red-500/20 text-red-300 border-red-500/30',
    'IT Support': 'bg-green-500/20 text-green-300 border-green-500/30',
  }
  return colors[category]
}
