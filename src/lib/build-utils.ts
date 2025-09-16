// Centralized build-time detection utility
export const isBuildTime = (): boolean => {
  // NEVER use build mode in development - be absolutely explicit
  if (process.env.NODE_ENV === 'development') {
    return false
  }

  // Check for development server indicators
  if (process.argv.includes('dev') || process.env.NEXT_DEV === 'true') {
    return false
  }

  // Only trigger build mode during actual static site generation
  // Key indicator: NEXT_PHASE is only set during build process, not runtime
  const isNextBuildProcess = process.env.NEXT_PHASE === 'phase-production-build'

  // Additional indicators for Vercel build process (not runtime)
  const isVercelBuildTime =
    process.env.VERCEL === '1' &&
    process.env.CI === 'true' &&
    process.env.NODE_ENV === 'production' &&
    !process.env.VERCEL_URL && // Runtime has VERCEL_URL, build doesn't
    !process.env.PORT // Runtime has PORT, build doesn't

  const isExplicitBuildCommand =
    process.argv.some((arg) => arg.includes('build') && !arg.includes('dev')) ||
    process.env.BUILD_PHASE === 'build-time'

  const forceBuildMode = isNextBuildProcess || isVercelBuildTime || isExplicitBuildCommand

  if (forceBuildMode) {
    console.log(
      `🔧 Static Build Mode: NEXT_PHASE=${process.env.NEXT_PHASE}, VERCEL=${process.env.VERCEL}, CI=${process.env.CI}, PORT=${process.env.PORT}, VERCEL_URL=${!!process.env.VERCEL_URL}`,
    )
  } else {
    console.log(
      `🚀 Runtime Mode: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}, VERCEL_URL=${!!process.env.VERCEL_URL}`,
    )
  }

  return forceBuildMode
}

// Check if we should skip database operations
export const shouldSkipDatabaseOperation = (): boolean => {
  return isBuildTime()
}

// Production runtime detection - for when we're running in production but not building
export const isProductionRuntime = (): boolean => {
  return process.env.NODE_ENV === 'production' && !isBuildTime()
}

// Check if database should be available (development or production runtime)
export const shouldUseDatabaseConnection = (): boolean => {
  const hasDbUrl = !!(process.env.DATABASE_URL || process.env.DATABASE_URI)
  const shouldUse = !isBuildTime() && hasDbUrl

  if (!hasDbUrl && !isBuildTime()) {
    console.warn('⚠️  No DATABASE_URL found in runtime environment')
  }

  return shouldUse
}
