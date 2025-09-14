import { NextRequest, NextResponse } from 'next/server'
import { runAdminTests } from '@/utilities/admin-test-suite'
import { withAdminSecurity } from '@/app/api/admin/middleware'

async function handler(req: NextRequest, context?: any) {
  try {
    console.log('🧪 Running Admin Dashboard Test Suite...')

    // Run the comprehensive test suite
    const testResults = await runAdminTests()

    // Log the test execution to audit logs
    if (context?.security) {
      await context.security.logAuditEvent({
        action: 'admin_test_suite_executed',
        user: context.user,
        request: context.clientInfo,
        details: {
          metadata: {
            overallStatus: testResults.overallStatus,
            totalTests: testResults.summary.total,
            passed: testResults.summary.passed,
            failed: testResults.summary.failed,
            warnings: testResults.summary.warnings,
          },
        },
        severity: testResults.overallStatus === 'PASSED' ? 'low' : 'medium',
        status: testResults.overallStatus === 'PASSED' ? 'success' : 'warning',
      })
    }

    return NextResponse.json({
      message: 'Admin test suite completed',
      ...testResults,
      executedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Test suite execution error:', error)

    // Log the error
    if (context?.security) {
      await context.security.logAuditEvent({
        action: 'admin_test_suite_failed',
        user: context.user,
        request: context.clientInfo,
        details: {
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        },
        severity: 'high',
        status: 'failed',
      })
    }

    return NextResponse.json(
      {
        error: 'Test suite execution failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

export const POST = withAdminSecurity(handler, {
  requiredRole: 'admin',
  rateLimit: {
    requests: 5, // Limit test runs to 5 per minute
    windowMs: 60000,
  },
  logActivity: true,
})

export const GET = withAdminSecurity(
  async (req: NextRequest, context?: any) => {
    // Return information about available tests without running them
    return NextResponse.json({
      message: 'Admin Test Suite API',
      availableTests: [
        'Collection Access Tests',
        'Data Creation Tests',
        'Analytics Queries Tests',
        'Embedding Operations Tests',
        'Security Features Tests',
        'Database Operations Tests',
        'Portfolio Content Tests',
      ],
      usage: 'POST to this endpoint to run all tests',
      note: 'Tests will create and clean up temporary data',
    })
  },
  {
    requiredRole: 'admin',
    rateLimit: {
      requests: 10,
      windowMs: 60000,
    },
  },
)
