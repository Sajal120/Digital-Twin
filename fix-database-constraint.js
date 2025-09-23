/**
 * Fix Database Constraint Script
 * 
 * This script specifically fixes the constraint error without dropping all data
 */

const { Pool } = require('pg')

async function fixConstraintError() {
  if (!process.env.DATABASE_URI) {
    console.error('❌ DATABASE_URI not found in environment variables')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URI,
  })

  try {
    console.log('🔄 Connecting to database...')
    
    // Check if the problematic constraint exists
    const constraintCheck = await pool.query(`
      SELECT constraint_name, table_name 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'payload_locked_documents_rels_rag_analytics_fk'
    `)
    
    console.log('🔍 Constraint check results:', constraintCheck.rows.length)
    
    if (constraintCheck.rows.length === 0) {
      console.log('✅ Constraint does not exist, error should be resolved')
    } else {
      console.log('🗑️  Dropping problematic constraint...')
      await pool.query(`
        ALTER TABLE "payload_locked_documents_rels" 
        DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_rag_analytics_fk"
      `)
      console.log('✅ Constraint dropped successfully')
    }
    
    // Check for any orphaned records in payload_locked_documents_rels table
    const orphanCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM "payload_locked_documents_rels" 
      WHERE "payload_locked_documents_rels"."rag_analytics_id" IS NOT NULL
    `)
    
    if (orphanCheck.rows[0].count > 0) {
      console.log(`🧹 Found ${orphanCheck.rows[0].count} orphaned rag_analytics references`)
      console.log('🗑️  Removing orphaned references...')
      
      await pool.query(`
        DELETE FROM "payload_locked_documents_rels" 
        WHERE "payload_locked_documents_rels"."rag_analytics_id" IS NOT NULL
      `)
      
      console.log('✅ Orphaned references removed')
    }
    
    console.log('✅ Database constraint fix complete')
    
  } catch (error) {
    console.error('❌ Database fix failed:', error)
  } finally {
    await pool.end()
  }
}

// Load environment variables
require('dotenv').config()
fixConstraintError()