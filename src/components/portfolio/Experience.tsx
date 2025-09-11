'use client'

import { motion } from 'framer-motion'
import { Calendar, MapPin, ExternalLink, Briefcase } from 'lucide-react'

const experiences = [
  {
    id: 1,
    company: 'TechCorp Solutions',
    position: 'Senior Full-Stack Developer',
    duration: '2022 - Present',
    location: 'San Francisco, CA',
    type: 'Full-time',
    description:
      'Leading development of scalable web applications and AI-powered features. Architecting microservices and implementing machine learning solutions.',
    achievements: [
      'Led a team of 5 developers in building a real-time analytics platform',
      'Implemented AI chatbot that improved customer satisfaction by 40%',
      'Reduced application load time by 60% through performance optimization',
      'Mentored junior developers and established code review best practices',
    ],
    technologies: ['React', 'Node.js', 'Python', 'AWS', 'PostgreSQL', 'TensorFlow'],
  },
  {
    id: 2,
    company: 'DataWise Inc.',
    position: 'AI/ML Engineer',
    duration: '2020 - 2022',
    location: 'Seattle, WA',
    type: 'Full-time',
    description:
      'Developed machine learning models for predictive analytics and natural language processing applications.',
    achievements: [
      'Built ML pipeline that processed 1M+ data points daily',
      'Improved model accuracy by 25% through feature engineering',
      'Created automated data validation and monitoring systems',
      'Published research on NLP applications in healthcare',
    ],
    technologies: ['Python', 'Scikit-learn', 'TensorFlow', 'Docker', 'Kubernetes', 'Apache Spark'],
  },
  {
    id: 3,
    company: 'StartupXYZ',
    position: 'Full-Stack Developer',
    duration: '2018 - 2020',
    location: 'Austin, TX',
    type: 'Full-time',
    description:
      'Built the entire web platform from scratch for a fintech startup, handling both frontend and backend development.',
    achievements: [
      'Developed MVP that secured $2M in Series A funding',
      'Implemented real-time payment processing system',
      'Built responsive web app serving 10,000+ users',
      'Established CI/CD pipeline and deployment automation',
    ],
    technologies: ['Vue.js', 'Node.js', 'Express', 'MongoDB', 'Stripe API', 'AWS'],
  },
]

export function Experience() {
  return (
    <section id="experience" className="py-20 bg-muted/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Professional Experience</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            My journey through various roles has given me diverse experience in full-stack
            development, AI/ML engineering, and technical leadership.
          </p>
        </motion.div>

        <div className="space-y-8">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-card border rounded-xl p-8 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Company Info */}
                <div className="lg:w-1/3">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{exp.company}</h3>
                      <p className="text-muted-foreground text-sm">{exp.type}</p>
                    </div>
                  </div>

                  <h4 className="text-lg font-semibold text-blue-600 mb-2">{exp.position}</h4>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{exp.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{exp.location}</span>
                    </div>
                  </div>
                </div>

                {/* Experience Details */}
                <div className="lg:w-2/3">
                  <p className="text-muted-foreground mb-6">{exp.description}</p>

                  <div className="mb-6">
                    <h5 className="font-semibold mb-3">Key Achievements:</h5>
                    <ul className="space-y-2">
                      {exp.achievements.map((achievement, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{achievement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="font-semibold mb-3">Technologies Used:</h5>
                    <div className="flex flex-wrap gap-2">
                      {exp.technologies.map((tech, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-muted rounded-full text-xs font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-4">Interested in working together?</h3>
            <p className="text-muted-foreground mb-6">
              I'm always open to discussing new opportunities and interesting projects.
            </p>
            <button
              onClick={() =>
                document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
            >
              <span>Get in Touch</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
