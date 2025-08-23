import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import compression from 'compression';
import cors from 'cors';
import type { Express, Request, Response, NextFunction } from 'express';

// Security middleware configuration
export function setupSecurity(app: Express) {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"], // Added Stripe.js
        connectSrc: ["'self'", "https://api.stripe.com", "ws:", "wss:"],
        frameSrc: ["'self'", "https://js.stripe.com"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for better compatibility
  }));

  // CORS configuration
  const corsOptions = {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // In development, allow all origins for easier testing
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5000').split(',');
      
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };

  app.use(cors(corsOptions));

  // Rate limiting
  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
  const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

  // General rate limit (more permissive in development)
  const generalLimiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: process.env.NODE_ENV === 'development' ? 50000 : rateLimitMax, // Much higher limit in dev
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(rateLimitWindowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Fix for trust proxy issue in development
    keyGenerator: process.env.NODE_ENV === 'development' 
      ? (req) => 'dev-key' // Single key for all requests in dev
      : undefined, // Use default IP-based key in production
    skip: (req) => {
      // In development, skip rate limiting for all requests to avoid 429 errors
      if (process.env.NODE_ENV === 'development') return true;
      
      // Skip rate limiting for static assets and vite HMR
      return req.path.includes('.') || req.path.startsWith('/src/') || req.path.startsWith('/@vite') || req.path.startsWith('/node_modules');
    }
  });

  // Strict rate limit for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 5000 : 5, // Higher limit in dev
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: 900, // 15 minutes
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Fix for trust proxy issue in development
    keyGenerator: process.env.NODE_ENV === 'development' 
      ? (req) => 'dev-auth-key' // Single key for all requests in dev
      : undefined, // Use default IP-based key in production
    skip: (req) => process.env.NODE_ENV === 'development' // Skip auth rate limiting in dev
  });

  // API rate limit for high-frequency endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 50000 : 1000, // Very high limit for API endpoints in dev
    message: {
      error: 'API rate limit exceeded, please try again later.',
      retryAfter: 900,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development' // Skip API rate limiting in dev
  });

  // Apply rate limiting
  app.use('/api/auth', authLimiter);
  app.use('/api/super-admin/login', authLimiter);
  app.use('/api/public/signup', authLimiter);
  app.use('/api', apiLimiter);
  app.use(generalLimiter);

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Compression middleware
  app.use(compression());

  // Custom security headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Remove X-Powered-By header
    res.removeHeader('X-Powered-By');
    
    // Add custom security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // HSTS for HTTPS (only in production)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    next();
  });
}

// Input validation middleware
export function validateInput(req: Request, res: Response, next: NextFunction) {
  // Basic input sanitization
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove potential XSS patterns
      return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
               .replace(/javascript:/gi, '')
               .replace(/vbscript:/gi, '')
               .replace(/onload/gi, '')
               .replace(/onerror/gi, '');
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
}

// Request size limiting
export function setupRequestLimits(app: Express) {
  const maxRequestSize = process.env.MAX_REQUEST_SIZE || '10mb';
  
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Set timeout for requests
    req.setTimeout(30000, () => {
      res.status(408).json({ error: 'Request timeout' });
    });
    
    next();
  });
}

// Error handling middleware
export function setupErrorHandling(app: Express) {
  // 404 handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.path,
        method: req.method 
      });
    } else {
      next();
    }
  });

  // Global error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Global error handler:', err);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const status = err.status || err.statusCode || 500;
    const message = isDevelopment ? err.message : 'Internal server error';
    const stack = isDevelopment ? err.stack : undefined;
    
    res.status(status).json({
      error: message,
      ...(isDevelopment && { stack, details: err })
    });
  });
}

// Logging middleware
export function setupLogging(app: Express) {
  if (process.env.NODE_ENV === 'production') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        const logData = {
          method: req.method,
          url: req.url,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          timestamp: new Date().toISOString(),
        };
        
        console.log(JSON.stringify(logData));
      });
      
      next();
    });
  }
}