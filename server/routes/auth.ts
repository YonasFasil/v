import type { Express } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "../db";
import { users, tenants, tenantUsers } from "@shared/schema";
import { eq, sql, and } from "drizzle-orm";
import { EmailService } from "../services/email";

export function registerAuthRoutes(app: Express) {
  // POST /api/auth/signup - User registration
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { firstName, lastName, email, password, companyName, planSlug } = req.body;

      if (!firstName || !lastName || !email || !password || !companyName || !planSlug) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(409).json({ message: 'User already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const newUser = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          emailVerified: false,
          emailVerificationToken: verificationToken,
        })
        .returning();

      // Send verification email
      try {
        console.log('Attempting to send verification email to:', email);
        await EmailService.sendVerificationEmail(email, verificationToken, firstName);
        console.log('Verification email sent successfully to:', email);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Continue with signup even if email fails
      }

      res.status(201).json({
        message: 'Account created successfully',
        userId: newUser[0].id,
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // POST /api/auth/login - User authentication
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user using Drizzle ORM for proper type safety
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (userResult.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const foundUser = userResult[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, foundUser.password || '');
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if email is verified
      if (!foundUser.emailVerified) {
        return res.status(403).json({ 
          message: 'Please verify your email address before signing in',
          emailVerificationRequired: true
        });
      }

      // Check if user is super admin first
      const superAdminCheck = await db.execute(sql`
        SELECT user_id FROM super_admins WHERE user_id = ${foundUser.id}
      `);
      
      const isSuperAdmin = superAdminCheck.rows.length > 0;
      
      // Create session with role information
      (req.session as any).userId = foundUser.id;
      (req.session as any).isSuperAdmin = isSuperAdmin;
      (req.session as any).user = {
        id: foundUser.id,
        email: foundUser.email,
        firstName: foundUser.firstName || '',
        lastName: foundUser.lastName || '',
        isSuperAdmin: isSuperAdmin,
      };

      let tenantResult: { rows: any[] } = { rows: [] };
      
      // Only check for tenant if NOT a super admin
      if (!isSuperAdmin) {
        tenantResult = await db.execute(sql`
          SELECT 
            t.id, t.name, t.slug, t.status,
            tu.role
          FROM tenant_users tu
          JOIN tenants t ON t.id = tu.tenant_id
          WHERE tu.user_id = ${foundUser.id} AND t.status = 'active'
          LIMIT 1
        `);
      }

      res.json({
        message: 'Login successful',
        user: {
          id: foundUser.id,
          email: foundUser.email,
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          isSuperAdmin: isSuperAdmin,
          // Super admins don't have tenant associations
          currentTenant: !isSuperAdmin && tenantResult.rows.length > 0 ? {
            id: tenantResult.rows[0].id,
            name: tenantResult.rows[0].name,
            slug: tenantResult.rows[0].slug,
            status: tenantResult.rows[0].status,
            role: tenantResult.rows[0].role,
          } : null,
        },
        isSuperAdmin: isSuperAdmin,
        hasTenant: !isSuperAdmin && tenantResult.rows.length > 0,
        tenant: !isSuperAdmin && tenantResult.rows.length > 0 ? {
          id: tenantResult.rows[0].id,
          name: tenantResult.rows[0].name,
          slug: tenantResult.rows[0].slug,
          status: tenantResult.rows[0].status,
        } : null,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // POST /api/auth/logout - User logout
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.clearCookie('connect.sid');
      console.log('User logout request from:', (req.session as any)?.userId);
      res.json({ message: 'Logged out successfully' });
    });
  });

  // GET /api/auth/me - Get current user with unified session structure
  app.get('/api/auth/me', async (req, res) => {
    if (!(req.session as any).userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      const userId = (req.session as any).userId;
      
      // Get user data
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length === 0) {
        req.session.destroy(() => {});
        return res.status(401).json({ message: 'User no longer exists' });
      }

      const user = userResult[0];

      // Check super admin status
      const superAdminCheck = await db.execute(sql`
        SELECT user_id FROM super_admins WHERE user_id = ${(req.session as any).userId}
      `);
      
      const isSuperAdmin = superAdminCheck.rows.length > 0;
      
      // Update session with current super admin status
      (req.session as any).isSuperAdmin = isSuperAdmin;
      (req.session as any).user.isSuperAdmin = isSuperAdmin;

      // Get tenant information for regular users only
      let currentTenant = null;
      if (!isSuperAdmin) {
        const tenantResult = await db.execute(sql`
          SELECT 
            t.id, t.name, t.slug, t.status,
            tu.role
          FROM tenant_users tu
          JOIN tenants t ON t.id = tu.tenant_id
          WHERE tu.user_id = ${userId} AND t.status = 'active'
          LIMIT 1
        `);

        if (tenantResult.rows.length > 0) {
          currentTenant = {
            id: tenantResult.rows[0].id,
            name: tenantResult.rows[0].name,
            slug: tenantResult.rows[0].slug,
            status: tenantResult.rows[0].status,
            role: tenantResult.rows[0].role,
          };
        }
      }

      res.json({
        user: {
          ...(req.session as any).user,
          isSuperAdmin: isSuperAdmin,
          currentTenant: currentTenant,
        },
      });
    } catch (error) {
      console.error('Error checking user status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // GET /api/auth/verify-email - Email verification
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
      }

      // Find user with token
      const user = await db
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, token as string))
        .limit(1);

      if (user.length === 0) {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }

      // Update user as verified
      await db
        .update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user[0].id));

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // POST /api/auth/resend-verification - Resend verification email
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Find user with this email
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const foundUser = user[0];

      // Check if user is already verified
      if (foundUser.emailVerified) {
        return res.status(400).json({ message: 'Email is already verified' });
      }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Update user with new token
      await db
        .update(users)
        .set({
          emailVerificationToken: verificationToken,
          updatedAt: new Date(),
        })
        .where(eq(users.id, foundUser.id));

      // Send verification email
      try {
        console.log('Resending verification email to:', email);
        await EmailService.sendVerificationEmail(email, verificationToken, foundUser.firstName || '');
        console.log('Verification email resent successfully to:', email);
      } catch (emailError) {
        console.error('Failed to resend verification email:', emailError);
        return res.status(500).json({ message: 'Failed to send verification email' });
      }

      res.json({ message: 'Verification email sent successfully' });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}