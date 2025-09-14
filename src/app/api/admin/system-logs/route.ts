import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const level = url.searchParams.get('level')
    const source = url.searchParams.get('source')

    // In production, this would query your actual system logs
    // For now, we'll generate mock log entries
    const logs = generateMockLogs(limit, level, source)

    return NextResponse.json({
      logs,
      total: logs.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('System logs error:', error)
    return NextResponse.json({ error: 'Failed to fetch system logs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { level, message, source, details } = body

    if (!level || !message || !source) {
      return NextResponse.json(
        { error: 'level, message, and source are required' },
        { status: 400 },
      )
    }

    // In production, you'd store this in your actual logging system
    const logEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      source,
      details: details || null,
    }

    // Here you would save to your logging system
    console.log('New log entry:', logEntry)

    return NextResponse.json(logEntry, { status: 201 })
  } catch (error) {
    console.error('Log creation error:', error)
    return NextResponse.json({ error: 'Failed to create log entry' }, { status: 500 })
  }
}

function generateMockLogs(
  limit: number,
  levelFilter?: string | null,
  sourceFilter?: string | null,
) {
  const levels = ['info', 'warning', 'error', 'critical']
  const sources = ['chat-api', 'database', 'vector-db', 'auth', 'system', 'admin-ops']
  const messages = [
    'AI chat response generated successfully',
    'Database query executed',
    'User authentication successful',
    'High memory usage detected',
    'Database connection timeout',
    'Vector embedding generation completed',
    'Admin operation performed',
    'API rate limit exceeded',
    'Backup process started',
    'System maintenance scheduled',
    'Error processing user request',
    'Cache invalidation triggered',
    'File upload completed',
    'Security scan initiated',
    'Performance monitoring alert',
  ]

  const logs = []
  const now = Date.now()

  for (let i = 0; i < limit; i++) {
    const timestamp = new Date(now - i * Math.random() * 3600000) // Random time within last hour
    const level = levels[Math.floor(Math.random() * levels.length)]
    const source = sources[Math.floor(Math.random() * sources.length)]
    const message = messages[Math.floor(Math.random() * messages.length)]

    // Apply filters
    if (levelFilter && level !== levelFilter) continue
    if (sourceFilter && source !== sourceFilter) continue

    const logEntry = {
      id: generateId(),
      timestamp: timestamp.toISOString(),
      level,
      message,
      source,
      details:
        level === 'error' || level === 'critical'
          ? generateErrorDetails()
          : level === 'warning'
            ? generateWarningDetails()
            : null,
    }

    logs.push(logEntry)
  }

  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

function generateErrorDetails() {
  const errorTypes = [
    {
      error: 'Database connection timeout',
      stack:
        'Error: Connection timeout\n    at Database.connect (/app/db.js:45:12)\n    at async handler (/app/api/route.js:23:5)',
      query: 'SELECT * FROM messages WHERE user_id = ?',
      timeout: 30000,
    },
    {
      error: 'API rate limit exceeded',
      ip: '192.168.1.' + Math.floor(Math.random() * 255),
      endpoint: '/api/chat',
      limit: 100,
      current: 150,
    },
    {
      error: 'Vector embedding generation failed',
      model: 'text-embedding-ada-002',
      input_length: Math.floor(Math.random() * 1000) + 500,
      error_code: 'EMBEDDING_TIMEOUT',
    },
  ]

  return errorTypes[Math.floor(Math.random() * errorTypes.length)]
}

function generateWarningDetails() {
  const warningTypes = [
    {
      metric: 'memory_usage',
      current: Math.floor(Math.random() * 20) + 70,
      threshold: 80,
      unit: 'percent',
    },
    {
      metric: 'response_time',
      current: Math.floor(Math.random() * 200) + 400,
      threshold: 500,
      unit: 'milliseconds',
    },
    {
      metric: 'disk_space',
      current: Math.floor(Math.random() * 15) + 80,
      threshold: 90,
      unit: 'percent',
    },
  ]

  return warningTypes[Math.floor(Math.random() * warningTypes.length)]
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}
