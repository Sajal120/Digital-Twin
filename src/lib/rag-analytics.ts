/**
 * RAG Performance Analytics & A/B Testing
 * ======================================
 *
 * Phase 1 Enhancement: Track response quality metrics and enable A/B testing
 * for continuous improvement of the RAG system.
 *
 * Features:
 * - Response Quality Metrics
 * - A/B Testing Framework
 * - Performance Analytics
 * - User Satisfaction Tracking
 */

import { promises as fs } from 'fs'
import path from 'path'

export interface RAGPerformanceMetrics {
  queryId: string
  sessionId: string
  timestamp: Date

  // Input metrics
  originalQuery: string
  enhancedQuery: string
  interviewType: string
  isFollowUp: boolean

  // Processing metrics
  agenticDecision: 'SEARCH' | 'DIRECT' | 'CLARIFY'
  agenticConfidence: number
  processingTimeMs: number
  vectorSearchTime: number
  responseFormattingTime: number

  // Output metrics
  response: string
  responseLength: number
  resultsFound: number

  // Quality indicators
  userSatisfactionRating?: number // 1-5 scale
  userClickedHelpful?: boolean
  followUpQuestionAsked?: boolean
  conversationContinued?: boolean

  // System info
  modelUsed?: string
  tokensUsed?: number
  cacheHit?: boolean
}

export interface ABTestVariant {
  name: string
  description: string
  enabled: boolean
  trafficPercentage: number
  config: {
    useAgenticRAG?: boolean
    useConversationContext?: boolean
    temperature?: number
    maxTokens?: number
    searchTopK?: number
  }
}

export class RAGAnalytics {
  private metricsBuffer: RAGPerformanceMetrics[] = []
  private readonly maxBufferSize = 100
  private readonly logFile = './rag-analytics.jsonl'

  // A/B Testing variants
  private abTestVariants: ABTestVariant[] = [
    {
      name: 'control',
      description: 'Original enhanced RAG without agentic decision making',
      enabled: true,
      trafficPercentage: 30,
      config: {
        useAgenticRAG: false,
        useConversationContext: false,
        temperature: 0.7,
        maxTokens: 150,
        searchTopK: 3,
      },
    },
    {
      name: 'agentic',
      description: 'Agentic RAG with intelligent search decisions',
      enabled: true,
      trafficPercentage: 35,
      config: {
        useAgenticRAG: true,
        useConversationContext: false,
        temperature: 0.7,
        maxTokens: 150,
        searchTopK: 5,
      },
    },
    {
      name: 'contextual',
      description: 'Full Phase 1: Agentic RAG + Conversation Context',
      enabled: true,
      trafficPercentage: 35,
      config: {
        useAgenticRAG: true,
        useConversationContext: true,
        temperature: 0.7,
        maxTokens: 150,
        searchTopK: 5,
      },
    },
  ]

  /**
   * Record performance metrics for a RAG query
   */
  async recordQuery(metrics: RAGPerformanceMetrics): Promise<void> {
    // Add to memory buffer
    this.metricsBuffer.push(metrics)

    // Flush to disk if buffer is full
    if (this.metricsBuffer.length >= this.maxBufferSize) {
      await this.flushMetrics()
    }
  }

  /**
   * Get A/B test variant for a session
   */
  getABTestVariant(sessionId: string): ABTestVariant {
    // Use deterministic hash of sessionId for consistent assignment
    const hash = this.hashString(sessionId)
    const percentage = hash % 100

    let cumulativePercentage = 0
    for (const variant of this.abTestVariants) {
      if (!variant.enabled) continue

      cumulativePercentage += variant.trafficPercentage
      if (percentage < cumulativePercentage) {
        return variant
      }
    }

    // Fallback to control
    return this.abTestVariants[0]
  }

