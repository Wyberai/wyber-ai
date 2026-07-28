/**
 * Middleware for cloud database API endpoints
 * Handles: authentication, authorization, rate limiting, validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, RATE_LIMIT_PRESETS, rateLimitHeaders } from './rate-limit'
import { CloudError, errorResponse, Validation } from './errors'

export interface CloudAuthContext {
  userId: string
  projectId: string
  databaseId?: string
  user?: any
}

/**
 * Authenticate request and get user context
 */
export async function authenticateRequest(req: NextRequest): Promise<CloudAuthContext | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const databaseId = searchParams.get('databaseId')

    // Validate UUIDs if provided
    if (projectId && !Validation.isValidUUID(projectId)) {
      throw new CloudError({
        code: 'INVALID_REQUEST',
        message: 'Invalid projectId format',
      })
    }

    if (databaseId && !Validation.isValidUUID(databaseId)) {
      throw new CloudError({
        code: 'INVALID_REQUEST',
        message: 'Invalid databaseId format',
      })
    }

    return {
      userId: user.id,
      projectId: projectId || '',
      databaseId: databaseId || undefined,
      user,
    }
  } catch (err) {
    if (err instanceof CloudError) throw err
    return null
  }
}

/**
 * Require authenticated context
 */
export async function requireAuth(req: NextRequest, options?: { requireProjectId?: boolean }): Promise<CloudAuthContext> {
  const context = await authenticateRequest(req)

  if (!context) {
    throw new CloudError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    })
  }

  if (options?.requireProjectId && !context.projectId) {
    throw new CloudError({
      code: 'INVALID_REQUEST',
      message: 'projectId parameter is required',
    })
  }

  return context
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  req: NextRequest,
  userId: string,
  preset: keyof typeof RATE_LIMIT_PRESETS
): Promise<NextResponse | null> {
  const { pathname } = new URL(req.url)
  const { limit, windowSeconds } = RATE_LIMIT_PRESETS[preset]

  const result = checkRateLimit({
    route: pathname,
    userId,
    limit,
    windowSeconds,
  })

  if (!result.allowed) {
    const response = NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: 'Too many requests, please try again later',
        retryAfter: result.remaining === 0 ? Math.ceil((result.resetAt - Date.now()) / 1000) : null,
      },
      { status: 429 }
    )

    // Add rate limit headers
    const headers = rateLimitHeaders(result)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }

  return null // Allowed to proceed
}

/**
 * Create error response with proper headers
 */
export function sendError(error: CloudError | Error, rateLimit?: any): NextResponse {
  const response = errorResponse(error)

  // Add rate limit headers if available
  if (rateLimit) {
    const headers = rateLimitHeaders(rateLimit)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  return response
}

/**
 * Create successful response with common headers
 */
export function sendSuccess(data: any, statusCode: number = 200): NextResponse {
  const response = NextResponse.json(data, { status: statusCode })
  response.headers.set('Cache-Control', 'private, max-age=0, no-cache')
  return response
}

/**
 * Wrap endpoint handler with error and rate limit handling
 */
export async function withCloudMiddleware<T>(
  req: NextRequest,
  handler: (context: CloudAuthContext) => Promise<T>,
  options?: {
    rateLimit?: keyof typeof RATE_LIMIT_PRESETS
    requireProjectId?: boolean
  }
): Promise<NextResponse> {
  try {
    // Authenticate
    const context = await requireAuth(req, { requireProjectId: options?.requireProjectId })

    // Apply rate limiting if specified
    if (options?.rateLimit) {
      const rateLimitResponse = await applyRateLimit(req, context.userId, options.rateLimit)
      if (rateLimitResponse) return rateLimitResponse
    }

    // Call handler
    const result = await handler(context)
    return sendSuccess(result)
  } catch (err) {
    if (err instanceof CloudError) {
      return sendError(err)
    }
    return sendError(new CloudError({
      code: 'SERVICE_ERROR',
      message: String(err),
    }))
  }
}
