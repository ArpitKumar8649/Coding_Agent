/**
 * Advanced Authentication Middleware
 */

const rateLimit = require('express-rate-limit');

class AdvancedAuthMiddleware {
    constructor() {
        this.apiKey = process.env.API_KEY;
        this.rateLimiter = this.createRateLimiter();
    }

    createRateLimiter() {
        return rateLimit({
            windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // minutes
            max: process.env.RATE_LIMIT_MAX || 100,
            message: {
                error: 'Too many requests',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter: Math.ceil((process.env.RATE_LIMIT_WINDOW || 15) * 60)
            },
            standardHeaders: true,
            legacyHeaders: false
        });
    }

    // API Key authentication
    authenticateAPIKey(req, res, next) {
        // Skip auth for health check
        if (req.path === '/health') {
            return next();
        }

        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
        
        if (!apiKey) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'API key must be provided in X-API-Key header or Authorization bearer token'
            });
        }

        if (apiKey !== this.apiKey) {
            return res.status(401).json({
                error: 'Invalid API key',
                message: 'The provided API key is invalid'
            });
        }

        // Add API key info to request
        req.auth = {
            apiKey: apiKey,
            authenticated: true,
            timestamp: new Date().toISOString()
        };

        next();
    }

    // Rate limiting
    applyRateLimit() {
        return this.rateLimiter;
    }

    // Session validation
    validateSession(req, res, next) {
        const sessionId = req.params.sessionId;
        
        if (!sessionId || !/^[a-zA-Z0-9-_]+$/.test(sessionId)) {
            return res.status(400).json({
                error: 'Invalid session ID',
                message: 'Session ID must be alphanumeric with hyphens and underscores only'
            });
        }

        req.sessionId = sessionId;
        next();
    }

    // Request validation
    validateRequest(req, res, next) {
        // Validate JSON payload
        if (req.method === 'POST' || req.method === 'PUT') {
            if (!req.is('application/json')) {
                return res.status(400).json({
                    error: 'Invalid content type',
                    message: 'Request must have Content-Type: application/json'
                });
            }
        }

        // Add request metadata
        req.requestMeta = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent'] || 'Unknown',
            ip: req.ip || req.connection.remoteAddress
        };

        next();
    }

    // Error handling
    handleAuthError(error, req, res, next) {
        console.error('Authentication error:', error);
        
        res.status(500).json({
            error: 'Authentication system error',
            message: 'An error occurred in the authentication system',
            requestId: req.requestMeta?.id
        });
    }
}

const authMiddleware = new AdvancedAuthMiddleware();

module.exports = {
    authenticateAPIKey: authMiddleware.authenticateAPIKey.bind(authMiddleware),
    applyRateLimit: authMiddleware.applyRateLimit.bind(authMiddleware),
    validateSession: authMiddleware.validateSession.bind(authMiddleware),
    validateRequest: authMiddleware.validateRequest.bind(authMiddleware),
    handleAuthError: authMiddleware.handleAuthError.bind(authMiddleware)
};