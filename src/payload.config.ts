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
  // Check for Vercel build environment
  const isVercelBuild = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production'

  // Check for CI environments or build without database
  const isCIBuild = process.env.CI === 'true' || process.env.NODE_ENV === 'production'

  // Check if we don't have a database URL available
  const hasNoDatabase = !process.env.DATABASE_URL && !process.env.DATABASE_URI

  return (isVercelBuild && hasNoDatabase) || (isCIBuild && hasNoDatabase)
}

// Create database configuration based on environment
const getDatabaseConfig = () => {
  // For build time without database, skip database entirely
  if (isBuildTime()) {
    console.log('🔧 Using build-time PayloadCMS configuration (database-free)')
    // Return a comprehensive mock adapter with all required methods
    return {
      name: 'mock-adapter',
      payload: null as any,
      
      // Transaction methods
      beginTransaction: async () => ({ commit: async () => {}, rollback: async () => {} }),
      commitTransaction: async () => {},
      rollbackTransaction: async () => {},
      
      // Connection methods
      connect: async () => {},
      destroy: async () => {},
      init: async () => {},
      
      // Collection methods
      count: async () => ({ totalDocs: 0 }),
      create: async () => ({ id: 'mock', createdAt: new Date(), updatedAt: new Date() }),
      deleteMany: async () => ({ docs: [] }),
      deleteOne: async () => ({ id: 'mock' }),
      deleteVersions: async () => {},
      find: async () => ({
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
      }),
      findOne: async () => null,
      findVersions: async () => ({
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
      }),
      updateOne: async () => ({ id: 'mock', createdAt: new Date(), updatedAt: new Date() }),
      updateVersion: async () => ({ id: 'mock', createdAt: new Date(), updatedAt: new Date() }),
      queryDrafts: async () => ({ docs: [], totalDocs: 0 }),
      
      // Global methods (this is what was missing!)
      findGlobal: async () => ({ id: 'mock', createdAt: new Date(), updatedAt: new Date() }),
      updateGlobal: async () => ({ id: 'mock', createdAt: new Date(), updatedAt: new Date() }),
      
      // Migration methods
      migrate: async () => {},
      migrateDown: async () => {},
      migrateFresh: async () => {},
      migrateRefresh: async () => {},
      migrateReset: async () => {},
      migrateStatus: async () => [],
      
      // Additional methods that might be called
      createGlobal: async () => ({ id: 'mock', createdAt: new Date(), updatedAt: new Date() }),
      createVersion: async () => ({ id: 'mock', createdAt: new Date(), updatedAt: new Date() }),
      deleteVersion: async () => ({ id: 'mock' }),
      distinct: async () => [],
      
      // Session methods
      createMigration: async () => {},
      
      // Batch methods
      createMany: async () => [],
      updateMany: async () => [],
    } as any
  }

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
