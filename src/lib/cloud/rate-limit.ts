/**
 * Rate limiting for cloud database API endpoints
 * Uses in-memory stores (production should use Redis)
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const rateLimitStores = new Map<string, Map<string, RateLimitEntry>>()

/**
 * Get or create rate limit store for a route
 */
function getStore(route: string): Map<string, RateLimitEntry> {
  if (!rateLimitStores.has(route)) {
    rateLimitStores.set(route, new Map())
  }
  return rateLimitStores.get(route)!
}

/**
 * Clean up expired entries (runs periodically)
 */
function cleanupExpiredEntries() {
  const now = Date.now()
  for (const [route, store] of rateLimitStores.entries()) {
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) {
        store.delete(key)
      }
    }
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000)

export interface RateLimitOptions {
  route: string
  userId: string
  limit: number // max requests
  windowSeconds: number // time window
}

export interface RateLimitResult {
  allowed: boolean
  current: number
  limit: number
  resetAt: number
  remaining: number
}

/**
 * Check if a request is within rate limits
 */
export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { route, userId, limit, windowSeconds } = options
  const store = getStore(route)
  const key = userId
  const now = Date.now()

  let entry = store.get(key)

  // Create or reset expired entry
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowSeconds * 1000,
    }
    store.set(key, entry)
  }

  const allowed = entry.count < limit
  entry.count++

  return {
    allowed,
    current: entry.count,
    limit,
    resetAt: entry.resetAt,
    remaining: Math.max(0, limit - entry.count),
  }
}

/**
 * Rate limiting presets for different endpoints
 */
export const RATE_LIMIT_PRESETS = {
  // Query operations - strict limits
  query: {
    limit: 100,
    windowSeconds: 3600, // 100 per hour
  },
  // Database info operations - moderate limits
  info: {
    limit: 500,
    windowSeconds: 3600, // 500 per hour
  },
  // Data read operations - generous limits
  read: {
    limit: 1000,
    windowSeconds: 3600, // 1000 per hour
  },
  // Data write operations - strict limits
  write: {
    limit: 100,
    windowSeconds: 3600, // 100 per hour
  },
  // Provisioning operations - very strict
  provision: {
    limit: 10,
    windowSeconds: 3600, // 10 per hour
  },
  // Metrics collection - very lenient (scheduled task)
  metrics: {
    limit: 100,
    windowSeconds: 60, // 100 per minute (for batch processing)
  },
}

/**
 * Format rate limit response headers
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const now = Date.now()
  const resetSeconds = Math.ceil((result.resetAt - now) / 1000)

  return {
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
    'RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)), // Unix timestamp
    'Retry-After': String(resetSeconds),
  }
}
