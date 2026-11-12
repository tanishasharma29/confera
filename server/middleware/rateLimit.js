// In-memory sliding window rate limiter
const rateLimitBuckets = new Map();

/**
 * Creates an Express rate limiter middleware.
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000ms = 1m)
 * @param {number} options.max - Max requests allowed per window (default: 100)
 * @param {string} options.message - Error message returned on breach
 */
export const rateLimit = ({ windowMs = 60000, max = 100, message = "Too many requests, please try again later." } = {}) => {
  return (req, res, next) => {
    // Identify by authenticated user ID if present, otherwise by IP
    const identifier = req.user?.id || req.ip || req.connection?.remoteAddress || "anonymous";
    const bucketKey = `${req.baseUrl || req.path}:${identifier}`;
    const now = Date.now();

    let bucket = rateLimitBuckets.get(bucketKey);

    if (!bucket) {
      bucket = [];
      rateLimitBuckets.set(bucketKey, bucket);
    }

    // Filter out requests older than windowMs
    bucket = bucket.filter((timestamp) => now - timestamp < windowMs);
    rateLimitBuckets.set(bucketKey, bucket);

    if (bucket.length >= max) {
      return res.status(429).json({
        error: message,
        retryAfterMs: windowMs - (now - bucket[0]),
      });
    }

    bucket.push(now);
    next();
  };
};

// Periodic cleanup of stale buckets every 5 minutes
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitBuckets.entries()) {
    const fresh = timestamps.filter((t) => now - t < 300000);
    if (fresh.length === 0) {
      rateLimitBuckets.delete(key);
    } else {
      rateLimitBuckets.set(key, fresh);
    }
  }
}, 300000);
if (cleanupTimer.unref) {
  cleanupTimer.unref();
}
