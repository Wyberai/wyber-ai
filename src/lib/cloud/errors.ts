/**
 * Cloud database error handling and response formatting
 */

import { NextResponse } from 'next/server'

export type CloudErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'DB_CONNECTION_ERROR'
  | 'DB_QUERY_ERROR'
  | 'INSUFFICIENT_CREDITS'
  | 'INVALID_CREDENTIALS'
  | 'SERVICE_ERROR'
  | 'TIMEOUT'

export interface CloudErrorOptions {
  code: CloudErrorCode
  message: string
  details?: any
  statusCode?: number
  userMessage?: string // Public-safe error message
}

export class CloudError extends Error {
  code: CloudErrorCode
  details: any
  statusCode: number
  userMessage: string

  constructor(options: CloudErrorOptions) {
    super(options.message)
    this.code = options.code
    this.details = options.details
    this.statusCode = options.statusCode || this.getDefaultStatusCode(options.code)
    this.userMessage = options.userMessage || this.getDefaultUserMessage(options.code)
    this.name = 'CloudError'
  }

  private getDefaultStatusCode(code: CloudErrorCode): number {
    const statusMap: Record<CloudErrorCode, number> = {
      UNAUTHORIZED: 401,
      INVALID_REQUEST: 400,
      NOT_FOUND: 404,
      CONFLICT: 409,
      RATE_LIMITED: 429,
      DB_CONNECTION_ERROR: 503,
      DB_QUERY_ERROR: 500,
      INSUFFICIENT_CREDITS: 402,
      INVALID_CREDENTIALS: 401,
      SERVICE_ERROR: 500,
      TIMEOUT: 504,
    }
    return statusMap[code] || 500
  }

  private getDefaultUserMessage(code: CloudErrorCode): string {
    const messageMap: Record<CloudErrorCode, string> = {
      UNAUTHORIZED: 'Authentication required',
      INVALID_REQUEST: 'Invalid request parameters',
      NOT_FOUND: 'Resource not found',
      CONFLICT: 'Resource already exists',
      RATE_LIMITED: 'Too many requests, please try again later',
      DB_CONNECTION_ERROR: 'Database connection failed, please try again',
      DB_QUERY_ERROR: 'Database operation failed',
      INSUFFICIENT_CREDITS: 'Insufficient credits for this operation',
      INVALID_CREDENTIALS: 'Invalid credentials',
      SERVICE_ERROR: 'Service error, please try again',
      TIMEOUT: 'Request timeout, please try again',
    }
    return messageMap[code]
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      details: process.env.NODE_ENV === 'development' ? this.details : undefined,
    }
  }
}

/**
 * Create a NextResponse from a CloudError
 */
export function errorResponse(error: CloudError | Error) {
  let cloudError: CloudError

  if (error instanceof CloudError) {
    cloudError = error
  } else {
    cloudError = new CloudError({
      code: 'SERVICE_ERROR',
      message: String(error),
      userMessage: 'An unexpected error occurred',
    })
  }

  console.error(`[cloud] ${cloudError.code}: ${cloudError.message}`, cloudError.details)

  return NextResponse.json(cloudError.toJSON(), {
    status: cloudError.statusCode,
  })
}

/**
 * Validation utilities
 */
export const Validation = {
  /**
   * Validate UUID format
   */
  isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(value)
  },

  /**
   * Validate project exists and user owns it
   */
  requireProjectId(projectId: string | null) {
    if (!projectId) {
      throw new CloudError({
        code: 'INVALID_REQUEST',
        message: 'projectId parameter is required',
      })
    }

    if (!this.isValidUUID(projectId)) {
      throw new CloudError({
        code: 'INVALID_REQUEST',
        message: 'Invalid projectId format',
      })
    }

    return projectId
  },

  /**
   * Validate database ID
   */
  requireDatabaseId(databaseId: string | null) {
    if (!databaseId) {
      throw new CloudError({
        code: 'INVALID_REQUEST',
        message: 'databaseId parameter is required',
      })
    }

    if (!this.isValidUUID(databaseId)) {
      throw new CloudError({
        code: 'INVALID_REQUEST',
        message: 'Invalid databaseId format',
      })
    }

    return databaseId
  },

  /**
   * Validate SQL query
   */
  requireSQL(sql: string | null) {
    if (!sql || typeof sql !== 'string') {
      throw new CloudError({
        code: 'INVALID_REQUEST',
        message: 'SQL query is required',
      })
    }

    const trimmed = sql.trim()
    if (trimmed.length === 0) {
      throw new CloudError({
        code: 'INVALID_REQUEST',
        message: 'SQL query cannot be empty',
      })
    }

    if (trimmed.length > 50000) {
      throw new CloudError({
        code: 'INVALID_REQUEST',
        message: 'SQL query exceeds maximum length of 50000 characters',
      })
    }

    return trimmed
  },

  /**
   * Validate credentials exist
   */
  requireCredentials(host?: string, port?: number, user?: string, database?: string) {
    const missing: string[] = []

    if (!host) missing.push('host')
    if (!port) missing.push('port')
    if (!user) missing.push('user')
    if (!database) missing.push('database')

    if (missing.length > 0) {
      throw new CloudError({
        code: 'INVALID_CREDENTIALS',
        message: `Missing database credentials: ${missing.join(', ')}`,
      })
    }
  },
}

/**
 * Common database error patterns
 */
export function classifyDatabaseError(error: any): CloudErrorCode {
  const message = String(error.message || error).toLowerCase()

  // Connection errors
  if (message.includes('econnrefused') || message.includes('connection refused')) {
    return 'DB_CONNECTION_ERROR'
  }
  if (message.includes('econnreset') || message.includes('connection reset')) {
    return 'DB_CONNECTION_ERROR'
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'TIMEOUT'
  }
  if (message.includes('network')) {
    return 'DB_CONNECTION_ERROR'
  }

  // Query errors
  if (message.includes('syntax error') || message.includes('parse error')) {
    return 'DB_QUERY_ERROR'
  }
  if (message.includes('permission denied') || message.includes('access denied')) {
    return 'UNAUTHORIZED'
  }
  if (message.includes('duplicate')) {
    return 'CONFLICT'
  }

  // Default to query error for unknown database errors
  return 'DB_QUERY_ERROR'
}
