import { Hero } from '@/components/portfolio/Hero'
import { About } from '@/components/portfolio/About'
import { Experience } from '@/components/portfolio/Experience'
import { Skills } from '@/components/portfolio/Skills'
import { Projects } from '@/components/portfolio/Projects'
import { AIChat } from '@/components/portfolio/AIChat'
import { Contact } from '@/components/portfolio/Contact'
import { Navigation } from '@/components/portfolio/Navigation'
import { Footer } from '@/components/portfolio/Footer'

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main>
        <Hero />
        <About />
        <Experience />
        <Skills />
        <Projects />
        <AIChat />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
