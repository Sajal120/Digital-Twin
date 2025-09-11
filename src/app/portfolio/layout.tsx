import type { Metadata } from 'next'
import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'

import '../(frontend)/globals.css'

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: 'Sajal Basnet - AI-Powered Digital Twin Portfolio',
  description: 'Full-Stack Developer | AI Engineer | Interactive Portfolio with AI Chat',
  openGraph: mergeOpenGraph({
    title: 'Sajal Basnet - AI-Powered Digital Twin Portfolio',
    description:
      'Interactive portfolio with AI chat - discover my experience in full-stack development, AI/ML, and cloud technologies.',
    url: '/portfolio',
  }),
  twitter: {
    card: 'summary_large_image',
    creator: '@sajalbasnet',
  },
}
