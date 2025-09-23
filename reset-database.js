/**
 * Database Reset Script
 * 
 * This script helps reset the database when there are constraint issues
 * Use with caution - this will delete existing data
 */

const { Pool } = require('pg')

async function resetDatabase() {
  if (!process.env.DATABASE_URI) {
    console.error('❌ DATABASE_URI not found in environment variables')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
  })

  try {
    console.log('🔄 Connecting to database...')
    
    // Get all tables that start with 'payload'
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'payload%'
    `)
    
    console.log('📋 Found Payload tables:', tablesResult.rows.length)
    
    // Drop all payload tables
    for (const row of tablesResult.rows) {
      const tableName = row.tablename
      try {
        console.log(`🗑️  Dropping table: ${tableName}`)
        await pool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`)
      } catch (error) {
        console.warn(`⚠️  Failed to drop ${tableName}:`, error.message)
      }
    }
    
    console.log('✅ Database reset complete')
    console.log('💡 Run "pnpm dev" to recreate tables with current schema')
    
  } catch (error) {
    console.error('❌ Database reset failed:', error)
  } finally {
    await pool.end()
  }
}

// Load environment variables
require('dotenv').config()
resetDatabase()