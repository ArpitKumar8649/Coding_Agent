const rateLimitStore = new Map();

const rateLimiter = (req, res, next) => {
  const clientId = req.ip || 'unknown';
  const windowMs = (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000; // 15 minutes default
  const max = parseInt(process.env.RATE_LIMIT_MAX) || 100; // 100 requests default
  
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get or create client record
  if (!rateLimitStore.has(clientId)) {
    rateLimitStore.set(clientId, []);
  }
  
  const requests = rateLimitStore.get(clientId);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  if (validRequests.length >= max) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many requests. Limit: ${max} requests per ${process.env.RATE_LIMIT_WINDOW || 15} minutes`,
      retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
    });
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitStore.set(clientId, validRequests);
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': max,
    'X-RateLimit-Remaining': max - validRequests.length,
    'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
  });
  
  next();
};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000;
  
  for (const [clientId, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(timestamp => timestamp > (now - windowMs));
    if (validRequests.length === 0) {
      rateLimitStore.delete(clientId);
    } else {
      rateLimitStore.set(clientId, validRequests);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

module.exports = { rateLimiter };