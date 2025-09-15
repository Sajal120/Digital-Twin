// Check all possible regions and database configurations
import { Index } from '@upstash/vector'
import dotenv from 'dotenv'

dotenv.config()

async function checkAllRegions() {
  try {
    console.log('🌍 CHECKING ALL POSSIBLE UPSTASH REGIONS')
    console.log('=======================================')

    const url = process.env.UPSTASH_VECTOR_REST_URL // https://funny-koala-46921-us1-vector.upstash.io

    // Parse the current URL to understand the structure
    console.log('📋 CURRENT DATABASE URL ANALYSIS:')
    console.log('URL:', url)

    // Extract parts: https://[name]-[id]-[region]-vector.upstash.io
    const urlParts = url.replace('https://', '').replace('-vector.upstash.io', '').split('-')
    console.log('URL Parts:', urlParts)

    const databaseName = urlParts[0] + '-' + urlParts[1] // "funny-koala"
    const databaseId = urlParts[2] // "46921"
    const currentRegion = urlParts[3] // "us1"

    console.log('Database Name Pattern:', databaseName)
    console.log('Database ID:', databaseId)
    console.log('Current Region Code:', currentRegion)
    console.log('')

    // Test current connection to get database specs
    const index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })

    const info = await index.info()
    console.log('✅ CONFIRMED DATABASE SPECS:')
    console.log('Vector Count:', info.vectorCount)
    console.log('Embedding Model:', info.denseIndex?.embeddingModel)
    console.log('Dimensions:', info.dimension)
    console.log('Similarity:', info.similarityFunction)
    console.log('')

    console.log('🎯 UPSTASH REGIONS TO CHECK:')
    console.log('===========================')

    const regions = [
      { code: 'us1', name: 'US East (Virginia)', console: 'us-east-1' },
      { code: 'us2', name: 'US West (Oregon)', console: 'us-west-1' },
      { code: 'eu1', name: 'EU (Ireland)', console: 'eu-west-1' },
      { code: 'eu2', name: 'EU (Frankfurt)', console: 'eu-central-1' },
      { code: 'ap1', name: 'Asia Pacific (Singapore)', console: 'ap-southeast-1' },
      { code: 'ap2', name: 'Asia Pacific (Tokyo)', console: 'ap-northeast-1' },
    ]

    regions.forEach((region, i) => {
      const isCurrentRegion = region.code === currentRegion
      console.log(`${i + 1}. ${region.name} (${region.code})`)
      console.log(`   Console shows as: ${region.console}`)
      if (isCurrentRegion) {
        console.log('   ✅ YOUR DATABASE IS HERE!')
      }
      console.log('')
    })

    console.log('🔍 HOW TO CHECK EACH REGION:')
    console.log('============================')
    console.log('1. Go to: https://console.upstash.com/vector')
    console.log('2. Look at the region filter/selector')
    console.log('3. Switch to different regions and check for:')
    console.log(`   - Database with ${info.vectorCount} vectors`)
    console.log(`   - ${info.denseIndex?.embeddingModel} embedding model`)
    console.log(`   - Name containing "${databaseName}" or "${databaseId}"`)
    console.log('')

    console.log('🎯 SPECIFIC REGION TO CHECK:')
    console.log('============================')
    const currentRegionInfo = regions.find((r) => r.code === currentRegion)
    if (currentRegionInfo) {
      console.log(`Your database should be in: ${currentRegionInfo.name}`)
      console.log(`Console region: ${currentRegionInfo.console}`)
      console.log(
        `Look for region labeled: "${currentRegionInfo.console}" or "${currentRegionInfo.name}"`,
      )
    }
    console.log('')

    console.log('🔧 CONSOLE REGION SELECTOR:')
    console.log('===========================')
    console.log('In the Upstash console, look for:')
    console.log('- A region dropdown/filter')
    console.log('- Tabs for different regions')
    console.log('- "All regions" vs specific region view')
    console.log("- Make sure you're not filtered to a specific region")
    console.log('')

    console.log('💡 ALTERNATIVE APPROACH:')
    console.log('========================')
    console.log("If you still can't find it:")
    console.log('1. Create a NEW vector database in the console')
    console.log('2. Note its URL format and compare to yours')
    console.log('3. This will help identify the naming pattern')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkAllRegions()
