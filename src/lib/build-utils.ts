// Centralized build-time detection utility
export const isBuildTime = (): boolean => {
  // Multiple build environment checks for maximum coverage
  const isVercelBuild = process.env.VERCEL === '1'
  const isVercelProduction = process.env.VERCEL_ENV === 'production'
  const isCIBuild = process.env.CI === 'true' || process.env.CI === '1'
  const isProductionBuild = process.env.NODE_ENV === 'production'
  const hasNoBuildDatabase = !process.env.DATABASE_URL && !process.env.DATABASE_URI

  // Force build-time mode if any build indicators are present
  const forceBuildMode = isVercelBuild || isCIBuild || (isProductionBuild && hasNoBuildDatabase)

  if (forceBuildMode) {
    console.log(
      `🔧 Build-time detected: VERCEL=${process.env.VERCEL}, CI=${process.env.CI}, NODE_ENV=${process.env.NODE_ENV}, HAS_DB=${!!process.env.DATABASE_URL}`,
    )
  }

  return forceBuildMode
}

// Check if we should skip database operations
export const shouldSkipDatabaseOperation = (): boolean => {
  return isBuildTime()
}
