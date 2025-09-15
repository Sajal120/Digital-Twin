import { NextRequest, NextResponse } from 'next/server'
import os from 'os'

export async function GET() {
  try {
    // Get system metrics
    const cpuUsage = await getCPUUsage()
    const memoryUsage = getMemoryUsage()
    const diskUsage = await getDiskUsage()
    const networkStats = getNetworkStats()
    const databaseMetrics = await getDatabaseMetrics()
    const apiMetrics = await getAPIMetrics()

    const currentMetrics = {
      cpu: Math.round(cpuUsage * 10) / 10,
      memory: Math.round(memoryUsage * 10) / 10,
      disk: Math.round(diskUsage * 10) / 10,
      network: networkStats,
      database: databaseMetrics,
      api: apiMetrics,
    }

    const historicalData = generateHistoricalData()

    return NextResponse.json({
      current: currentMetrics,
      historical: historicalData,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('System metrics error:', error)
    return NextResponse.json({ error: 'Failed to fetch system metrics' }, { status: 500 })
  }
}

async function getCPUUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startMeasure = process.cpuUsage()
    const startTime = Date.now()

    setTimeout(() => {
      const endMeasure = process.cpuUsage(startMeasure)
      const endTime = Date.now()

      const totalTime = (endTime - startTime) * 1000 // microseconds
      const cpuTime = endMeasure.user + endMeasure.system
      const cpuPercent = (cpuTime / totalTime) * 100

      resolve(Math.min(cpuPercent, 100))
    }, 100)
  })
}

function getMemoryUsage(): number {
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory
  return (usedMemory / totalMemory) * 100
}

async function getDiskUsage(): Promise<number> {
  // Simplified disk usage - in production you'd use a proper library
  // or system command to get actual disk usage
  try {
    const { promises: fs } = await import('fs')
    const _stats = await fs.stat(process.cwd())
    // This is a placeholder - real implementation would check actual disk space
    return Math.random() * 40 + 30 // Mock 30-70% usage
  } catch {
    return 45 // Fallback
  }
}

function getNetworkStats() {
  // Mock network stats - real implementation would track actual network I/O
  return {
    in: Math.floor(Math.random() * 2000) + 500,
    out: Math.floor(Math.random() * 1500) + 300,
  }
}

async function getDatabaseMetrics() {
  try {
    // In production, you'd query your actual database for these metrics
    // For now, we'll simulate realistic values

    const queryStartTime = Date.now()

    // Simulate a database query
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 50))

    const queryTime = Date.now() - queryStartTime

    return {
      connections: Math.floor(Math.random() * 20) + 5,
      queryTime: queryTime + Math.floor(Math.random() * 100) + 50,
      status: Math.random() > 0.1 ? 'healthy' : Math.random() > 0.5 ? 'warning' : 'critical',
    }
  } catch {
    return {
      connections: 0,
      queryTime: 0,
      status: 'critical',
    }
  }
}

async function getAPIMetrics() {
  // Mock API metrics - in production, you'd track these from your actual API
  return {
    requestsPerMinute: Math.floor(Math.random() * 200) + 50,
    averageResponseTime: Math.floor(Math.random() * 300) + 150,
    errorRate: Math.random() * 5,
  }
}

function generateHistoricalData() {
  const data = []
  const now = Date.now()

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now - i * 60 * 60 * 1000)
    data.push({
      time: time.getHours().toString().padStart(2, '0') + ':00',
      cpu: Math.random() * 30 + 30,
      memory: Math.random() * 40 + 40,
      responseTime: Math.random() * 200 + 200,
      networkIn: Math.random() * 1000 + 500,
      networkOut: Math.random() * 800 + 300,
    })
  }

  return data
}
