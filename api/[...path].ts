// This is a catch-all API route for Vercel that handles all /api/* requests
// It imports and uses your Express app to handle the routing

import type { VercelRequest, VercelResponse } from '@vercel/node';
import 'dotenv/config';
import express from 'express';
import { registerRoutes } from '../server/routes';
// Storage is automatically initialized when imported

// Create Express app instance
const app = express();

// Enable CORS for Vercel - MUST be first
app.use((req, res, next) => {
  // Allow all origins in production since we're serving from the same domain
  const origin = req.headers.origin || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Trust proxy for proper IP detection
app.set('trust proxy', true);

// Body parsing middleware - MUST come before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`[API] ${new Date().toISOString()} ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[API] Body:`, JSON.stringify(req.body).slice(0, 200));
  }
  next();
});

// CRITICAL: Add email configuration route directly here to avoid registration issues
app.post('/api/email-configure', async (req, res) => {
  console.log('[EMAIL-DIRECT] Route hit directly in [...path].ts');
  console.log('[EMAIL-DIRECT] Method:', req.method);
  console.log('[EMAIL-DIRECT] Body:', req.body);

  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    const { provider, email, password, enabled } = req.body || {};

    if (!provider || !email) {
      return res.status(400).json({
        message: "Provider and email are required",
        received: { provider, email, hasPassword: !!password, enabled }
      });
    }

    // For now, return success to verify the route works
    return res.status(200).json({
      message: "Email configuration successful (DIRECT ROUTE)",
      configured: true,
      provider: provider,
      testMode: true,
      receivedData: { provider, email, enabled }
    });

  } catch (error: any) {
    console.error('[EMAIL-DIRECT] Error:', error);
    return res.status(500).json({
      message: "Failed to configure email",
      error: error.message
    });
  }
});

// Register all routes from your server
try {
  registerRoutes(app);
  console.log('[API] Routes registered successfully');
} catch (error) {
  console.error('[API] Failed to register routes:', error);
}

// 404 handler for unmatched routes
app.use((req, res) => {
  console.error(`[API] 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.url}`,
    availableRoutes: [
      '/api/super-admin/global-email/status',
      '/api/super-admin/global-email/configure',
      '/api/super-admin/global-email/test'
    ]
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[API] Error:', err.message, err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Main Vercel handler function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log incoming request
  console.log(`[Vercel] ${req.method} ${req.url} from ${req.headers['x-forwarded-for'] || req.socket?.remoteAddress}`);

  // Ensure the request has the correct URL format
  // Vercel passes the full path including /api
  if (!req.url?.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }

  // Pass to Express app
  return new Promise((resolve, reject) => {
    // Type assertion for compatibility
    app(req as any, res as any, (result: any) => {
      if (result instanceof Error) {
        console.error('[Vercel] Handler error:', result);
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Vercel configuration
export const config = {
  api: {
    bodyParser: false, // Let Express handle body parsing
    externalResolver: true, // We're handling the response
  },
};