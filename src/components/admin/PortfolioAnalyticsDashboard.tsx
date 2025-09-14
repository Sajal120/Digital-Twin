'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
} from 'recharts'

interface AnalyticsData {
  totalConversations: number
  totalMessages: number
  dailyActiveUsers: number
  avgSessionDuration: number
  responseAccuracy: number
  systemHealth: {
    databaseStatus: 'healthy' | 'warning' | 'error'
    apiResponseTime: number
    errorRate: number
    storageUsage: number
  }
  popularTopics: { topic: string; count: number }[]
  dailyActivity: { date: string; messages: number; users: number }[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function PortfolioAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true)
      // This would connect to your analytics API
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      // Fallback mock data for development
      setAnalyticsData({
        totalConversations: 156,
        totalMessages: 1247,
        dailyActiveUsers: 23,
        avgSessionDuration: 4.2,
        responseAccuracy: 87.5,
        systemHealth: {
          databaseStatus: 'healthy',
          apiResponseTime: 245,
          errorRate: 2.1,
          storageUsage: 67.3,
        },
        popularTopics: [
          { topic: 'Skills', count: 45 },
          { topic: 'Experience', count: 38 },
          { topic: 'Projects', count: 32 },
          { topic: 'VR Development', count: 28 },
          { topic: 'AI/ML', count: 22 },
        ],
        dailyActivity: [
          { date: '2024-01-01', messages: 35, users: 8 },
          { date: '2024-01-02', messages: 42, users: 12 },
          { date: '2024-01-03', messages: 28, users: 6 },
          { date: '2024-01-04', messages: 56, users: 15 },
          { date: '2024-01-05', messages: 48, users: 13 },
          { date: '2024-01-06', messages: 39, users: 9 },
          { date: '2024-01-07', messages: 63, users: 18 },
        ],
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const getHealthBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500'
      case 'warning':
        return 'bg-yellow-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Failed to load analytics data</p>
        <Button onClick={fetchAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Portfolio Analytics Dashboard</h1>
        <Button onClick={fetchAnalytics} disabled={refreshing} className="min-w-[100px]">
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalConversations}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.dailyActiveUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.avgSessionDuration}min</div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Current system status and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className={getHealthBadgeColor(analyticsData.systemHealth.databaseStatus)}>
                  {analyticsData.systemHealth.databaseStatus}
                </Badge>
                <span className="text-sm">Database</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">API Response Time</div>
              <div className="font-semibold">{analyticsData.systemHealth.apiResponseTime}ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Error Rate</div>
              <div className="font-semibold">{analyticsData.systemHealth.errorRate}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Storage Usage</div>
              <div className="font-semibold">{analyticsData.systemHealth.storageUsage}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Activity</CardTitle>
            <CardDescription>Messages and users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Messages"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  name="Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Topics */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Topics</CardTitle>
            <CardDescription>Most frequently discussed topics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.popularTopics} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="topic" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Response Accuracy */}
      <Card>
        <CardHeader>
          <CardTitle>AI Response Quality</CardTitle>
          <CardDescription>Accuracy and user satisfaction metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-green-600">
                {analyticsData.responseAccuracy}%
              </div>
              <div className="text-sm text-gray-600">Response Accuracy</div>
            </div>
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Accurate', value: analyticsData.responseAccuracy },
                      { name: 'Inaccurate', value: 100 - analyticsData.responseAccuracy },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[0, 1].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
