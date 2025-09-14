'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: {
    in: number
    out: number
  }
  database: {
    connections: number
    queryTime: number
    status: 'healthy' | 'warning' | 'critical'
  }
  api: {
    requestsPerMinute: number
    averageResponseTime: number
    errorRate: number
  }
}

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  source: string
  details?: any
}

export default function SystemMonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/admin/system-metrics')
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.current)
        setHistoricalData(data.historical)
      }
    } catch (error) {
      console.error('Failed to fetch system metrics:', error)
      // Mock data for development
      setMetrics({
        cpu: 45.2,
        memory: 67.8,
        disk: 34.5,
        network: { in: 1250, out: 890 },
        database: {
          connections: 12,
          queryTime: 145,
          status: 'healthy',
        },
        api: {
          requestsPerMinute: 145,
          averageResponseTime: 340,
          errorRate: 2.1,
        },
      })
      setHistoricalData(generateHistoricalData())
    }
  }

  const fetchRecentLogs = async () => {
    try {
      const response = await fetch('/api/admin/system-logs?limit=50')
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs)
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      // Mock logs for development
      setLogs([
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'AI chat response generated successfully',
          source: 'chat-api',
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'warning',
          message: 'High memory usage detected',
          source: 'system',
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'error',
          message: 'Database connection timeout',
          source: 'database',
          details: { timeout: 30000, query: 'SELECT * FROM messages' },
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemMetrics()
    fetchRecentLogs()

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchSystemMetrics()
        fetchRecentLogs()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'critical':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'bg-blue-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      case 'critical':
        return 'bg-red-700'
      default:
        return 'bg-gray-500'
    }
  }

  const getMetricColor = (value: number, type: 'percentage' | 'response_time' | 'error_rate') => {
    if (type === 'percentage') {
      if (value > 80) return 'text-red-600'
      if (value > 60) return 'text-yellow-600'
      return 'text-green-600'
    }
    if (type === 'response_time') {
      if (value > 500) return 'text-red-600'
      if (value > 300) return 'text-yellow-600'
      return 'text-green-600'
    }
    if (type === 'error_rate') {
      if (value > 5) return 'text-red-600'
      if (value > 2) return 'text-yellow-600'
      return 'text-green-600'
    }
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading system metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">System Monitoring</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? 'default' : 'outline'}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            onClick={() => {
              fetchSystemMetrics()
              fetchRecentLogs()
            }}
          >
            Refresh Now
          </Button>
        </div>
      </div>

      {metrics && (
        <>
          {/* System Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getMetricColor(metrics.cpu, 'percentage')}`}>
                  {metrics.cpu}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${getMetricColor(metrics.memory, 'percentage')}`}
                >
                  {metrics.memory}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getMetricColor(metrics.disk, 'percentage')}`}>
                  {metrics.disk}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">DB Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(metrics.database.status)}>
                    {metrics.database.status}
                  </Badge>
                  <span className="text-sm">{metrics.database.connections} conn</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* API Performance */}
          <Card>
            <CardHeader>
              <CardTitle>API Performance</CardTitle>
              <CardDescription>Real-time API metrics and performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Requests per Minute</div>
                  <div className="text-2xl font-bold">{metrics.api.requestsPerMinute}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Avg Response Time</div>
                  <div
                    className={`text-2xl font-bold ${getMetricColor(metrics.api.averageResponseTime, 'response_time')}`}
                  >
                    {metrics.api.averageResponseTime}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Error Rate</div>
                  <div
                    className={`text-2xl font-bold ${getMetricColor(metrics.api.errorRate, 'error_rate')}`}
                  >
                    {metrics.api.errorRate}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historical Data and Logs */}
          <Tabs defaultValue="performance" className="w-full">
            <TabsList>
              <TabsTrigger value="performance">Performance History</TabsTrigger>
              <TabsTrigger value="network">Network Activity</TabsTrigger>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>
                    CPU, Memory, and Response Time over the last 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="cpu"
                        stroke="#8884d8"
                        strokeWidth={2}
                        name="CPU %"
                      />
                      <Line
                        type="monotone"
                        dataKey="memory"
                        stroke="#82ca9d"
                        strokeWidth={2}
                        name="Memory %"
                      />
                      <Line
                        type="monotone"
                        dataKey="responseTime"
                        stroke="#ffc658"
                        strokeWidth={2}
                        name="Response Time (ms)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="network">
              <Card>
                <CardHeader>
                  <CardTitle>Network Activity</CardTitle>
                  <CardDescription>Incoming and outgoing network traffic</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="networkIn"
                        stackId="1"
                        stroke="#8884d8"
                        fill="#8884d8"
                        name="Incoming (KB/s)"
                      />
                      <Area
                        type="monotone"
                        dataKey="networkOut"
                        stackId="1"
                        stroke="#82ca9d"
                        fill="#82ca9d"
                        name="Outgoing (KB/s)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Recent System Logs</CardTitle>
                  <CardDescription>Latest system events and error messages</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Badge className={getLevelColor(log.level)}>{log.level}</Badge>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                            <span>•</span>
                            <span>{log.source}</span>
                          </div>
                          <div className="text-sm font-medium mt-1">{log.message}</div>
                          {log.details && (
                            <div className="text-xs text-gray-500 mt-1">
                              <pre className="whitespace-pre-wrap">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}

function generateHistoricalData() {
  const data = []
  const now = Date.now()

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now - i * 60 * 60 * 1000)
    data.push({
      time: time.toLocaleTimeString(),
      cpu: Math.random() * 30 + 30,
      memory: Math.random() * 40 + 40,
      responseTime: Math.random() * 200 + 200,
      networkIn: Math.random() * 1000 + 500,
      networkOut: Math.random() * 800 + 300,
    })
  }

  return data
}
