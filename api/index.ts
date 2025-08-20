import express, { type Request, Response } from "express";
import cors from "cors";

// Create Express app
const app = express();

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Debug middleware to log all requests
app.use((req: Request, res: Response, next) => {
  console.log(`${req.method} ${req.path} - Full URL: ${req.url}`);
  next();
});

// Simple health check - Vercel routes /api/health -> /health in our function  
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    hasDatabase: !!process.env.DATABASE_URL
  });
});

// Simple super admin login endpoint - /api/super-admin/login -> /super-admin/login
app.post('/super-admin/login', async (req: Request, res: Response) => {
  try {
    console.log('Super admin login attempt');
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    // For now, just check environment variables
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ message: "Database not configured" });
    }
    
    console.log('Login attempt for:', email);
    console.log('Database URL exists:', !!process.env.DATABASE_URL);
    
    // Import and use authentication
    const { authenticateSuperAdmin } = await import("../server/middleware/auth");
    const result = await authenticateSuperAdmin(email, password);
    
    if (!result) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    res.json(result);
  } catch (error: any) {
    console.error("Super admin login error:", error);
    res.status(500).json({ 
      message: "Login failed", 
      error: error.message 
    });
  }
});

// Catch-all route
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

export default app;