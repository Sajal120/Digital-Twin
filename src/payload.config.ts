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
import { isBuildTime } from '@/lib/build-utils'

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

// Create database configuration based on environment
const getDatabaseConfig = () => {
  // For build time without database, skip database entirely
  if (isBuildTime()) {
    console.log('🔧 Using build-time PayloadCMS configuration (database-free)')

    // Create a comprehensive mock that intercepts ALL database calls
    const mockResponse = { id: 'mock', createdAt: new Date(), updatedAt: new Date() }
    const mockPaginatedResponse = {
      docs: [],
      totalDocs: 0,
      limit: 10,
      totalPages: 0,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    }

    // Create a Proxy-based mock adapter that catches ALL method calls
    const mockAdapter = new Proxy(
      {
        name: 'comprehensive-mock-adapter',
        payload: null as any,
      },
      {
        get: (target, prop: string) => {
          // Handle specific known methods with proper logging
          switch (prop) {
            case 'name':
              return 'comprehensive-mock-adapter'
            case 'payload':
              return null
            // Connection methods
            case 'connect':
              return async () => {
                console.log('🔧 Mock: connect called')
                return Promise.resolve()
              }
            case 'destroy':
              return async () => {
                console.log('🔧 Mock: destroy called')
                return Promise.resolve()
              }
            case 'init':
              return async () => {
                console.log('🔧 Mock: init called')
                return Promise.resolve()
              }
            // Transaction methods
            case 'beginTransaction':
              return async () => {
                console.log('🔧 Mock: beginTransaction called')
                return { commit: async () => {}, rollback: async () => {} }
              }
            case 'commitTransaction':
              return async () => {
                console.log('🔧 Mock: commitTransaction called')
              }
            case 'rollbackTransaction':
              return async () => {
                console.log('🔧 Mock: rollbackTransaction called')
              }
            // Collection CRUD methods
            case 'count':
              return async () => {
                console.log('🔧 Mock: count called')
                return { totalDocs: 0 }
              }
            case 'create':
              return async () => {
                console.log('🔧 Mock: create called')
                return mockResponse
              }
            case 'createMany':
              return async () => {
                console.log('🔧 Mock: createMany called')
                return []
              }
            case 'deleteMany':
              return async () => {
                console.log('🔧 Mock: deleteMany called')
                return { docs: [] }
              }
            case 'deleteOne':
              return async () => {
                console.log('🔧 Mock: deleteOne called')
                return mockResponse
              }
            case 'deleteVersions':
              return async () => {
                console.log('🔧 Mock: deleteVersions called')
              }
            case 'find':
              return async () => {
                console.log('🔧 Mock: find called')
                return mockPaginatedResponse
              }
            case 'findOne':
              return async () => {
                console.log('🔧 Mock: findOne called')
                return null
              }
            case 'findVersions':
              return async () => {
                console.log('🔧 Mock: findVersions called')
                return mockPaginatedResponse
              }
            case 'updateOne':
              return async () => {
                console.log('🔧 Mock: updateOne called')
                return mockResponse
              }
            case 'updateMany':
              return async () => {
                console.log('🔧 Mock: updateMany called')
                return []
              }
            case 'updateVersion':
              return async () => {
                console.log('🔧 Mock: updateVersion called')
                return mockResponse
              }
            case 'queryDrafts':
              return async () => {
                console.log('🔧 Mock: queryDrafts called')
                return mockPaginatedResponse
              }
            // Global methods (the critical ones!)
            case 'findGlobal':
              return async () => {
                console.log('🔧 Mock: findGlobal called - returning mock data')
                return mockResponse
              }
            case 'updateGlobal':
              return async () => {
                console.log('🔧 Mock: updateGlobal called')
                return mockResponse
              }
            case 'createGlobal':
              return async () => {
                console.log('🔧 Mock: createGlobal called')
                return mockResponse
              }
            // Version methods
            case 'createVersion':
              return async () => {
                console.log('🔧 Mock: createVersion called')
                return mockResponse
              }
            case 'deleteVersion':
              return async () => {
                console.log('🔧 Mock: deleteVersion called')
                return mockResponse
              }
            // Migration methods
            case 'migrate':
              return async () => {
                console.log('🔧 Mock: migrate called')
              }
            case 'migrateDown':
              return async () => {
                console.log('🔧 Mock: migrateDown called')
              }
            case 'migrateFresh':
              return async () => {
                console.log('🔧 Mock: migrateFresh called')
              }
            case 'migrateRefresh':
              return async () => {
                console.log('🔧 Mock: migrateRefresh called')
              }
            case 'migrateReset':
              return async () => {
                console.log('🔧 Mock: migrateReset called')
              }
            case 'migrateStatus':
              return async () => {
                console.log('🔧 Mock: migrateStatus called')
                return []
              }
            case 'createMigration':
              return async () => {
                console.log('🔧 Mock: createMigration called')
              }
            // Utility methods
            case 'distinct':
              return async () => {
                console.log('🔧 Mock: distinct called')
                return []
              }
            // Default catch-all for any missed methods
            default:
              console.log(`🔧 Mock: Intercepted unknown method "${prop}"`)
              return async (...args: any[]) => {
                console.log(`🔧 Mock: Executing unknown method "${prop}" with args:`, args)
                return mockResponse
              }
          }
        },
      },
    )

    return mockAdapter as any
  }

  console.log('🚀 Using full PayloadCMS configuration with database')
  return postgresAdapter({
    pool: {
      connectionString: getDatabaseConnection(),
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    push: true, // Enable push mode to auto-create admin collection schema
  })
}

export default buildConfig({
  admin: isBuildTime()
    ? undefined
    : {
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
  editor: isBuildTime() ? undefined : defaultLexical,
  db: getDatabaseConfig(),
  collections: isBuildTime()
    ? []
    : [
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
  globals: isBuildTime() ? [] : [Header, Footer],
  plugins: isBuildTime() ? [] : [...plugins],
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
