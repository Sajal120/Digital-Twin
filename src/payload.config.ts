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
  return !process.env.DATABASE_URL && !process.env.DATABASE_URI && process.env.NODE_ENV !== 'development'
}

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
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
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: getDatabaseConnection(),
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    push: true, // Enable push mode to auto-create admin collection schema
  }),
  collections: [
    // Core CMS collections
    Pages,
    Posts,
    Media,
    Categories,
    Users,
    // Portfolio Admin collections - re-enabled
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
    // storage-adapter-placeholder
  ],
  secret: getPayloadSecret(),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
})
