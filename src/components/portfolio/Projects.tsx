'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Github, Calendar, Tag, ArrowRight } from 'lucide-react'
import Image from 'next/image'

const projects = [
  {
    id: 1,
    title: 'AI-Powered Analytics Dashboard',
    description:
      'A comprehensive analytics platform that uses machine learning to provide predictive insights and automated reporting for business intelligence.',
    image: '/media/image-post1.webp',
    technologies: ['React', 'Node.js', 'Python', 'TensorFlow', 'PostgreSQL', 'AWS'],
    category: 'AI/ML',
    date: '2024',
    features: [
      'Real-time data processing and visualization',
      'Predictive analytics using ML models',
      'Automated report generation',
      'Interactive dashboard with custom filters',
    ],
    github: 'https://github.com',
    demo: 'https://example.com',
    status: 'Completed',
  },
  {
    id: 2,
    title: 'E-Commerce Platform with AI Recommendations',
    description:
      'A full-featured e-commerce platform with AI-powered product recommendations and intelligent search functionality.',
    image: '/media/image-post2.webp',
    technologies: ['Next.js', 'TypeScript', 'Stripe', 'Prisma', 'Vercel', 'OpenAI'],
    category: 'Web Development',
    date: '2023',
    features: [
      'Personalized product recommendations',
      'Smart search with natural language processing',
      'Secure payment processing',
      'Admin dashboard with analytics',
    ],
    github: 'https://github.com',
    demo: 'https://example.com',
    status: 'Completed',
  },
  {
    id: 3,
    title: 'Real-Time Chat Application',
    description:
      'A scalable real-time messaging application with file sharing, group chats, and video calling capabilities.',
    image: '/media/image-post3.webp',
    technologies: ['React', 'Socket.io', 'Node.js', 'MongoDB', 'WebRTC', 'Redis'],
    category: 'Web Development',
    date: '2023',
    features: [
      'Real-time messaging with Socket.io',
      'File and image sharing',
      'Group chat functionality',
      'Video and voice calling',
    ],
    github: 'https://github.com',
    demo: 'https://example.com',
    status: 'Completed',
  },
  {
    id: 4,
    title: 'Smart Home IoT System',
    description:
      'An IoT-based smart home automation system with mobile app control and AI-powered energy optimization.',
    image: '/media/image-hero1.webp',
    technologies: ['React Native', 'Python', 'Raspberry Pi', 'MQTT', 'InfluxDB', 'Grafana'],
    category: 'IoT',
    date: '2024',
    features: [
      'Mobile app for device control',
      'Energy usage optimization using AI',
      'Real-time monitoring and alerts',
      'Voice control integration',
    ],
    github: 'https://github.com',
    demo: 'https://example.com',
    status: 'In Progress',
  },
]

const categories = ['All', 'AI/ML', 'Web Development', 'IoT', 'Mobile']

export function Projects() {
  return (
    <section id="projects" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Featured Projects</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            Here are some of my recent projects that showcase my skills in full-stack development,
            AI/ML engineering, and modern web technologies.
          </p>
        </motion.div>

        {/* Project Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group"
            >
              {/* Project Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={project.image}
                  alt={project.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-4 left-4 flex space-x-2">
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                    {project.category}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'Completed'
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-600 text-white'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <div className="absolute bottom-4 right-4">
                  <div className="flex items-center space-x-1 text-white text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>{project.date}</span>
                  </div>
                </div>
              </div>

              {/* Project Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors">
                  {project.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">{project.description}</p>

                {/* Features */}
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2">Key Features:</h4>
                  <ul className="space-y-1">
                    {project.features.slice(0, 2).map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start space-x-2 text-sm text-muted-foreground"
                      >
                        <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0 text-blue-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Technologies */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {project.technologies.slice(0, 4).map((tech, i) => (
                      <span key={i} className="px-2 py-1 bg-muted text-xs rounded-md">
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 4 && (
                      <span className="px-2 py-1 bg-muted text-xs rounded-md">
                        +{project.technologies.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <a
                    href={project.demo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Demo</span>
                  </a>
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    <Github className="w-4 h-4" />
                    <span>Code</span>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* More Projects CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-4">Want to see more?</h3>
            <p className="text-muted-foreground mb-6">
              Check out my GitHub profile for more projects and contributions to open-source.
            </p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              <Github className="w-5 h-5" />
              <span>View GitHub Profile</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