  /**
   * Record user feedback for a query
   */
  async recordFeedback(
    queryId: string,
    feedback: {
      satisfactionRating?: number
      clickedHelpful?: boolean
      followUpAsked?: boolean
      conversationContinued?: boolean
    },
  ): Promise<void> {
    // Update metrics in buffer
    const metric = this.metricsBuffer.find((m) => m.queryId === queryId)
    if (metric) {
      metric.userSatisfactionRating = feedback.satisfactionRating
      metric.userClickedHelpful = feedback.clickedHelpful
      metric.followUpQuestionAsked = feedback.followUpAsked
      metric.conversationContinued = feedback.conversationContinued
    }

    // Also try to update in persistent storage
    try {
      await this.updateFeedbackInFile(queryId, feedback)
    } catch (error) {
      console.error('Failed to update feedback in file:', error)
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport(daysBack: number = 7): Promise<{
    summary: {
      totalQueries: number
      averageResponseTime: number
      averageSatisfactionRating: number
      topPerformingVariant: string
      improvementAreas: string[]
    }
    byVariant: Record<
      string,
      {
        queries: number
        avgResponseTime: number
        avgSatisfaction: number
        searchDecisions: Record<string, number>
        successRate: number
      }
    >
    trends: {
      queryVolume: Array<{ date: string; count: number }>
      satisfactionTrend: Array<{ date: string; rating: number }>
      performanceTrend: Array<{ date: string; avgTime: number }>
    }
  }> {
    const metrics = await this.loadMetrics(daysBack)

    // Calculate summary metrics
    const totalQueries = metrics.length
    const averageResponseTime =
      metrics.reduce((sum, m) => sum + m.processingTimeMs, 0) / totalQueries
    const ratingsWithFeedback = metrics.filter((m) => m.userSatisfactionRating)
    const averageSatisfactionRating =
      ratingsWithFeedback.length > 0
        ? ratingsWithFeedback.reduce((sum, m) => sum + (m.userSatisfactionRating || 0), 0) /
          ratingsWithFeedback.length
        : 0

    // Analyze by variant (would need variant info in metrics)
    const byVariant: Record<string, any> = {}

    // For now, simulate variant analysis based on agentic decisions
    const agenticQueries = metrics.filter((m) => m.agenticDecision !== 'SEARCH')
    const regularQueries = metrics.filter((m) => m.agenticDecision === 'SEARCH')

    byVariant.agentic = {
      queries: agenticQueries.length,
      avgResponseTime:
        agenticQueries.reduce((sum, m) => sum + m.processingTimeMs, 0) /
        (agenticQueries.length || 1),
      avgSatisfaction: this.calculateAvgSatisfaction(agenticQueries),
      searchDecisions: this.groupBy(agenticQueries, 'agenticDecision'),
      successRate: this.calculateSuccessRate(agenticQueries),
    }

    byVariant.regular = {
      queries: regularQueries.length,
      avgResponseTime:
        regularQueries.reduce((sum, m) => sum + m.processingTimeMs, 0) /
        (regularQueries.length || 1),
      avgSatisfaction: this.calculateAvgSatisfaction(regularQueries),
      searchDecisions: this.groupBy(regularQueries, 'agenticDecision'),
      successRate: this.calculateSuccessRate(regularQueries),
    }

    // Identify top performing variant
    const topPerformingVariant =
      Object.entries(byVariant).sort(
        ([, a], [, b]) => b.avgSatisfaction - a.avgSatisfaction,
      )[0]?.[0] || 'regular'

    // Generate improvement areas
    const improvementAreas = this.identifyImprovementAreas(metrics)

    return {
      summary: {
        totalQueries,
        averageResponseTime,
        averageSatisfactionRating,
        topPerformingVariant,
        improvementAreas,
      },
      byVariant,
      trends: this.generateTrends(metrics),
    }
  }

  /**
   * Get real-time performance dashboard data
   */
  async getDashboardData(): Promise<{
    currentMetrics: {
      queriesLast24h: number
      avgResponseTimeLast24h: number
      satisfactionRatingLast24h: number
      agentic: { decisions: Record<string, number>; performance: number }
    }
    recentQueries: Array<{
      query: string
      decision: string
      responseTime: number
      satisfaction?: number
      timestamp: Date
    }>
  }> {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const recentMetrics = await this.loadMetrics(1)
    const last24hMetrics = recentMetrics.filter((m) => m.timestamp >= last24h)

    const agenticDecisions = this.groupBy(last24hMetrics, 'agenticDecision')
    const agenticPerformance =
      last24hMetrics.length > 0
        ? last24hMetrics.reduce((sum, m) => sum + m.processingTimeMs, 0) / last24hMetrics.length
        : 0

    return {
      currentMetrics: {
        queriesLast24h: last24hMetrics.length,
        avgResponseTimeLast24h: agenticPerformance,
        satisfactionRatingLast24h: this.calculateAvgSatisfaction(last24hMetrics),
        agentic: {
          decisions: agenticDecisions,
          performance: agenticPerformance,
        },
      },
      recentQueries: last24hMetrics.slice(-10).map((m) => ({
        query: m.originalQuery,
        decision: m.agenticDecision,
        responseTime: m.processingTimeMs,
        satisfaction: m.userSatisfactionRating,
        timestamp: m.timestamp,
      })),
    }
  }

  // Helper methods
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return

    try {
      const data = this.metricsBuffer.map((metric) => JSON.stringify(metric)).join('\n') + '\n'

      await fs.appendFile(this.logFile, data, 'utf8')
      this.metricsBuffer = []
    } catch (error) {
      console.error('Failed to flush metrics to file:', error)
    }
  }

  private async loadMetrics(daysBack: number): Promise<RAGPerformanceMetrics[]> {
    try {
      const data = await fs.readFile(this.logFile, 'utf8')
      const lines = data.trim().split('\n')
      const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)

      return lines
        .map((line) => JSON.parse(line) as RAGPerformanceMetrics)
        .filter((metric) => new Date(metric.timestamp) >= cutoffDate)
        .concat(this.metricsBuffer) // Include buffered metrics
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return this.metricsBuffer
      }
      console.error('Failed to load metrics from file:', error)
      return this.metricsBuffer
    }
  }

  private async updateFeedbackInFile(queryId: string, feedback: any): Promise<void> {
    // This would ideally use a proper database
    // For now, we'll rely on the buffer updates
    console.log(`Feedback recorded for query ${queryId}:`, feedback)
  }

  private calculateAvgSatisfaction(metrics: RAGPerformanceMetrics[]): number {
    const withRatings = metrics.filter((m) => m.userSatisfactionRating)
    return withRatings.length > 0
      ? withRatings.reduce((sum, m) => sum + (m.userSatisfactionRating || 0), 0) /
          withRatings.length
      : 0
  }

  private calculateSuccessRate(metrics: RAGPerformanceMetrics[]): number {
    const successful = metrics.filter((m) =>
      m.userSatisfactionRating
        ? m.userSatisfactionRating >= 4
        : m.userClickedHelpful === true || m.conversationContinued === true,
    )
    return metrics.length > 0 ? successful.length / metrics.length : 0
  }

  private groupBy(
    metrics: RAGPerformanceMetrics[],
    field: keyof RAGPerformanceMetrics,
  ): Record<string, number> {
    const groups: Record<string, number> = {}
    metrics.forEach((metric) => {
      const key = String(metric[field])
      groups[key] = (groups[key] || 0) + 1
    })
    return groups
  }

  private identifyImprovementAreas(metrics: RAGPerformanceMetrics[]): string[] {
    const areas: string[] = []

    const avgSatisfaction = this.calculateAvgSatisfaction(metrics)
    if (avgSatisfaction > 0 && avgSatisfaction < 3.5) {
      areas.push('Low user satisfaction ratings - review response quality')
    }

    const avgResponseTime =
      metrics.reduce((sum, m) => sum + m.processingTimeMs, 0) / (metrics.length || 1)
    if (avgResponseTime > 3000) {
      areas.push('High response times - optimize processing pipeline')
    }

    const lowConfidenceDecisions = metrics.filter((m) => m.agenticConfidence < 70).length
    if (lowConfidenceDecisions / metrics.length > 0.3) {
      areas.push('Many low-confidence agentic decisions - improve decision prompts')
    }

    const noResultsQueries = metrics.filter((m) => m.resultsFound === 0).length
    if (noResultsQueries / metrics.length > 0.2) {
      areas.push('High no-results rate - improve vector database content or search')
    }

    return areas
  }

  private generateTrends(metrics: RAGPerformanceMetrics[]): any {
    // Group by date and calculate daily aggregates
    const dailyMetrics = new Map<string, RAGPerformanceMetrics[]>()

    metrics.forEach((m) => {
      const date = m.timestamp.toISOString().split('T')[0]
      if (!dailyMetrics.has(date)) {
        dailyMetrics.set(date, [])
      }
      dailyMetrics.get(date)!.push(m)
    })

    const queryVolume = Array.from(dailyMetrics.entries()).map(([date, dayMetrics]) => ({
      date,
      count: dayMetrics.length,
    }))

    // For satisfaction and performance trends, would need more sophisticated aggregation
    // For now, return mock data structure
    return {
      queryVolume,
      satisfactionTrend: [],
      performanceTrend: [],
    }
  }
}

// Global analytics instance
export const ragAnalytics = new RAGAnalytics()
