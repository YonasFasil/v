import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";
import { 
  setupSecurity, 
  validateInput, 
  setupRequestLimits, 
  setupErrorHandling, 
  setupLogging 
} from "../server/middleware/security";

const app = express();

// Trust proxy (needed for proper rate limiting behind reverse proxy)
app.set('trust proxy', true);

// Security setup (must be first)
setupSecurity(app);
setupRequestLimits(app);
setupLogging(app);

// Body parsing middleware
app.use(express.json({ limit: process.env.MAX_REQUEST_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: false, limit: process.env.MAX_REQUEST_SIZE || '10mb' }));

// Input validation middleware
app.use(validateInput);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Register API routes
(async () => {
  try {
    await registerRoutes(app);
    setupErrorHandling(app);
    
    // Health check endpoint
    app.get('/api/health', (req: Request, res: Response) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
  } catch (error) {
    console.error('Failed to register routes:', error);
  }
})();

// Export the Express app for Vercel
export default app;