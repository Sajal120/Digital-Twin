import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'
import { shouldSkipDatabaseOperation } from '@/lib/build-utils'

import type { Footer } from '@/payload-types'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'

export async function Footer() {
  // During build time, return a minimal footer to avoid database calls
  if (shouldSkipDatabaseOperation()) {
    console.log('🔧 Skipping footer global query during build - using minimal footer')
    return (
      <footer className="mt-auto border-t border-border bg-black dark:bg-card text-white">
        <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
          <Link className="flex items-center" href="/">
            <Logo />
          </Link>

          <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
            <ThemeSelector />
            <nav className="flex flex-col md:flex-row gap-4">
              {/* Minimal navigation for build time */}
            </nav>
          </div>
        </div>
      </footer>
    )
  }

  const footerData: Footer = await getCachedGlobal('footer', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto border-t border-border bg-black dark:bg-card text-white">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          <Logo />
        </Link>

        <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
          <ThemeSelector />
          <nav className="flex flex-col md:flex-row gap-4">
            {navItems.map(({ link }, i) => {
              return <CMSLink className="text-white" key={i} {...link} />
            })}
          </nav>
        </div>
      </div>
    </footer>
  )
}
