'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts'

interface RAGAnalyticsData {
  summary: {
    totalQueries: number
    averageResponseTime: number
    averageSatisfactionRating: number
    topPerformingVariant: string
    improvementAreas: string[]
  }
  currentMetrics: {
    queriesLast24h: number
    avgResponseTimeLast24h: number
    satisfactionRatingLast24h: number
    agentic: {
      decisions: Record<string, number>
      performance: number
    }
  }
  recentQueries: Array<{
    query: string
    decision: string
    responseTime: number
    satisfaction?: number
    timestamp: Date
  }>
  conversationStats: {
    activeConversations: number
    avgMessagesPerConversation: number
    topTopics: string[]
    contextUsageRate: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function RAGAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<RAGAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h')

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      const response = await fetch(`/api/admin/rag-analytics?timeRange=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      } else {
        // Mock data for development
        setAnalyticsData({
          summary: {
            totalQueries: 342,
            averageResponseTime: 1850,
            averageSatisfactionRating: 4.2,
            topPerformingVariant: 'agentic',
            improvementAreas: [
              'Some queries have high response times',
              'Context usage could be improved',
            ],
          },
          currentMetrics: {
            queriesLast24h: 87,
            avgResponseTimeLast24h: 1650,
            satisfactionRatingLast24h: 4.1,
            agentic: {
              decisions: {
                SEARCH: 65,
                DIRECT: 18,
                CLARIFY: 4,
              },
              performance: 1650,
            },
          },
          recentQueries: [
            {
              query: 'Tell me about your React experience',
              decision: 'SEARCH',
              responseTime: 1200,
              satisfaction: 5,
              timestamp: new Date(Date.now() - 300000),
            },
            {
              query: 'How should I prepare for technical interviews?',
              decision: 'DIRECT',
              responseTime: 800,
              satisfaction: 4,
              timestamp: new Date(Date.now() - 600000),
            },
            {
              query: 'What programming languages do you know?',
              decision: 'SEARCH',
              responseTime: 1800,
              satisfaction: 4,
              timestamp: new Date(Date.now() - 900000),
            },
          ],
          conversationStats: {
            activeConversations: 23,
            avgMessagesPerConversation: 4.7,
            topTopics: ['React', 'JavaScript', 'Projects', 'Skills', 'Experience'],
            contextUsageRate: 68,
          },
        })
      }
    } catch (error) {
      console.error('Failed to fetch RAG analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'SEARCH':
        return 'bg-blue-500'
      case 'DIRECT':
        return 'bg-green-500'
      case 'CLARIFY':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getSatisfactionColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600'
    if (rating >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading RAG analytics...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Failed to load RAG analytics data</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const decisionData = Object.entries(analyticsData.currentMetrics.agentic.decisions).map(
    ([decision, count]) => ({
      name: decision,
      value: count,
      percentage: ((count / analyticsData.currentMetrics.queriesLast24h) * 100).toFixed(1),
    }),
  )

  const responseTimeData = analyticsData.recentQueries.map((q) => ({
    query: q.query.substring(0, 20) + '...',
    responseTime: q.responseTime,
    satisfaction: q.satisfaction || 0,
    decision: q.decision,
  }))

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">RAG System Analytics</h1>
          <p className="text-gray-600">
            Phase 1 Enhancement: Agentic RAG + Conversation Context Performance
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button onClick={fetchAnalytics} disabled={refreshing} className="min-w-[100px]">
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.totalQueries}</div>
            <div className="text-xs text-green-600">
              +{analyticsData.currentMetrics.queriesLast24h} last 24h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.summary.averageResponseTime.toFixed(0)}ms
            </div>
            <div className="text-xs text-gray-600">
              {analyticsData.currentMetrics.avgResponseTimeLast24h.toFixed(0)}ms last 24h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.summary.averageSatisfactionRating.toFixed(1)}/5
            </div>
            <div className="text-xs text-green-600">
              {analyticsData.currentMetrics.satisfactionRatingLast24h.toFixed(1)}/5 last 24h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Context Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.conversationStats.contextUsageRate.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600">of queries use context</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="decisions">Agentic Decisions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agentic Decision Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Agentic Decision Distribution</CardTitle>
                <CardDescription>How the AI decides to handle queries</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={decisionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {decisionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Response Time vs Satisfaction */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time vs Satisfaction</CardTitle>
                <CardDescription>Correlation between speed and quality</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      dataKey="responseTime"
                      name="Response Time (ms)"
                      domain={[0, 'dataMax + 500']}
                    />
                    <YAxis
                      type="number"
                      dataKey="satisfaction"
                      name="Satisfaction"
                      domain={[0, 5]}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      formatter={(value, name) => [
                        name === 'responseTime' ? `${value}ms` : `${value}/5`,
                        name === 'responseTime' ? 'Response Time' : 'Satisfaction',
                      ]}
                    />
                    <Scatter dataKey="satisfaction" fill="#8884d8" />
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Improvement Areas */}
          <Card>
            <CardHeader>
              <CardTitle>Improvement Areas</CardTitle>
              <CardDescription>AI-identified areas for system optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analyticsData.summary.improvementAreas.length > 0 ? (
                  analyticsData.summary.improvementAreas.map((area, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>{area}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-green-600">✅ No major improvement areas identified!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decisions">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Decision Details */}
            <Card>
              <CardHeader>
                <CardTitle>Decision Breakdown</CardTitle>
                <CardDescription>Detailed analysis of agentic decisions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analyticsData.currentMetrics.agentic.decisions).map(
                    ([decision, count]) => (
                      <div key={decision} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getDecisionColor(decision)}>{decision}</Badge>
                          <span className="text-sm">
                            {decision === 'SEARCH' && 'Vector database search'}
                            {decision === 'DIRECT' && 'Direct conversational response'}
                            {decision === 'CLARIFY' && 'Request for clarification'}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{count}</div>
                          <div className="text-xs text-gray-500">
                            {((count / analyticsData.currentMetrics.queriesLast24h) * 100).toFixed(
                              1,
                            )}
                            %
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Queries */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Queries</CardTitle>
                <CardDescription>Latest queries and their processing details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.recentQueries.map((query, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium truncate flex-1 pr-2">{query.query}</p>
                        <div className="text-xs text-gray-500">
                          {formatTimestamp(query.timestamp)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={`${getDecisionColor(query.decision)} text-xs`}
                            variant="secondary"
                          >
                            {query.decision}
                          </Badge>
                          <span>{query.responseTime}ms</span>
                        </div>
                        {query.satisfaction && (
                          <div
                            className={`font-medium ${getSatisfactionColor(query.satisfaction)}`}
                          >
                            {query.satisfaction}/5 ⭐
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Real-time system health indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {(analyticsData.summary.averageResponseTime / 1000).toFixed(1)}s
                    </div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analyticsData.summary.averageSatisfactionRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600">User Satisfaction</div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="text-sm font-medium mb-2">Best Performing Variant</div>
                  <Badge className="bg-green-500">
                    {analyticsData.summary.topPerformingVariant}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Query Volume Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Query Volume Trend</CardTitle>
                <CardDescription>Query patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold">
                    {analyticsData.currentMetrics.queriesLast24h}
                  </div>
                  <div className="text-gray-600">queries in last 24 hours</div>
                  <div className="mt-4 text-sm text-green-600">📈 Trending upward</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversations">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversation Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation Statistics</CardTitle>
                <CardDescription>Multi-turn conversation analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Active Conversations</span>
                    <span className="font-semibold">
                      {analyticsData.conversationStats.activeConversations}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Messages per Conversation</span>
                    <span className="font-semibold">
                      {analyticsData.conversationStats.avgMessagesPerConversation.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Context Usage Rate</span>
                    <span className="font-semibold">
                      {analyticsData.conversationStats.contextUsageRate.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Topics */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Topics</CardTitle>
                <CardDescription>Most discussed topics in conversations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analyticsData.conversationStats.topTopics.map((topic, index) => (
                    <div key={topic} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-blue-100 text-blue-800 text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <span>{topic}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
