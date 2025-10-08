import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  GithubLogo,
  LinkedinLogo,
  EnvelopeSimple,
  MapPin,
  Phone,
  ArrowRight,
  ArrowSquareOut,
  ArrowUp,
} from 'phosphor-react'

const Animated3DBackground = dynamic(() => import('./Animated3DBackground'), { ssr: false })

gsap.registerPlugin(ScrollTrigger)

const TraditionalPortfolio = () => {
  const portfolioRef = useRef<HTMLDivElement>(null)
  const [activeFilter, setActiveFilter] = useState('All')

  // Static Data
  const personalInfo = {
    name: 'Sajal Basnet',
    title: 'Full-Stack Developer & IT Specialist',
    email: 'basnetsajal120@gmail.com',
    phone: '+61 424 425 793',
    location: 'Auburn, Sydney, NSW',
    github: 'https://github.com/Sajal120',
    linkedin: 'https://linkedin.com/in/sajal-basnet-7926aa188',
    yearsExperience: 3,
    projectsCompleted: 15,
    technicalSkills: 20,
  }

  // Import from skills data file
  const allSkills = [
    // This will be replaced with actual import
    { name: 'React', level: 95, category: 'Development', icon: '⚛️' },
    { name: 'TypeScript', level: 88, category: 'Development', icon: '🔷' },
    { name: 'Python', level: 88, category: 'Development', icon: '🐍' },
    { name: 'Node.js', level: 90, category: 'Development', icon: '💚' },
    { name: 'Next.js', level: 88, category: 'Development', icon: '▲' },
    { name: 'JavaScript', level: 95, category: 'Development', icon: '📜' },
    { name: 'HTML5', level: 98, category: 'Development', icon: '🌐' },
    { name: 'CSS3', level: 95, category: 'Development', icon: '🎨' },
    { name: 'Tailwind CSS', level: 92, category: 'Development', icon: '💨' },
    { name: 'MongoDB', level: 85, category: 'Development', icon: '🍃' },
    { name: 'PostgreSQL', level: 88, category: 'Development', icon: '🐘' },
    { name: 'MySQL', level: 85, category: 'Development', icon: '🐬' },
    { name: 'Supabase', level: 90, category: 'Development', icon: '⚡' },
    { name: 'Firebase', level: 88, category: 'Development', icon: '🔥' },
    { name: 'Git/GitHub', level: 92, category: 'Development', icon: '🐙' },
    { name: 'Docker', level: 82, category: 'Development', icon: '🐳' },
    { name: 'AWS', level: 85, category: 'Development', icon: '☁️' },
    { name: 'Three.js', level: 82, category: 'Development', icon: '🎮' },
    { name: 'AI Agents', level: 92, category: 'AI Tools', icon: '🤖' },
    { name: 'OpenAI API', level: 95, category: 'AI Tools', icon: '🧠' },
    { name: 'Claude API', level: 90, category: 'AI Tools', icon: '�' },
    { name: 'Prompt Engineering', level: 95, category: 'AI Tools', icon: '🎯' },
    { name: 'AI-Assisted Coding', level: 92, category: 'AI Tools', icon: '💻' },
    { name: 'LangChain', level: 85, category: 'AI Tools', icon: '⛓️' },
    { name: 'RAG Systems', level: 88, category: 'AI Tools', icon: '📚' },
    { name: 'ChatGPT Integration', level: 95, category: 'AI Tools', icon: '💬' },
    { name: 'Deepgram API', level: 88, category: 'AI Tools', icon: '🎙️' },
    { name: 'Voice AI', level: 85, category: 'AI Tools', icon: '�️' },
    { name: 'Semantic Search', level: 88, category: 'AI Tools', icon: '🔍' },
    { name: 'Penetration Testing', level: 88, category: 'Security', icon: '🔓' },
    { name: 'Vulnerability Assessment', level: 85, category: 'Security', icon: '🛡️' },
    { name: 'SIEM/Splunk', level: 80, category: 'Security', icon: '📊' },
    { name: 'Wireshark', level: 82, category: 'Security', icon: '🦈' },
    { name: 'OWASP Top 10', level: 88, category: 'Security', icon: '🔟' },
    { name: 'Network Security', level: 85, category: 'Security', icon: '🌐' },
    { name: 'Security Auditing', level: 83, category: 'Security', icon: '🔐' },
    { name: 'Threat Analysis', level: 85, category: 'Security', icon: '⚠️' },
    { name: 'Help Desk Management', level: 95, category: 'IT Support', icon: '🎧' },
    { name: 'Ticketing Systems', level: 92, category: 'IT Support', icon: '🎫' },
    { name: 'Remote Support', level: 90, category: 'IT Support', icon: '🖥️' },
    { name: 'Hardware Troubleshooting', level: 88, category: 'IT Support', icon: '🔧' },
    { name: 'System Administration', level: 88, category: 'IT Support', icon: '⚙️' },
    { name: 'Software Installation', level: 92, category: 'IT Support', icon: '💿' },
    { name: 'Windows Admin', level: 90, category: 'IT Support', icon: '🪟' },
    { name: 'Customer Service', level: 95, category: 'IT Support', icon: '🤝' },
  ]

  const projects = [
    {
      title: 'AI Digital Twin Portfolio',
      description:
        'An AI-powered portfolio with voice interaction, chat capabilities, and real-time responses using RAG and MCP protocols.',
      tech: ['React', 'Next.js', 'TypeScript', 'OpenAI', 'Deepgram'],
      github: 'https://github.com/Sajal120',
      live: 'https://www.sajal-app.online',
    },
    {
      title: 'E-Commerce Platform',
      description:
        'Full-stack e-commerce solution with payment integration, inventory management, and admin dashboard.',
      tech: ['React', 'Node.js', 'MongoDB', 'Stripe'],
      github: 'https://github.com/Sajal120',
      live: '#',
    },
    {
      title: 'Security Analysis Dashboard',
      description:
        'Real-time security monitoring dashboard with threat detection and automated response capabilities.',
      tech: ['Python', 'React', 'PostgreSQL', 'SIEM'],
      github: 'https://github.com/Sajal120',
      live: '#',
    },
  ]

  // Animation variants for Framer Motion
  const fadeInUp = {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const filterButtons = ['All', 'AI Tools', 'Development', 'Security', 'IT Support']
  const filteredSkills =
    activeFilter === 'All'
      ? allSkills
      : allSkills.filter((skill) => skill.category === activeFilter)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      ref={portfolioRef}
      className="bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white min-h-screen"
    >
      {/* Hero Section */}
      <section
        id="portfolio-home"
        className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20"
      >
        {/* Background effects */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-40 right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div id="portfolio-hero" className="container mx-auto px-6 text-center z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {personalInfo.name}
            </span>
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 mb-8">{personalInfo.title}</p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
            Versatile IT professional with expertise across software development, security analysis,
            and IT support. Master of Software Development from Swinburne University with a passion
            for creating innovative digital solutions.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#portfolio-contact"
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-semibold hover:scale-105 transition-transform duration-300 flex items-center gap-2"
            >
              Hire Me <ArrowRight size={20} />
            </a>
            <a
              href="#portfolio-projects"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm rounded-full font-semibold hover:bg-white/20 transition-all duration-300"
            >
              View Work
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="portfolio-about" className="py-20 relative overflow-hidden">
        {/* 3D Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          <Animated3DBackground />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              About Me
            </span>
          </h2>

          {/* Profile Image Section */}
          <div className="max-w-6xl mx-auto mb-20">
            <div className="relative w-80 h-80 mx-auto">
              {/* Glowing ring effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-20 blur-xl animate-pulse" />

              {/* Profile Image Container */}
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/20 bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-sm group hover:scale-105 transition-all duration-500">
                <img
                  src="/profile-avatar.png"
                  alt={personalInfo.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  onError={(e) => {
                    // Show gradient background if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>

              {/* Floating decorative elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-cyan-400 rounded-full animate-bounce" />
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-pink-500 rounded-full animate-bounce delay-75" />
              <div className="absolute top-1/4 -left-8 w-4 h-4 bg-purple-500 rounded-full animate-bounce delay-150" />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-2">
                {personalInfo.yearsExperience}+
              </div>
              <div className="text-gray-400 font-medium">Years Experience</div>
            </div>
            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
                45+
              </div>
              <div className="text-gray-400 font-medium">Technical Skills</div>
            </div>
            <div className="text-center p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300">
              <div className="text-5xl font-bold bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent mb-2">
                {personalInfo.projectsCompleted}+
              </div>
              <div className="text-gray-400 font-medium">Projects Completed</div>
            </div>
          </div>

          {/* About Description */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
              <h3 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Passionate About Technology
              </h3>
              <p className="text-gray-300 leading-relaxed mb-4">
                Versatile IT professional with comprehensive expertise across software development,
                security analysis, and IT support. Master of Software Development from Swinburne
                University (Sep 2022 – May 2024) with a GPA of 3.688/4.0. Member of Golden Key
                International Honour Society – Top 15%.
              </p>
              <p className="text-gray-300 leading-relaxed">
                From full-stack development with modern frameworks to implementing enterprise
                security solutions, I leverage AI tools to enhance every aspect of my work. My
                experience spans from developing secure applications to conducting security analysis
                with intelligent automation.
              </p>
            </div>
          </div>

          {/* Skills Section */}
          <div className="max-w-6xl mx-auto">
            <h3 className="text-4xl font-bold mb-12 text-center">
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-blue-400 bg-clip-text text-transparent">
                Technical Skills
              </span>
            </h3>

            {/* Filter Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {filterButtons.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 text-sm ${
                    activeFilter === filter
                      ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-105'
                      : 'bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Skills Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSkills.map((skill, index) => (
                <div
                  key={`${skill.name}-${activeFilter}-${index}`}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 p-5 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl group-hover:scale-125 transition-transform duration-300">
                        {skill.icon}
                      </span>
                      <span className="font-semibold text-white">{skill.name}</span>
                    </div>
                    <span className="text-sm font-bold text-purple-400">{skill.level}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                  {/* Category Badge */}
                  <div className="mt-3">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        skill.category === 'AI Tools'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : skill.category === 'Development'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : skill.category === 'Security'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-green-500/20 text-green-300 border border-green-500/30'
                      }`}
                    >
                      {skill.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="portfolio-projects" className="py-20 relative">
        <div className="absolute bottom-20 left-10 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Featured Projects
            </span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {projects.map((project, index) => (
              <div
                key={index}
                className="project-card bg-white/5 backdrop-blur-sm rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group"
              >
                <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors">
                  {project.title}
                </h3>
                <p className="text-gray-300 mb-6">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tech.map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex gap-4">
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors"
                  >
                    <GithubLogo size={16} weight="fill" /> Code
                  </a>
                  <a
                    href={project.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-blue-400 transition-colors"
                  >
                    <ArrowSquareOut size={16} weight="fill" /> Live Demo
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a
              href={personalInfo.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 transition-all duration-300 rounded-full"
            >
              View All Projects <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="portfolio-contact" className="py-20 relative">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl md:text-6xl font-bold text-center mb-16">
            <span className="bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
              Get In Touch
            </span>
          </h2>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-6">Let's Connect</h3>
              <p className="text-gray-300 mb-8">
                I'm actively seeking opportunities in IT Support, Software Development, and Security
                Analysis. Let's discuss how I can contribute to your team!
              </p>

              <div className="space-y-4">
                <a
                  href={`mailto:${personalInfo.email}`}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <EnvelopeSimple size={24} weight="fill" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Email</div>
                    <div className="font-medium">{personalInfo.email}</div>
                  </div>
                </a>

                <a
                  href={`tel:${personalInfo.phone}`}
                  className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Phone size={24} weight="fill" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Phone</div>
                    <div className="font-medium">{personalInfo.phone}</div>
                  </div>
                </a>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <MapPin size={24} weight="fill" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Location</div>
                    <div className="font-medium">{personalInfo.location}</div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex gap-4 pt-6">
                <a
                  href={personalInfo.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-blue-400/20 transition-all duration-300"
                >
                  <GithubLogo size={20} weight="fill" />
                </a>
                <a
                  href={personalInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center hover:bg-blue-400/20 transition-all duration-300"
                >
                  <LinkedinLogo size={20} weight="fill" />
                </a>
              </div>
            </div>

            {/* Contact Form Placeholder */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">Send a Message</h3>
              <p className="text-gray-400 mb-6">
                Feel free to reach out via email or connect on social media!
              </p>
              <div className="space-y-4">
                <a
                  href={`mailto:${personalInfo.email}`}
                  className="block w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-center font-semibold hover:scale-105 transition-transform duration-300"
                >
                  Email Me
                </a>
                <a
                  href={personalInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-3 bg-white/10 rounded-full text-center font-semibold hover:bg-white/20 transition-all duration-300"
                >
                  Connect on LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <div className="text-2xl font-bold mb-2">
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  {personalInfo.name}
                </span>
              </div>
              <p className="text-gray-400 text-sm">Full-Stack Developer & IT Specialist</p>
            </div>
            <div className="text-gray-400 text-sm">
              © 2025 {personalInfo.name}. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300 z-30 opacity-80 hover:opacity-100"
        aria-label="Scroll to top"
      >
        <ArrowUp size={20} />
      </button>
    </div>
  )
}

export default TraditionalPortfolio
