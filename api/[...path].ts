// This is a catch-all API route for Vercel that handles all /api/* requests
// It imports and uses your Express app to handle the routing

import type { VercelRequest, VercelResponse } from '@vercel/node';
import '../server/index';
import { registerRoutes } from '../server/routes';
import express from 'express';

const app = express();

// Trust proxy
app.set('trust proxy', true);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Register all routes
registerRoutes(app);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Remove /api prefix from the path as Express routes don't expect it
  const originalUrl = req.url || '';
  req.url = originalUrl.replace(/^\/api/, '');

  // Convert Vercel request/response to Express-compatible format
  return new Promise((resolve) => {
    app(req as any, res as any, () => {
      resolve(undefined);
    });
  });
}