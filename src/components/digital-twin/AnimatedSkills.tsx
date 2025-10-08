'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Code, Database, Brain, Cloud, Zap } from 'lucide-react'
import { useAIControl } from '@/contexts/AIControlContext'

const skillsData = [
  {
    category: 'Development',
    icon: <Code className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    skills: [
      'React',
      'Next.js',
      'TypeScript',
      'JavaScript',
      'Python',
      'Node.js',
      'HTML5',
      'CSS3',
      'Tailwind CSS',
      'Three.js',
    ],
  },
  {
    category: 'Databases & Cloud',
    icon: <Database className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-500',
    skills: [
      'MongoDB',
      'PostgreSQL',
      'MySQL',
      'Supabase',
      'Firebase',
      'AWS',
      'Docker',
      'Git/GitHub',
    ],
  },
  {
    category: 'AI Tools',
    icon: <Brain className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    skills: [
      'OpenAI API',
      'Claude API',
      'Prompt Engineering',
      'AI Agents',
      'RAG Systems',
      'LangChain',
      'ChatGPT Integration',
      'Deepgram API',
      'Voice AI',
      'Semantic Search',
    ],
  },
  {
    category: 'Security',
    icon: <Cloud className="w-6 h-6" />,
    color: 'from-orange-500 to-red-500',
    skills: [
      'Penetration Testing',
      'Vulnerability Assessment',
      'SIEM/Splunk',
      'Wireshark',
      'OWASP Top 10',
      'Network Security',
      'Security Auditing',
      'Threat Analysis',
    ],
  },
  {
    category: 'IT Support',
    icon: <Zap className="w-6 h-6" />,
    color: 'from-yellow-500 to-amber-500',
    skills: [
      'Help Desk Management',
      'Ticketing Systems',
      'Remote Support',
      'Hardware Troubleshooting',
      'System Administration',
      'Software Installation',
      'Windows Admin',
      'Customer Service',
    ],
  },
]

export function AnimatedSkills() {
  const { activeComponents, toggleComponent, currentMode, setMode } = useAIControl()

  if (!activeComponents.skills || currentMode !== 'skills') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="w-full max-w-5xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/20 p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-bold text-white"
            >
              Skills & Expertise
            </motion.h2>
            <button
              onClick={() => {
                toggleComponent('skills', false)
                setMode('chat')
              }}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Skills categories */}
          <div className="space-y-6">
            {skillsData.map((category, categoryIndex) => (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <motion.div
                    className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center text-white`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {category.icon}
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white">{category.category}</h3>
                </div>

                {/* Floating skill tags */}
                <div className="flex flex-wrap gap-3">
                  {category.skills.map((skill, skillIndex) => (
                    <motion.div
                      key={skill}
                      initial={{ opacity: 0, scale: 0, rotate: -180 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        rotate: 0,
                      }}
                      transition={{
                        duration: 0.5,
                        delay: categoryIndex * 0.1 + skillIndex * 0.05,
                        type: 'spring',
                        stiffness: 200,
                      }}
                      whileHover={{
                        scale: 1.1,
                        y: -5,
                        boxShadow: '0 10px 30px rgba(147, 51, 234, 0.5)',
                      }}
                      className={`px-4 py-2 bg-gradient-to-r ${category.color} rounded-full text-white font-medium shadow-lg cursor-pointer`}
                    >
                      {skill}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Floating animation hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center text-gray-400 text-sm mt-6"
          >
            💡 Hover over skills to interact
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
