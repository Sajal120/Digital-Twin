'use client'

import { motion } from 'framer-motion'
import { User, Code, Brain, Lightbulb } from 'lucide-react'

export function About() {
  return (
    <section id="about" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">About Me</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            I'm a passionate full-stack developer and AI/ML engineer with a strong background in
            building intelligent systems that solve complex real-world problems.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Profile Image and Personal Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Sajal Basnet</h3>
                  <p className="text-muted-foreground">Full-stack Developer & AI Engineer</p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                With over 5 years of experience in software development, I specialize in creating
                innovative solutions that bridge the gap between traditional software engineering
                and cutting-edge AI technologies. My passion lies in building scalable applications
                that make a meaningful impact.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">5+</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
              <div className="bg-card border rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">50+</div>
                <div className="text-sm text-muted-foreground">Projects Completed</div>
              </div>
            </div>
          </motion.div>

          {/* Skills and Expertise */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <Code className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold">Technical Expertise</h3>
              </div>
              <p className="text-muted-foreground">
                I work across the full technology stack, from front-end user interfaces to back-end
                systems and AI/ML model development.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <Brain className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-semibold">AI & Machine Learning</h3>
              </div>
              <p className="text-muted-foreground">
                Specialized in developing intelligent systems using modern ML frameworks, natural
                language processing, and computer vision technologies.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <Lightbulb className="w-6 h-6 text-yellow-600" />
                <h3 className="text-xl font-semibold">Problem Solving</h3>
              </div>
              <p className="text-muted-foreground">
                I approach challenges with creativity and analytical thinking, always looking for
                innovative solutions that deliver real value to users and businesses.
              </p>
            </div>

            {/* Personal Interests */}
            <div className="bg-muted/50 rounded-lg p-6 mt-8">
              <h4 className="font-semibold mb-3">When I'm not coding...</h4>
              <p className="text-sm text-muted-foreground">
                I enjoy exploring the latest tech trends, contributing to open-source projects, and
                sharing knowledge through technical writing and mentoring. I'm also passionate about
                photography and hiking in my free time.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
