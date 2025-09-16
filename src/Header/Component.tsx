import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'
import { shouldSkipDatabaseOperation } from '@/lib/build-utils'

import type { Header } from '@/payload-types'

export async function Header() {
  // During build time, return a minimal header to avoid database calls
  if (shouldSkipDatabaseOperation()) {
    console.log('🔧 Skipping header global query during build - using minimal header')
    const fallbackHeader: Header = {
      id: 0,
      navItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return <HeaderClient data={fallbackHeader} />
  }

  const headerData: Header = await getCachedGlobal('header', 1)()

  return <HeaderClient data={headerData} />
}
