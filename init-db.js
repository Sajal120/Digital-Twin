import { Pool } from 'pg';
import process from 'process';
import { config } from 'dotenv';

// Load environment variables
config();

console.log('🔍 Database URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DATABASE_URI,
  ssl: { rejectUnauthorized: false },
});

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔄 Initializing messages table...');
    
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
    `);
    
    console.log('✅ Messages table initialized successfully');
    
    // Test if table exists
    const result = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'messages' AND table_schema = 'public';
    `);
    
    console.log('📋 Messages table exists:', result.rows.length > 0);
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeDatabase();