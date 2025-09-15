import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface AuditLogData {
  action: string
  user?: any
  resource?: {
    type: string
    id?: string
    title?: string
  }
  details?: {
    changes?: any
    reason?: string
    metadata?: any
  }
  request?: {
    ip?: string
    userAgent?: string
    method?: string
    endpoint?: string
    sessionId?: string
  }
  severity?: 'low' | 'medium' | 'high' | 'critical'
  status?: 'success' | 'failed' | 'partial' | 'warning'
}

export class SecurityManager {
  private static instance: SecurityManager

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager()
    }
    return SecurityManager.instance
  }

  /**
   * Rate limiting function
   */
  async checkRateLimit(
    identifier: string,
    limit: number = 60,
    windowMs: number = 60000,
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now()
    const windowStart = now - windowMs

    const userLimit = rateLimitStore.get(identifier)

    if (!userLimit || userLimit.resetTime < windowStart) {
      // New window or expired
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + windowMs,
      })

      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs,
      }
    }

    if (userLimit.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: userLimit.resetTime,
      }
    }

    // Increment count
    userLimit.count++
    rateLimitStore.set(identifier, userLimit)

    return {
      allowed: true,
      remaining: limit - userLimit.count,
      resetTime: userLimit.resetTime,
    }
  }

  /**
   * Input validation and sanitization
   */
  validateInput(input: any, rules: ValidationRules): ValidationResult {
    const errors: string[] = []

    if (rules.required && (!input || input === '')) {
      errors.push('Field is required')
    }

    if (input && rules.type) {
      const inputType = typeof input
      if (inputType !== rules.type) {
        errors.push(`Expected ${rules.type}, got ${inputType}`)
      }
    }

    if (input && rules.minLength && input.length < rules.minLength) {
      errors.push(`Minimum length is ${rules.minLength}`)
    }

    if (input && rules.maxLength && input.length > rules.maxLength) {
      errors.push(`Maximum length is ${rules.maxLength}`)
    }

    if (input && rules.pattern && !rules.pattern.test(input)) {
      errors.push('Invalid format')
    }

    if (input && rules.sanitize) {
      input = this.sanitizeInput(input)
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: input,
    }
  }

  /**
   * Sanitize input to prevent XSS and injection attacks
   */
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') return input

    // Remove potential XSS patterns
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  }

  /**
   * Log security events to audit log
   */
  async logAuditEvent(data: AuditLogData): Promise<void> {
    try {
      const payload = await getPayload({ config })

      await (payload as any).create({
        collection: 'audit-logs',
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error('Failed to create audit log:', error)
    }
  }

  /**
   * Check if user has required permission
   */
  checkPermission(user: any, requiredRole: string): boolean {
    if (!user) return false

    // In production, implement proper role hierarchy
    const userRole = (user as any)?.role || 'user'

    const roleHierarchy: { [key: string]: number } = {
      user: 1,
      editor: 2,
      admin: 3,
      'super-admin': 4,
    }

    const userLevel = roleHierarchy[userRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    return userLevel >= requiredLevel
  }

  /**
   * Generate secure token
   */
  generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Extract client information from request
   */
  getClientInfo(request: NextRequest) {
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    return {
      ip: ip.trim(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      method: request.method,
      endpoint: request.nextUrl.pathname,
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  async checkSuspiciousActivity(userId: string, action: string): Promise<boolean> {
    try {
      const payload = await getPayload({ config })

      // Check for unusual patterns in the last hour
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000)

      const recentActions = await (payload as any).find({
        collection: 'audit-logs',
        where: {
          and: [
            { user: { equals: userId } },
            { action: { equals: action } },
            { timestamp: { greater_than: hourAgo.toISOString() } },
          ],
        },
        limit: 100,
      })

      // Flag as suspicious if more than 20 identical actions in an hour
      if (recentActions.totalDocs > 20) {
        await this.logAuditEvent({
          action: 'suspicious_activity_detected',
          user: { id: userId },
          details: {
            metadata: {
              suspiciousAction: action,
              count: recentActions.totalDocs,
              timeframe: '1 hour',
            },
          },
          severity: 'high',
          status: 'warning',
        })

        return true
      }

      return false
    } catch (error) {
      console.error('Error checking suspicious activity:', error)
      return false
    }
  }
}

interface ValidationRules {
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'object'
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  sanitize?: boolean
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedValue: any
}

// Rate limiting middleware
export function withRateLimit(limit: number = 60, windowMs: number = 60000) {
  return async function (request: NextRequest, identifier?: string) {
    const security = SecurityManager.getInstance()
    const clientInfo = security.getClientInfo(request)
    const rateLimitId = identifier || clientInfo.ip

    const rateLimit = await security.checkRateLimit(rateLimitId, limit, windowMs)

    if (!rateLimit.allowed) {
      await security.logAuditEvent({
        action: 'rate_limit_exceeded',
        request: clientInfo,
        details: {
          metadata: {
            limit,
            windowMs,
            identifier: rateLimitId,
          },
        },
        severity: 'medium',
        status: 'warning',
      })

      throw new Error('Rate limit exceeded')
    }

    return rateLimit
  }
}

// Authentication middleware
export async function requireAuth(request: NextRequest) {
  // This would integrate with your authentication system
  // For now, we'll simulate checking for a valid session

  const authHeader = request.headers.get('authorization')
  const sessionCookie = request.cookies.get('payload-session')

  if (!authHeader && !sessionCookie) {
    throw new Error('Authentication required')
  }

  // In production, verify the token/session here
  return { authenticated: true, user: null }
}

export default SecurityManager
