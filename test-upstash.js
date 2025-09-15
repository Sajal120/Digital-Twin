// Test Upstash Vector connection directly
async function testUpstash() {
  const UPSTASH_URL = 'https://funny-koala-46921-us1-vector.upstash.io'
  const UPSTASH_TOKEN =
    'ABUFMGZ1bm55LWtvYWxhLTQ2OTIxLXVzMWFkbWluTTJWa016TmxNamN0WkdZeFlTMDBOV1V6TFRneFpHWXRZVGd5TkdabFltTmhORGN5'

  console.log('Testing Upstash connection...')
  console.log('URL:', UPSTASH_URL)
  console.log('Token length:', UPSTASH_TOKEN.length)

  try {
    const response = await fetch(`${UPSTASH_URL}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: 'How do you structure Terraform?',
        topK: 3,
        includeMetadata: true,
      }),
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const data = await response.json()
      console.log('Success! Response data:', JSON.stringify(data, null, 2))
    } else {
      const errorText = await response.text()
      console.log('Error response:', errorText)
    }
  } catch (error) {
    console.error('Network error:', error.message)
  }
}

testUpstash()
