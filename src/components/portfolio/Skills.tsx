'use client'

import { motion } from 'framer-motion'
import {
  Code,
  Database,
  Brain,
  Cloud,
  Smartphone,
  Globe,
  Server,
  Palette,
  Zap,
  Shield,
  GitBranch,
  BarChart,
} from 'lucide-react'

const skillCategories = [
  {
    title: 'Frontend Development',
    icon: <Globe className="w-6 h-6" />,
    color: 'from-blue-500 to-cyan-500',
    skills: [
      { name: 'React/Next.js', level: 95, icon: <Code className="w-4 h-4" /> },
      { name: 'TypeScript', level: 90, icon: <Code className="w-4 h-4" /> },
      { name: 'Tailwind CSS', level: 88, icon: <Palette className="w-4 h-4" /> },
      { name: 'Vue.js', level: 85, icon: <Code className="w-4 h-4" /> },
      { name: 'HTML/CSS', level: 95, icon: <Globe className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Backend Development',
    icon: <Server className="w-6 h-6" />,
    color: 'from-green-500 to-emerald-500',
    skills: [
      { name: 'Node.js', level: 92, icon: <Server className="w-4 h-4" /> },
      { name: 'Python', level: 90, icon: <Code className="w-4 h-4" /> },
      { name: 'PostgreSQL', level: 88, icon: <Database className="w-4 h-4" /> },
      { name: 'MongoDB', level: 85, icon: <Database className="w-4 h-4" /> },
      { name: 'REST APIs', level: 93, icon: <Zap className="w-4 h-4" /> },
    ],
  },
  {
    title: 'AI & Machine Learning',
    icon: <Brain className="w-6 h-6" />,
    color: 'from-purple-500 to-pink-500',
    skills: [
      { name: 'TensorFlow', level: 85, icon: <Brain className="w-4 h-4" /> },
      { name: 'Scikit-learn', level: 88, icon: <BarChart className="w-4 h-4" /> },
      { name: 'NLP', level: 82, icon: <Brain className="w-4 h-4" /> },
      { name: 'Computer Vision', level: 80, icon: <Brain className="w-4 h-4" /> },
      { name: 'Data Analysis', level: 90, icon: <BarChart className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Cloud & DevOps',
    icon: <Cloud className="w-6 h-6" />,
    color: 'from-orange-500 to-red-500',
    skills: [
      { name: 'AWS', level: 88, icon: <Cloud className="w-4 h-4" /> },
      { name: 'Docker', level: 85, icon: <Server className="w-4 h-4" /> },
      { name: 'Kubernetes', level: 78, icon: <Server className="w-4 h-4" /> },
      { name: 'CI/CD', level: 90, icon: <GitBranch className="w-4 h-4" /> },
      { name: 'Monitoring', level: 83, icon: <BarChart className="w-4 h-4" /> },
    ],
  },
]

const tools = [
  { name: 'VS Code', category: 'Editor' },
  { name: 'Git', category: 'Version Control' },
  { name: 'Figma', category: 'Design' },
  { name: 'Postman', category: 'API Testing' },
  { name: 'Jira', category: 'Project Management' },
  { name: 'Slack', category: 'Communication' },
  { name: 'Linear', category: 'Issue Tracking' },
  { name: 'Vercel', category: 'Deployment' },
]

export function Skills() {
  return (
    <section id="skills" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4">Skills & Expertise</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            I bring a comprehensive skill set across multiple technologies and frameworks,
            constantly learning and adapting to new tools and best practices.
          </p>
        </motion.div>

        {/* Skill Categories */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {skillCategories.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
              className="bg-card border rounded-xl p-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div
                  className={`w-12 h-12 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center text-white`}
                >
                  {category.icon}
                </div>
                <h3 className="text-xl font-bold">{category.title}</h3>
              </div>

              <div className="space-y-4">
                {category.skills.map((skill, skillIndex) => (
                  <div key={skill.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">{skill.icon}</span>
                        <span className="font-medium">{skill.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{skill.level}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: categoryIndex * 0.1 + skillIndex * 0.1 }}
                        className={`h-2 bg-gradient-to-r ${category.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tools & Technologies */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-muted/50 rounded-xl p-8"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-4">Tools & Technologies</h3>
            <p className="text-muted-foreground">
              Additional tools and technologies I work with on a regular basis
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-card border rounded-lg p-4 text-center hover:shadow-md transition-shadow"
              >
                <div className="font-semibold text-sm mb-1">{tool.name}</div>
                <div className="text-xs text-muted-foreground">{tool.category}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Learning & Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12"
        >
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-4 flex items-center justify-center space-x-2">
              <Zap className="w-6 h-6 text-yellow-500" />
              <span>Continuous Learning</span>
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Technology evolves rapidly, and I'm committed to staying current with the latest
              trends, frameworks, and best practices. I regularly participate in online courses,
              attend conferences, and contribute to open-source projects to keep my skills sharp.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
