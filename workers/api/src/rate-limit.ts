/**
 * Pure fixed-window rate limiter.
 * `now` is injected so the behaviour is deterministically testable. In the
 * Worker this is per-isolate (best-effort); front multi-instance deployments
 * with an edge limiter.
 */
export type RateLimitDecision = {
  allowed: boolean;
  /** Calls left in the current window (0 when blocked). */
  remaining: number;
  /** Seconds until the window resets (0 when allowed). */
  retryAfterSec: number;
};

export type RateLimitOptions = {
  /** Window length in ms. */
  windowMs: number;
  /** Max calls allowed per window per key. */
  max: number;
};

export class RateLimiter {
  private readonly buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(private readonly options: RateLimitOptions) {}

  check(key: string, now: number): RateLimitDecision {
    const { windowMs, max } = this.options;
    const entry = this.buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: max - 1, retryAfterSec: 0 };
    }
    entry.count += 1;
    if (entry.count > max) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    }
    return { allowed: true, remaining: max - entry.count, retryAfterSec: 0 };
  }

  /** Drop expired buckets so memory stays bounded on long-lived isolates. */
  sweep(now: number): void {
    for (const [key, entry] of this.buckets) {
      if (entry.resetAt <= now) this.buckets.delete(key);
    }
  }

  clear(): void {
    this.buckets.clear();
  }
}