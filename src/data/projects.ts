export interface Project {
  title: string
  description: string
  tech: string[]
  github: string
  live: string
  image?: string
  language?: string
}

export const projects: Project[] = [
  {
    title: 'AI Digital Twin Portfolio',
    description:
      'An AI-powered portfolio with voice interaction, chat capabilities, and real-time responses using RAG and MCP protocols.',
    tech: ['React', 'Next.js', 'TypeScript', 'OpenAI', 'Deepgram', 'Supabase'],
    github: 'https://github.com/Sajal120/Digital-Twin',
    live: 'https://digital-twin-prj.vercel.app',
    language: 'TypeScript',
    image: '/project-images/digital-twin.jpg',
  },
  {
    title: 'Portfolio App',
    description:
      'This is my portfolio app with 3D animations, dynamic content loading from Supabase, and modern UI design.',
    tech: ['React', 'TypeScript', 'GSAP', 'Supabase'],
    github: 'https://github.com/Sajal120/portfolio-app',
    live: 'https://portfolio-app-coral-beta.vercel.app',
    language: 'TypeScript',
    image: '/project-images/portfolio-app.jpg',
  },
  {
    title: 'Person Search App',
    description:
      'A responsive search application for finding people with advanced filtering and modern UI.',
    tech: ['TypeScript', 'React', 'Next.js', 'Tailwind CSS'],
    github: 'https://github.com/Sajal120/person-search',
    live: 'https://person-search-mu.vercel.app',
    language: 'TypeScript',
    image: '/project-images/person-search.jpg',
  },
  {
    title: 'Security Analysis Dashboard',
    description:
      'Real-time security monitoring dashboard with threat detection and automated response capabilities.',
    tech: ['Python', 'React', 'PostgreSQL', 'SIEM'],
    github: 'https://github.com/Sajal120/my-digital-portfolio',
    live: 'https://my-digital-portfolio-ivory.vercel.app',
    language: 'TypeScript',
    image: '/project-images/security-dashboard.jpg',
  },
  {
    title: 'Movie Database Website',
    description:
      'This is a responsive website which uses TMDB API to fetch movies info with search and filter capabilities.',
    tech: ['JavaScript', 'HTML5', 'CSS3', 'TMDB API'],
    github: 'https://github.com/Sajal120/Movie-Website',
    live: '#',
    language: 'JavaScript',
    image: '/project-images/movie-website.jpg',
  },
  {
    title: 'XC3 Cloud Management',
    description:
      'XC3 is a cloud agnostic and risk free package offering powered by Cloud Custodian that provides resource inventory, tagging compliance, and cost control.',
    tech: ['Python', 'Cloud Custodian', 'AWS', 'Azure'],
    github: 'https://github.com/Sajal120/XC3',
    live: '#',
    language: 'Python',
    image: '/project-images/xc3-cloud.jpg',
  },
  {
    title: 'Marketplace Website',
    description:
      'Selling and Bidding platform with user authentication and real-time bidding system.',
    tech: ['PHP', 'MySQL', 'JavaScript', 'Bootstrap'],
    github: 'https://github.com/Sajal120/Marketplace-Website',
    live: '#',
    language: 'PHP',
    image: '/project-images/marketplace.jpg',
  },
  {
    title: 'Fertility Tracking App',
    description:
      'Health tracking application for fertility monitoring with data visualization and analytics.',
    tech: ['C#', '.NET', 'XAML', 'SQLite'],
    github: 'https://github.com/Sajal120/Fertility-App',
    live: '#',
    language: 'C#',
    image: '/project-images/fertility-app.jpg',
  },
  {
    title: 'OpenAI Realtime Agents',
    description:
      'A simple demonstration of more advanced, agentic patterns built on top of the Realtime API.',
    tech: ['JavaScript', 'OpenAI API', 'Node.js'],
    github: 'https://github.com/Sajal120/openai-realtime-agents',
    live: '#',
    language: 'JavaScript',
    image: '/project-images/openai-agents.jpg',
  },
]

export const getCategoryColor = (language: string) => {
  const colors: Record<string, string> = {
    TypeScript: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    JavaScript: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    Python: 'bg-green-500/20 text-green-300 border-green-500/30',
    'C#': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    PHP: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  }
  return colors[language] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'
}
