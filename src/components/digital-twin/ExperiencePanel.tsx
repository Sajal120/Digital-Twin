'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useAIControl } from '@/contexts/AIControlContext'
import { X, Briefcase, Calendar, MapPin, TrendingUp } from 'lucide-react'

const experiences = [
  {
    id: 1,
    title: 'Software Developer Intern',
    company: 'Aubot',
    location: 'Melbourne, VIC',
    period: 'December 2024 - March 2025',
    type: 'Internship',
    description:
      'Developed and maintained software solutions for robotics applications, focusing on web interfaces and automation.',
    achievements: [
      'Built responsive web interfaces for robot control systems',
      'Implemented real-time data visualization dashboards',
      'Collaborated with cross-functional teams on IoT integration',
      'Optimized application performance and user experience',
    ],
    technologies: ['React', 'TypeScript', 'Node.js', 'WebSockets', 'IoT', 'Robotics'],
    delay: 0.2,
  },
  {
    id: 2,
    title: 'Web Developer',
    company: 'edgedVR',
    location: 'Melbourne, VIC',
    period: 'January 2023 - December 2023',
    type: 'Contract',
    description:
      'Specialized in creating immersive VR experiences and web applications for virtual reality platforms.',
    achievements: [
      'Developed VR-compatible web applications using Three.js',
      'Created interactive 3D environments and user interfaces',
      'Implemented WebXR APIs for cross-platform VR support',
      'Optimized 3D assets and rendering performance',
    ],
    technologies: ['Three.js', 'WebXR', 'JavaScript', 'React', 'Blender', 'VR'],
    delay: 0.3,
  },
  {
    id: 3,
    title: 'Assistant Bar Manager',
    company: 'Kimpton Margot Sydney',
    location: 'Sydney, NSW',
    period: 'March 2022 - Present',
    type: 'Full-time',
    description:
      'Manage bar operations, lead team training, and ensure exceptional guest experiences at a luxury hotel.',
    achievements: [
      'Lead team of 15+ bar staff with focus on service excellence',
      'Manage inventory, ordering, and supplier relationships',
      'Increased guest satisfaction scores by 25%',
      'Developed training programs for cocktail preparation and customer service',
    ],
    technologies: [
      'Leadership',
      'Operations',
      'Customer Service',
      'Team Management',
      'Hospitality',
    ],
    delay: 0.4,
  },
]

const getTechColor = (tech: string) => {
  const colors: { [key: string]: string } = {
    React: 'from-blue-500 to-cyan-500',
    TypeScript: 'from-blue-600 to-blue-400',
    'Node.js': 'from-green-600 to-green-400',
    'Three.js': 'from-purple-500 to-pink-500',
    WebXR: 'from-indigo-500 to-purple-500',
    JavaScript: 'from-yellow-500 to-orange-500',
    VR: 'from-pink-500 to-rose-500',
    IoT: 'from-teal-500 to-cyan-500',
    Robotics: 'from-gray-600 to-gray-400',
    WebSockets: 'from-green-500 to-emerald-500',
    Blender: 'from-orange-500 to-amber-500',
    Leadership: 'from-purple-600 to-indigo-600',
    Operations: 'from-blue-700 to-blue-500',
    'Customer Service': 'from-pink-600 to-rose-500',
    'Team Management': 'from-violet-600 to-purple-500',
    Hospitality: 'from-red-500 to-pink-500',
  }
  return colors[tech] || 'from-gray-500 to-gray-400'
}

export function ExperiencePanel() {
  const { activeComponents, toggleComponent } = useAIControl()

  const handleClose = () => {
    toggleComponent('experience', false)
    toggleComponent('chat', true)
  }

  return (
    <AnimatePresence>
      {activeComponents.experience && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 rounded-3xl border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <motion.button
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </motion.button>

            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-gray-900 to-transparent p-8 pb-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 mb-2"
              >
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                  <Briefcase className="w-6 h-6 text-purple-400" />
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Professional Experience
                </h2>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="text-gray-400 text-lg"
              >
                A timeline of my career journey across software development and hospitality
                management
              </motion.p>
            </div>

            {/* Experience Cards */}
            <div className="p-8 pt-4 space-y-8">
              {/* Timeline */}
              <div className="relative">
                {/* Timeline line */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-purple-500 origin-top"
                />

                {/* Experience items */}
                <div className="space-y-12">
                  {experiences.map((exp) => (
                    <motion.div
                      key={exp.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: exp.delay, type: 'spring', damping: 20 }}
                      className="relative pl-20"
                    >
                      {/* Timeline dot */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: exp.delay + 0.2, type: 'spring', damping: 15 }}
                        className="absolute left-6 top-6 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-gray-900 shadow-lg shadow-purple-500/50"
                      />

                      {/* Card */}
                      <motion.div
                        whileHover={{ scale: 1.02, y: -4 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10"
                      >
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-white mb-1">{exp.title}</h3>
                            <p className="text-xl text-purple-400 font-medium">{exp.company}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span className="text-sm">{exp.period}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">{exp.location}</span>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium w-fit">
                              {exp.type}
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-300 mb-4 leading-relaxed">{exp.description}</p>

                        {/* Achievements */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            <h4 className="text-sm font-semibold text-white uppercase tracking-wide">
                              Key Achievements
                            </h4>
                          </div>
                          <ul className="space-y-2">
                            {exp.achievements.map((achievement, idx) => (
                              <motion.li
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: exp.delay + 0.3 + idx * 0.1 }}
                                className="flex items-start gap-2 text-gray-400 text-sm"
                              >
                                <span className="text-purple-400 mt-1">▸</span>
                                <span>{achievement}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </div>

                        {/* Technologies */}
                        <div>
                          <h4 className="text-sm font-semibold text-white uppercase tracking-wide mb-3">
                            Technologies & Skills
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {exp.technologies.map((tech, idx) => (
                              <motion.span
                                key={tech}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: exp.delay + 0.4 + idx * 0.05 }}
                                whileHover={{ scale: 1.1, y: -2 }}
                                className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${getTechColor(
                                  tech,
                                )} text-white text-xs font-medium shadow-lg cursor-default`}
                              >
                                {tech}
                              </motion.span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="p-8 pt-4 border-t border-white/5"
            >
              <p className="text-center text-gray-500 text-sm">
                Want to learn more about my work?{' '}
                <button
                  onClick={() => {
                    toggleComponent('experience', false)
                    toggleComponent('contact', true)
                  }}
                  className="text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
                >
                  Get in touch
                </button>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
