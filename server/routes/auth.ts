import { Request, Response } from 'express';
import { storage } from '../storage';
import { hashPassword, verifyPassword } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerTenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  tenantName: z.string().min(1, 'Business name is required'),
  subdomain: z.string().min(1, 'Subdomain is required').regex(/^[a-z0-9-]+$/, 'Invalid subdomain format'),
  businessEmail: z.string().email('Invalid business email format'),
  businessPhone: z.string().optional(),
  address: z.string().optional(),
});

// Login endpoint
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    await storage.updateUserLastLogin(user.id);

    // Create session
    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.tenantId = user.tenantId;

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: userWithoutPassword,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Login failed' });
  }
};

// Logout endpoint
export const logout = async (req: Request, res: Response) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('venuin.sid');
      res.json({ message: 'Logout successful' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
};

// Get current user endpoint
export const getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get fresh user data
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Failed to get user data' });
  }
};

// Register new tenant endpoint
export const registerTenant = async (req: Request, res: Response) => {
  try {
    const data = registerTenantSchema.parse(req.body);

    // Check if email or subdomain already exists
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingTenant = await storage.getTenantBySubdomain(data.subdomain);
    if (existingTenant) {
      return res.status(400).json({ message: 'Subdomain already taken' });
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create tenant first
    const tenant = await storage.createTenant({
      name: data.tenantName,
      subdomain: data.subdomain,
      businessEmail: data.businessEmail,
      businessPhone: data.businessPhone,
      address: data.address,
      plan: 'basic',
      isActive: true,
    });

    // Create tenant admin user
    const user = await storage.createUser({
      tenantId: tenant.id,
      username: data.email.split('@')[0], // Use email prefix as username
      password: hashedPassword,
      name: data.name,
      email: data.email,
      role: 'tenant_admin',
      isActive: true,
    });

    // Return success (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      user: userWithoutPassword,
      tenant,
      message: 'Registration successful'
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: 'Registration failed' });
  }
};