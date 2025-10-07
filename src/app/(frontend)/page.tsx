import dynamic from 'next/dynamic'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sajal Basnet - Digital Twin AI Experience',
  description:
    "Experience an AI-powered conversation with Sajal Basnet's Digital Twin. Full Stack Developer specializing in React, Node.js, AI integration, and modern web technologies.",
  keywords:
    'Digital Twin, AI Portfolio, Full Stack Developer, React, Node.js, AI Engineer, Web Development',
  openGraph: {
    title: 'Sajal Basnet - Digital Twin AI Experience',
    description:
      "Experience an AI-powered conversation with Sajal Basnet's Digital Twin. Ask about projects, skills, and experience in real-time.",
    type: 'website',
  },
}

// Dynamic import to avoid SSR issues with window/client-only hooks
const DigitalTwinWrapper = dynamic(() => import('@/components/digital-twin/DigitalTwinWrapper'), {
  ssr: false,
})

export default function HomePage() {
  return <DigitalTwinWrapper />
}
