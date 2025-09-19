'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PortfolioAnalyticsDashboard from './PortfolioAnalyticsDashboard'
import RAGAnalyticsDashboard from './RAGAnalyticsDashboard'
import SystemMonitoringDashboard from './SystemMonitoringDashboard'

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('portfolio')

  return (
    <div className="admin-dashboard min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">
            Comprehensive analytics and monitoring for your AI Portfolio system
          </p>
        </div>
      </div>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="portfolio">Portfolio Analytics</TabsTrigger>
            <TabsTrigger value="rag">
              RAG System
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                Phase 1
              </span>
            </TabsTrigger>
            <TabsTrigger value="system">System Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="rag" className="space-y-6">
            <RAGAnalyticsDashboard />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <SystemMonitoringDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AdminDashboard
