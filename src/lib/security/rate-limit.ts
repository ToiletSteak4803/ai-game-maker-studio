import { prisma } from "@/lib/db";

const LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
  codex: { maxRequests: 20, windowMs: 60 * 60 * 1000 }, // 20 requests per hour
  meshy: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 requests per hour
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(
  userId: string,
  action: string
): Promise<RateLimitResult> {
  const limit = LIMITS[action];
  if (!limit) {
    return { allowed: true, remaining: Infinity, resetAt: new Date() };
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() - limit.windowMs);

  // Get or create rate limit record
  let rateLimit = await prisma.rateLimit.findUnique({
    where: {
      userId_action: { userId, action },
    },
  });

  if (!rateLimit) {
    // Create new rate limit record
    rateLimit = await prisma.rateLimit.create({
      data: {
        userId,
        action,
        count: 0,
        windowStart: now,
      },
    });
  }

  // Check if window has expired
  if (rateLimit.windowStart < windowStart) {
    // Reset the window
    rateLimit = await prisma.rateLimit.update({
      where: { id: rateLimit.id },
      data: {
        count: 0,
        windowStart: now,
      },
    });
  }

  const remaining = Math.max(0, limit.maxRequests - rateLimit.count);
  const resetAt = new Date(rateLimit.windowStart.getTime() + limit.windowMs);

  if (rateLimit.count >= limit.maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  // Increment counter
  await prisma.rateLimit.update({
    where: { id: rateLimit.id },
    data: { count: rateLimit.count + 1 },
  });

  return { allowed: true, remaining: remaining - 1, resetAt };
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetAt.toISOString(),
  };
}
