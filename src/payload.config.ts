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

  if (!dbUrl) {
    throw new Error('DATABASE_URL or DATABASE_URI environment variable is required')
  }

  return dbUrl
}

// Create database configuration based on environment
const getDatabaseConfig = () => {
  console.log('� Using full PayloadCMS configuration with Neon PostgreSQL database')
  return postgresAdapter({
    pool: {
      connectionString: getDatabaseConnection(),
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    push: false, // Disable push mode for production safety
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
