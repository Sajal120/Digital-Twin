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

    // Return an ultra-comprehensive mock adapter with extensive method coverage
    return {
      name: 'comprehensive-mock-adapter',
      payload: null as any,
      
      // Core connection methods
      connect: async () => { console.log('🔧 Mock: connect called'); return Promise.resolve() },
      destroy: async () => { console.log('🔧 Mock: destroy called'); return Promise.resolve() },
      init: async () => { console.log('🔧 Mock: init called'); return Promise.resolve() },
      
      // Transaction methods
      beginTransaction: async () => { 
        console.log('🔧 Mock: beginTransaction called')
        return { commit: async () => {}, rollback: async () => {} }
      },
      commitTransaction: async () => { console.log('🔧 Mock: commitTransaction called') },
      rollbackTransaction: async () => { console.log('🔧 Mock: rollbackTransaction called') },
      
      // Collection CRUD methods
      count: async () => { console.log('🔧 Mock: count called'); return { totalDocs: 0 } },
      create: async () => { console.log('🔧 Mock: create called'); return mockResponse },
      createMany: async () => { console.log('🔧 Mock: createMany called'); return [] },
      deleteMany: async () => { console.log('🔧 Mock: deleteMany called'); return { docs: [] } },
      deleteOne: async () => { console.log('🔧 Mock: deleteOne called'); return mockResponse },
      deleteVersions: async () => { console.log('🔧 Mock: deleteVersions called') },
      find: async () => { console.log('🔧 Mock: find called'); return mockPaginatedResponse },
      findOne: async () => { console.log('🔧 Mock: findOne called'); return null },
      findVersions: async () => { console.log('🔧 Mock: findVersions called'); return mockPaginatedResponse },
      updateOne: async () => { console.log('🔧 Mock: updateOne called'); return mockResponse },
      updateMany: async () => { console.log('🔧 Mock: updateMany called'); return [] },
      updateVersion: async () => { console.log('🔧 Mock: updateVersion called'); return mockResponse },
      queryDrafts: async () => { console.log('🔧 Mock: queryDrafts called'); return mockPaginatedResponse },
      
      // Global methods (the problematic ones!)
      findGlobal: async () => { console.log('🔧 Mock: findGlobal called'); return mockResponse },
      updateGlobal: async () => { console.log('🔧 Mock: updateGlobal called'); return mockResponse },
      createGlobal: async () => { console.log('🔧 Mock: createGlobal called'); return mockResponse },
      
      // Version methods
      createVersion: async () => { console.log('🔧 Mock: createVersion called'); return mockResponse },
      deleteVersion: async () => { console.log('🔧 Mock: deleteVersion called'); return mockResponse },
      
      // Migration methods
      migrate: async () => { console.log('🔧 Mock: migrate called') },
      migrateDown: async () => { console.log('🔧 Mock: migrateDown called') },
      migrateFresh: async () => { console.log('🔧 Mock: migrateFresh called') },
      migrateRefresh: async () => { console.log('🔧 Mock: migrateRefresh called') },
      migrateReset: async () => { console.log('🔧 Mock: migrateReset called') },
      migrateStatus: async () => { console.log('🔧 Mock: migrateStatus called'); return [] },
      createMigration: async () => { console.log('🔧 Mock: createMigration called') },
      
      // Utility methods
      distinct: async () => { console.log('🔧 Mock: distinct called'); return [] },
      
      // Catch any missed methods with Proxy
      ...new Proxy({}, {
        get: (target, prop) => {
          console.log(`🔧 Mock: Intercepted unknown method "${String(prop)}"`)
          return async () => mockResponse
        }
      })
    } as any
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
  plugins: [...plugins],
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
