// Centralized build-time detection utility
export const isBuildTime = (): boolean => {
  // Check for explicit build environment indicators
  const isVercelBuild = process.env.VERCEL === '1'
  const isCIBuild = process.env.CI === 'true' || process.env.CI === '1'
  const isProductionBuild = process.env.NODE_ENV === 'production'
  const hasDatabase = !!(process.env.DATABASE_URL || process.env.DATABASE_URI)
  
  // Check if we're in Next.js static generation phase (most reliable indicator)
  const isNextJSStaticGeneration = 
    process.env.NODE_ENV === 'production' &&
    (process.env.__NEXT_PROCESSED_ENV === '1' || process.env.NEXT_PHASE === 'phase-production-build')

  // Only consider it build time in these specific scenarios:
  // 1. Vercel build environment
  // 2. CI environment  
  // 3. Production build without database (for static generation)
  // 4. Next.js static generation phase
  const forceBuildMode = 
    isVercelBuild || 
    isCIBuild || 
    isNextJSStaticGeneration ||
    (isProductionBuild && !hasDatabase)

  // Special case: Never force build mode in development (NODE_ENV=development)
  if (process.env.NODE_ENV === 'development') {
    return false
  }

  if (forceBuildMode) {
    console.log(
      `🔧 Build-time detected: VERCEL=${process.env.VERCEL}, CI=${process.env.CI}, NODE_ENV=${process.env.NODE_ENV}, HAS_DB=${hasDatabase}, PHASE=${process.env.NEXT_PHASE}`,
    )
  }

  return forceBuildMode
}

// Check if we should skip database operations
export const shouldSkipDatabaseOperation = (): boolean => {
  return isBuildTime()
}
