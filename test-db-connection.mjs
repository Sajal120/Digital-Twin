import { Pool } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config()

console.log('Testing database connection...')
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 5000,
})

async function testConnection() {
  let client
  try {
    console.log('Attempting to connect...')
    client = await pool.connect()
    console.log('✅ Connected successfully!')
    
    const result = await client.query('SELECT NOW()')
    console.log('✅ Query successful:', result.rows[0])
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
  } finally {
    if (client) {
      client.release()
    }
    await pool.end()
    process.exit(0)
  }
}

testConnection()