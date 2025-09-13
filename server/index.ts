import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { emailMonitorService } from "./services/email-monitor";
import { storage } from "./storage";
import { 
  setupSecurity, 
  validateInput, 
  setupRequestLimits, 
  setupErrorHandling, 
  setupLogging 
} from "./middleware/security";

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

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Setup error handling
  setupErrorHandling(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5001 if not specified for local dev.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5001', 10);
  const host = process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0';
  
  server.listen(port, host, async () => {
    log(`serving on port ${port}`);
    
    // Auto-start email monitoring disabled during development due to tenant context issues
    // Email monitoring will be started when tenants access their settings
    log('📧 Email monitoring auto-start disabled - will be started per tenant when needed');
  });
})();

export default app;