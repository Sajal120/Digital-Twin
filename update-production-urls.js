#!/usr/bin/env node

/**
 * Production URL Update Script
 * ===========================
 * 
 * This script helps you update localhost URLs to your production domain
 * Run this after you know your Vercel production URL
 * 
 * Usage:
 *   node update-production-urls.js https://your-app-name.vercel.app
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const PRODUCTION_URL = process.argv[2]

if (!PRODUCTION_URL) {
  console.error('❌ Please provide your production URL as an argument')
  console.log('Usage: node update-production-urls.js https://your-app-name.vercel.app')
  process.exit(1)
}

// Validate URL format
try {
  new URL(PRODUCTION_URL)
} catch (error) {
  console.error('❌ Invalid URL format. Please provide a valid URL like: https://your-app-name.vercel.app')
  process.exit(1)
}

console.log(`🔧 Updating URLs to: ${PRODUCTION_URL}`)

// Files to update (excluding documentation files)
const filesToUpdate = [
  '.env.production',
  'PRODUCTION_DEPLOYMENT_GUIDE.md'
]

let updatedFiles = 0

filesToUpdate.forEach(file => {
  const filePath = resolve(file)
  
  try {
    let content = readFileSync(filePath, 'utf8')
    const originalContent = content
    
    // Replace placeholder URLs
    content = content.replace(/https:\/\/your-app-name\.vercel\.app/g, PRODUCTION_URL)
    
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Updated ${file}`)
      updatedFiles++
    } else {
      console.log(`⚠️  No changes needed in ${file}`)
    }
    
  } catch (error) {
    console.log(`⚠️  Skipped ${file} (file not found or not accessible)`)
  }
})

console.log(`\n🎉 Updated ${updatedFiles} files with production URL: ${PRODUCTION_URL}`)
console.log('\n📝 Next steps:')
console.log('1. Update OAuth provider redirect URIs with the new production URL')
console.log('2. Set environment variables in Vercel dashboard')
console.log('3. Deploy to Vercel')
console.log('4. Test all OAuth integrations')

console.log('\n🔗 OAuth Provider URLs to update:')
console.log(`- Google Console: ${PRODUCTION_URL}/api/auth/callback/google`)
console.log(`- LinkedIn Portal: ${PRODUCTION_URL}/api/auth/linkedin/callback`) 
console.log(`- GitHub OAuth App: ${PRODUCTION_URL}/api/auth/github/callback`)