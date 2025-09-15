// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'

import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
// import { Messages } from './collections/Messages' // Temporarily disabled
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
// Admin collections - re-enabling
import { PortfolioContent } from './collections/PortfolioContent'
import { ChatAnalytics, SystemLogs } from './collections/AnalyticsCollections'
import { ContentChunks } from './collections/ContentChunks'
import { EmbeddingOperations } from './collections/EmbeddingOperations'
import { DatabaseOperations } from './collections/DatabaseOperations'
import { AuditLogs } from './collections/AuditLogs'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Generate a consistent secret based on environment or create a secure fallback
const getPayloadSecret = (): string => {
  if (process.env.PAYLOAD_SECRET) {
    return process.env.PAYLOAD_SECRET
  }

  // For builds, create a deterministic secret based on DATABASE_URL or NODE_ENV
  if (process.env.DATABASE_URL) {
    return crypto.createHash('sha256').update(process.env.DATABASE_URL).digest('hex').slice(0, 32)
  }

  // Final fallback for build environments
  return crypto
    .createHash('sha256')
    .update('cms-twin-portfolio-build-secret')
    .digest('hex')
    .slice(0, 32)
}

// Get database connection string with fallback
const getDatabaseConnection = (): string => {
  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URI

  if (dbUrl) {
    return dbUrl
  }

  // During build time, provide a mock connection string if none exists
  console.warn('No DATABASE_URL found, using fallback for build process')
  return 'postgresql://user:pass@localhost:5432/fallback_db'
}

// Check if we're in a build environment without database access
const isBuildTime = (): boolean => {
  return (
    !process.env.DATABASE_URL && !process.env.DATABASE_URI && process.env.NODE_ENV !== 'development'
  )
}

// Create database configuration based on environment
const getDatabaseConfig = () => {
  // For build time without database, use minimal configuration
  if (isBuildTime()) {
    console.log('Using minimal database configuration for build process')
    return postgresAdapter({
      pool: {
        connectionString: getDatabaseConnection(),
        // Disable connection pooling during build
        max: 0,
        min: 0,
      },
      migrationDir: path.resolve(dirname, 'migrations'),
      push: false, // Disable migrations during build
    })
  }
  
  return postgresAdapter({
    pool: {
      connectionString: getDatabaseConnection(),
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    push: true, // Enable push mode to auto-create admin collection schema
  })
}

// Simple build-time detection
const isBuilding = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL

// Create minimal config for build time, full config for runtime
const createConfig = () => {
  if (isBuilding) {
    console.log('🔧 Using build-time PayloadCMS configuration (database-free)')
    
    // Return minimal config that won't connect to database
    return buildConfig({
      secret: getPayloadSecret(),
      collections: [],
      globals: [],
      db: postgresAdapter({
        pool: {
          connectionString: 'postgresql://build:build@localhost:5432/build',
          max: 0, // No connections during build
        },
        migrationDir: path.resolve(dirname, 'migrations'),
        push: false,
      }),
      sharp,
    })
  }

  // Full production configuration
  console.log('🚀 Using full PayloadCMS configuration with database')
  
  return buildConfig({
    admin: {
      components: {
        beforeLogin: ['@/components/BeforeLogin'],
        beforeDashboard: ['@/components/BeforeDashboard'],
      },
      importMap: {
        baseDir: path.resolve(dirname),
      },
      user: Users.slug,
      livePreview: {
        breakpoints: [
          {
            label: 'Mobile',
            name: 'mobile',
            width: 375,
            height: 667,
          },
          {
            label: 'Tablet',
            name: 'tablet',
            width: 768,
            height: 1024,
          },
          {
            label: 'Desktop',
            name: 'desktop',
            width: 1440,
            height: 900,
          },
        ],
      },
    },
    editor: defaultLexical,
    db: getDatabaseConfig(),
    collections: [
      Pages,
      Posts,
      Media,
      Categories,
      Users,
      PortfolioContent,
      ChatAnalytics,
      SystemLogs,
      ContentChunks,
      EmbeddingOperations,
      DatabaseOperations,
      AuditLogs,
    ],
    cors: [getServerSideURL()].filter(Boolean),
    globals: [Header, Footer],
    plugins: [
      ...plugins,
    ],
    secret: getPayloadSecret(),
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
    jobs: {
      access: {
        run: ({ req }: { req: PayloadRequest }): boolean => {
          if (req.user) return true
          const authHeader = req.headers.get('authorization')
          return authHeader === `Bearer ${process.env.CRON_SECRET}`
        },
      },
      tasks: [],
    },
  })
}

export default createConfig()
