import { NextRequest, NextResponse } from 'next/server'
import { ragAnalytics } from '@/lib/rag-analytics'

/**
 * RAG Analytics & Feedback API
 * ============================
 *
 * Endpoints for collecting user feedback and retrieving analytics data
 * to support continuous improvement of the RAG system.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'dashboard':
        const dashboardData = await ragAnalytics.getDashboardData()
        return NextResponse.json({
          success: true,
          data: dashboardData,
        })

      case 'report':
        const daysBack = parseInt(searchParams.get('days') || '7')
        const report = await ragAnalytics.generateReport(daysBack)
        return NextResponse.json({
          success: true,
          data: report,
        })

      case 'ab-test-variant':
        const sessionId = searchParams.get('sessionId') || 'default'
        const variant = ragAnalytics.getABTestVariant(sessionId)
        return NextResponse.json({
          success: true,
          data: { variant },
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use: dashboard, report, or ab-test-variant',
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve analytics data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'feedback':
        const { queryId, feedback } = data

        if (!queryId || !feedback) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing queryId or feedback data',
            },
            { status: 400 },
          )
        }

        await ragAnalytics.recordFeedback(queryId, feedback)

        return NextResponse.json({
          success: true,
          message: 'Feedback recorded successfully',
        })

      case 'metrics':
        // Allow manual metrics recording (for testing/debugging)
        const { metrics } = data

        if (!metrics) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing metrics data',
            },
            { status: 400 },
          )
        }

        await ragAnalytics.recordQuery(metrics)

        return NextResponse.json({
          success: true,
          message: 'Metrics recorded successfully',
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use: feedback or metrics',
          },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
