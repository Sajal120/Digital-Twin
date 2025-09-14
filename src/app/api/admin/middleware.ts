import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'
import SecurityManager, { withRateLimit } from '@/utilities/security'

interface AdminMiddlewareOptions {
  requiredRole?: string
  rateLimit?: {
    requests: number
    windowMs: number
  }
  validateInput?: boolean
  logActivity?: boolean
}

export function withAdminSecurity(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  options: AdminMiddlewareOptions = {},
) {
  return async function (req: NextRequest, context?: any): Promise<NextResponse> {
    const security = SecurityManager.getInstance()
    const clientInfo = security.getClientInfo(req)

    try {
      // Apply rate limiting
      if (options.rateLimit) {
        const rateLimiter = withRateLimit(options.rateLimit.requests, options.rateLimit.windowMs)

        await rateLimiter(req)
      }

      // Check authentication
      const payload = await getPayload({ config })
      let user = null

      try {
        // Get user from session cookie or token
        const sessionCookie = req.cookies.get('payload-token')
        if (sessionCookie) {
          // Verify session with PayloadCMS
          user = await payload.auth({
            headers: req.headers as any,
          })
        }
      } catch (authError) {
        console.log('Authentication failed:', authError)
      }

      // Check if user is authenticated and has required role
      if (!user || !user.user) {
        await security.logAuditEvent({
          action: 'admin_access_denied',
          request: clientInfo,
          details: {
            reason: 'No authentication',
            metadata: {
              endpoint: req.nextUrl.pathname,
            },
          },
          severity: 'medium',
          status: 'failed',
        })

        return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
      }

      // Check role permissions
      const requiredRole = options.requiredRole || 'admin'
      if (!security.checkPermission(user.user, requiredRole)) {
        await security.logAuditEvent({
          action: 'admin_access_denied',
          user: user.user,
          request: clientInfo,
          details: {
            reason: `Insufficient permissions. Required: ${requiredRole}`,
            metadata: {
              userRole: (user.user as any)?.role || 'unknown',
            },
          },
          severity: 'high',
          status: 'failed',
        })

        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      // Check for suspicious activity
      const isSuspicious = await security.checkSuspiciousActivity(
        (user.user as any)?.id,
        req.nextUrl.pathname,
      )

      if (isSuspicious) {
        return NextResponse.json(
          { error: 'Suspicious activity detected. Please try again later.' },
          { status: 429 },
        )
      }

      // Log successful access if required
      if (options.logActivity) {
        await security.logAuditEvent({
          action: 'admin_access_granted',
          user: user.user,
          request: clientInfo,
          details: {
            metadata: {
              endpoint: req.nextUrl.pathname,
              method: req.method,
            },
          },
          severity: 'low',
          status: 'success',
        })
      }

      // Add user and security context to request
      const enhancedContext = {
        ...context,
        user: user.user,
        security,
        clientInfo,
      }

      // Call the actual handler
      return await handler(req, enhancedContext)
    } catch (error) {
      // Log security-related errors
      await security.logAuditEvent({
        action: 'admin_security_error',
        request: clientInfo,
        details: {
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            endpoint: req.nextUrl.pathname,
          },
        },
        severity: 'high',
        status: 'failed',
      })

      console.error('Admin security middleware error:', error)

      if (error instanceof Error) {
        if (error.message === 'Rate limit exceeded') {
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 },
          )
        }

        if (error.message === 'Authentication required') {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }
      }

      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// Input validation middleware
export function validateRequestData(schema: Record<string, any>) {
  return async function (req: NextRequest) {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const body = await req.json()
        const security = SecurityManager.getInstance()
        const validationErrors: Record<string, string[]> = {}

        for (const [field, rules] of Object.entries(schema)) {
          const validation = security.validateInput(body[field], rules)
          if (!validation.isValid) {
            validationErrors[field] = validation.errors
          } else {
            body[field] = validation.sanitizedValue
          }
        }

        if (Object.keys(validationErrors).length > 0) {
          return NextResponse.json(
            { error: 'Validation failed', details: validationErrors },
            { status: 400 },
          )
        }

        // Add sanitized body back to request
        ;(req as any).validatedBody = body
      } catch (error) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
      }
    }

    return null // Continue to next middleware
  }
}

// CORS middleware for admin APIs
export function withCORS(allowedOrigins: string[] = []) {
  return function (response: NextResponse, req: NextRequest) {
    const origin = req.headers.get('origin')

    if (allowedOrigins.length === 0 || (origin && allowedOrigins.includes(origin))) {
      response.headers.set('Access-Control-Allow-Origin', origin || '*')
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Max-Age', '86400')

    return response
  }
}

export default withAdminSecurity
