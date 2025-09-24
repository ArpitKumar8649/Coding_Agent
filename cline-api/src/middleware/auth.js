const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.API_KEY;

  // Skip auth in development if no API key is set
  if (!apiKey && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️  Warning: No API_KEY set, skipping authentication in development');
    return next();
  }

  if (!apiKey) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'API key not configured'
    });
  }

  if (!authHeader) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Missing Authorization header. Use: Authorization: Bearer YOUR_API_KEY'
    });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  if (token !== apiKey) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Invalid API key'
    });
  }

  next();
};

module.exports = { authenticate };