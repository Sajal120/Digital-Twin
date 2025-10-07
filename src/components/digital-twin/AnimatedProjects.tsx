'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Github, X } from 'lucide-react'
import Image from 'next/image'
import { useAIControl } from '@/contexts/AIControlContext'

const projects = [
  {
    id: 1,
    title: 'AI-Powered Analytics Dashboard',
    description:
      'A comprehensive analytics platform that uses machine learning to provide predictive insights.',
    image: '/media/image-post1.webp',
    technologies: ['React', 'Node.js', 'Python', 'TensorFlow', 'PostgreSQL'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 2,
    title: 'E-Commerce Platform with AI',
    description: 'Full-featured e-commerce platform with AI-powered product recommendations.',
    image: '/media/image-post2.webp',
    technologies: ['Next.js', 'TypeScript', 'Stripe', 'Prisma', 'OpenAI'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 3,
    title: 'Real-Time Chat Application',
    description: 'Scalable messaging application with file sharing and video calling capabilities.',
    image: '/media/image-post3.webp',
    technologies: ['React', 'Socket.io', 'Node.js', 'MongoDB', 'WebRTC'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
  {
    id: 4,
    title: 'Smart Home IoT System',
    description: 'IoT-based smart home automation with AI-powered energy optimization.',
    image: '/media/image-hero1.webp',
    technologies: ['React Native', 'Python', 'Raspberry Pi', 'MQTT'],
    github: 'https://github.com',
    demo: 'https://example.com',
  },
]

export function AnimatedProjects() {
  const { activeComponents, toggleComponent, currentMode } = useAIControl()

  if (!activeComponents.projects || currentMode !== 'projects') return null

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
          className="w-full max-w-6xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/20 p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-bold text-white"
            >
              Featured Projects
            </motion.h2>
            <button
              onClick={() => toggleComponent('projects', false)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Projects grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.15,
                  type: 'spring',
                  stiffness: 100,
                }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="group relative bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/20 hover:border-purple-500/50 transition-all"
              >
                {/* Project image */}
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-gray-300 text-sm mb-4">{project.description}</p>

                  {/* Technologies */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.technologies.map((tech, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.15 + i * 0.05 }}
                        className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30"
                      >
                        {tech}
                      </motion.span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <a
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Demo</span>
                    </a>
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all text-sm"
                    >
                      <Github className="w-4 h-4" />
                      <span>Code</span>
                    </a>
                  </div>
                </div>

                {/* Glow effect on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                  style={{
                    background:
                      'radial-gradient(circle at center, rgba(147, 51, 234, 0.1), transparent 70%)',
                  }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
