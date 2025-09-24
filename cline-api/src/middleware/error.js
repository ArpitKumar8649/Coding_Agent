const notFound = (req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    availableEndpoints: {
      health: 'GET /health',
      generate: 'POST /api/generate',
      edit: 'POST /api/edit', 
      diff: 'POST /api/diff'
    }
  });
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // LLM API errors
  if (err.name === 'LLMError') {
    error = {
      message: 'LLM API Error: ' + err.message,
      status: 502,
      provider: err.provider
    };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error = {
      message: err.message,
      status: 400,
      fields: err.fields
    };
  }

  // Rate limit errors
  if (err.status === 429) {
    error = {
      message: err.message,
      status: 429,
      retryAfter: err.retryAfter
    };
  }

  res.status(error.status).json({
    error: error.status >= 500 ? 'Internal Server Error' : 'Request Error',
    message: error.message,
    ...(error.provider && { provider: error.provider }),
    ...(error.fields && { fields: error.fields }),
    ...(error.retryAfter && { retryAfter: error.retryAfter }),
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { notFound, errorHandler };