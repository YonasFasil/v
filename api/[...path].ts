// This is a catch-all API route for Vercel that handles all /api/* requests
// It imports and uses your Express app to handle the routing

import type { VercelRequest, VercelResponse } from '@vercel/node';
import 'dotenv/config';
import express from 'express';
import { registerRoutes } from '../server/routes';

// Create Express app instance
const app = express();

// Enable CORS for Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Trust proxy
app.set('trust proxy', true);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Register all routes from your server
registerRoutes(app);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Vercel handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Log the request for debugging
  console.log(`[${req.method}] ${req.url}`);

  // Pass the request to Express
  return new Promise((resolve, reject) => {
    // @ts-ignore - Type compatibility between Vercel and Express
    app(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

// Export config to allow all HTTP methods
export const config = {
  api: {
    bodyParser: false, // We handle body parsing in Express
    externalResolver: true,
  },
};