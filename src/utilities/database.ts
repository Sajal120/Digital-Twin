import { Pool } from 'pg'

// Create a connection pool to Neon Postgres
// Optimized for serverless: low max connections, short timeouts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 2, // Low max for serverless (Vercel has connection limits)
  min: 0, // Allow 0 idle connections
  idleTimeoutMillis: 10000, // Close idle connections after 10s
  connectionTimeoutMillis: 5000, // 5s timeout for new connections
  // Handle connection errors gracefully
  allowExitOnIdle: true, // Allow pool to close when idle (serverless optimization)
})

// Handle pool errors to prevent crashes
pool.on('error', (err) => {
  console.error('❌ Unexpected database pool error:', err)
  // Don't crash - let the pool handle reconnection
})

// Log connection events for debugging
pool.on('connect', () => {
  console.log('✅ Database connection established')
})

pool.on('remove', () => {
  console.log('🔌 Database connection removed from pool')
})

export interface Message {
  id: number
  user_id: string | null
  role: 'system' | 'user' | 'assistant'
  content: string
  created_at: Date
}

export class ChatDatabase {
  /**
   * Initialize the messages table if it doesn't exist
   */
  static async initializeTable(): Promise<void> {
    const client = await pool.connect()

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          user_id TEXT,
          role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
      `)
      console.log('Messages table initialized successfully')
    } catch (error) {
      console.error('Error initializing messages table:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Insert a new message into the database
   */
  static async insertMessage(data: {
    user_id?: string
    role: 'system' | 'user' | 'assistant'
    content: string
  }): Promise<Message | null> {
    let client
    try {
      client = await pool.connect()

      const query = `
        INSERT INTO messages (user_id, role, content)
        VALUES ($1, $2, $3)
        RETURNING id, user_id, role, content, created_at
      `

      const values = [data.user_id || null, data.role, data.content]
      const result = await client.query(query, values)

      return result.rows[0] as Message
    } catch (error) {
      console.error('❌ Error inserting message:', error)
      console.error('   This is non-critical - continuing execution')
      return null // Return null instead of throwing
    } finally {
      if (client) {
        client.release()
      }
    }
  }

  /**
   * Get the last N messages ordered by created_at
   */
  static async getRecentMessages(limit: number = 20, userId?: string): Promise<Message[]> {
    const client = await pool.connect()

    try {
      let query = `
        SELECT id, user_id, role, content, created_at
        FROM messages
      `
      const values: any[] = []

      if (userId) {
        query += ` WHERE user_id = $1`
        values.push(userId)
        query += ` ORDER BY created_at DESC LIMIT $2`
        values.push(limit)
      } else {
        query += ` ORDER BY created_at DESC LIMIT $1`
        values.push(limit)
      }

      const result = await client.query(query, values)

      // Return messages in chronological order (oldest first)
      return result.rows.reverse() as Message[]
    } catch (error) {
      console.error('Error fetching recent messages:', error)
      throw error
    } finally {
      client.release()
    }
  }

  /**
   * Get total message count
   */
  static async getMessageCount(userId?: string): Promise<number> {
    const client = await pool.connect()

    try {
      let query = 'SELECT COUNT(*) as count FROM messages'
      const values: any[] = []

      if (userId) {
        query += ' WHERE user_id = $1'
        values.push(userId)
      }

      const result = await client.query(query, values)
      return parseInt(result.rows[0].count)
    } catch (error) {
      console.error('Error getting message count:', error)
      throw error
    } finally {
      client.release()
    }
  }
}

// Don't initialize automatically - let the API endpoint handle it
// ChatDatabase.initializeTable().catch(console.error)

export default ChatDatabase
