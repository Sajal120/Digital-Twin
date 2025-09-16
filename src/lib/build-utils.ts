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
  
  // Only trigger build mode during actual Vercel deployments or explicit build commands
  const isVercelStaticBuild = process.env.VERCEL === '1' && 
                              process.env.CI === 'true' && 
                              process.env.NODE_ENV === 'production'
  
  const isExplicitBuildCommand = process.argv.includes('next-build') || 
                                process.argv.includes('vercel-build') ||
                                (process.argv.includes('build') && !process.argv.includes('dev'))

  const forceBuildMode = isVercelStaticBuild || isExplicitBuildCommand

  if (forceBuildMode) {
    console.log(
      `🔧 Build-time detected: VERCEL=${process.env.VERCEL}, CI=${process.env.CI}, NODE_ENV=${process.env.NODE_ENV}`,
    )
  } else {
    console.log('🚀 Development mode - using full PayloadCMS with database')
  }

  return forceBuildMode
}

// Check if we should skip database operations
export const shouldSkipDatabaseOperation = (): boolean => {
  return isBuildTime()
}
