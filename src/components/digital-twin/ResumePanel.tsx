'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, FileText, Briefcase, GraduationCap } from 'lucide-react'
import { useAIControl } from '@/contexts/AIControlContext'

export function ResumePanel() {
  const { activeComponents, toggleComponent, setMode, currentMode } = useAIControl()

  if (!activeComponents.resume || currentMode !== 'resume') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      >
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 0.5, type: 'spring', damping: 25 }}
          className="w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/20 p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <FileText className="w-8 h-8 text-purple-400" />
              <h2 className="text-4xl font-bold text-white">Resume</h2>
            </motion.div>
            <div className="flex items-center space-x-3">
              <motion.a
                href="/resume.pdf"
                download
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </motion.a>
              <button
                onClick={() => {
                  toggleComponent('resume', false)
                  setMode('chat')
                }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          {/* Resume content */}
          <div className="space-y-8">
            {/* Experience */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Experience</h3>
              </div>

              <div className="space-y-6">
                {[
                  {
                    title: 'Senior Full Stack Developer',
                    company: 'Tech Corp',
                    period: '2022 - Present',
                    description:
                      'Leading development of AI-powered applications and mentoring junior developers.',
                  },
                  {
                    title: 'Full Stack Developer',
                    company: 'Digital Solutions',
                    period: '2020 - 2022',
                    description:
                      'Built scalable web applications using React, Node.js, and cloud technologies.',
                  },
                ].map((job, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="pl-6 border-l-2 border-purple-500/50"
                  >
                    <h4 className="text-lg font-semibold text-white">{job.title}</h4>
                    <p className="text-purple-300 text-sm mb-2">
                      {job.company} • {job.period}
                    </p>
                    <p className="text-gray-300 text-sm">{job.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Education */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Education</h3>
              </div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="pl-6 border-l-2 border-purple-500/50"
              >
                <h4 className="text-lg font-semibold text-white">Bachelor of Computer Science</h4>
                <p className="text-purple-300 text-sm mb-2">University Name • 2016 - 2020</p>
                <p className="text-gray-300 text-sm">
                  Specialized in AI/ML and Software Engineering
                </p>
              </motion.div>
            </motion.section>

            {/* Skills Summary */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Core Competencies</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'React',
                  'Node.js',
                  'Python',
                  'TypeScript',
                  'AI/ML',
                  'Cloud Architecture',
                  'DevOps',
                  'System Design',
                ].map((skill, index) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 text-sm"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </motion.section>
          </div>

          {/* Glowing border animation */}
          <motion.div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(147, 51, 234, 0)',
                '0 0 30px 2px rgba(147, 51, 234, 0.3)',
                '0 0 0 0 rgba(147, 51, 234, 0)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
