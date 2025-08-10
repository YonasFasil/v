import type { Express } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "../db";
import { users, tenantUsers, tenants } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { EmailService } from "../services/email";

interface AuthRequest extends Request {
  user?: any;
  session?: any;
}

export function registerAuthRoutes(app: Express) {
  // POST /api/auth/signup - Create new user account
  app.post('/api/auth/signup', async (req: AuthRequest, res) => {
    try {
      const { email, password, firstName, lastName, companyName } = req.body;

      // Validate input
      if (!email || !password || !firstName || !companyName) {
        return res.status(400).json({ 
          message: 'Email, password, first name, and company name are required' 
        });
      }

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (existingUser) {
        return res.status(409).json({ 
          message: 'An account with this email already exists' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          password: hashedPassword,
          firstName,
          lastName: lastName || '',
          emailVerified: false,
          emailVerificationToken,
        })
        .returning();

      // Send verification email
      try {
        await EmailService.sendVerificationEmail(email, emailVerificationToken, firstName);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't fail signup if email fails, user can resend
      }

      res.status(201).json({
        message: 'Account created successfully. Please check your email to verify your account.',
        userId: newUser.id,
        emailSent: true,
      });

    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Error creating account' });
    }
  });

  // POST /api/auth/login - Sign in user
  app.post('/api/auth/login', async (req: AuthRequest, res) => {
    try {
      const { email, password, rememberMe } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check email verification
      if (!user.emailVerified) {
        return res.status(403).json({ 
          message: 'Please verify your email address before signing in',
          needsVerification: true 
        });
      }

      // Create session
      req.session!.userId = user.id;
      req.session!.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      // Set session expiry based on "remember me"
      if (rememberMe) {
        req.session!.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else {
        req.session!.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 day
      }

      // Get user's tenant if exists
      const [tenantUser] = await db
        .select({
          tenantSlug: tenants.slug,
          tenantId: tenantUsers.tenantId,
          role: tenantUsers.role,
        })
        .from(tenantUsers)
        .innerJoin(tenants, eq(tenants.id, tenantUsers.tenantId))
        .where(eq(tenantUsers.userId, user.id))
        .limit(1);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tenantSlug: tenantUser?.tenantSlug || null,
        tenantId: tenantUser?.tenantId || null,
        role: tenantUser?.role || null,
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Error signing in' });
    }
  });

  // POST /api/auth/logout - Sign out user
  app.post('/api/auth/logout', async (req: AuthRequest, res) => {
    try {
      req.session?.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ message: 'Error signing out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Error signing out' });
    }
  });

  // GET /api/auth/me - Get current user
  app.get('/api/auth/me', async (req: AuthRequest, res) => {
    try {
      if (!req.session?.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }

      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          emailVerified: users.emailVerified,
        })
        .from(users)
        .where(eq(users.id, req.session.userId))
        .limit(1);

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Get user's tenant if exists
      const [tenantUser] = await db
        .select({
          tenantSlug: tenants.slug,
          tenantId: tenantUsers.tenantId,
          tenantName: tenants.name,
          role: tenantUsers.role,
        })
        .from(tenantUsers)
        .innerJoin(tenants, eq(tenants.id, tenantUsers.tenantId))
        .where(eq(tenantUsers.userId, user.id))
        .limit(1);

      res.json({
        user,
        tenant: tenantUser ? {
          id: tenantUser.tenantId,
          slug: tenantUser.tenantSlug,
          name: tenantUser.tenantName,
          role: tenantUser.role,
        } : null,
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Error fetching user' });
    }
  });

  // POST /api/auth/verify - Verify email address
  app.post('/api/auth/verify', async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
      }

      // Find user with this token
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, token))
        .limit(1);

      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }

      if (user.emailVerified) {
        return res.json({ message: 'Email already verified' });
      }

      // Update user as verified
      await db
        .update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      res.json({ message: 'Email verified successfully' });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Error verifying email' });
    }
  });

  // POST /api/auth/forgot - Send password reset email
  app.post('/api/auth/forgot', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ 
          message: 'If an account with this email exists, a password reset link has been sent.' 
        });
      }

      // Generate reset token (expires in 1 hour)
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db
        .update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Send reset email
      try {
        await EmailService.sendPasswordResetEmail(email, resetToken, user.firstName);
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
      }

      res.json({ 
        message: 'If an account with this email exists, a password reset link has been sent.' 
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Error processing request' });
    }
  });

  // POST /api/auth/reset - Reset password with token
  app.post('/api/auth/reset', async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ 
          message: 'Reset token and new password are required' 
        });
      }

      if (password.length < 8) {
        return res.status(400).json({ 
          message: 'Password must be at least 8 characters long' 
        });
      }

      // Find user with valid reset token
      const [user] = await db
        .select()
        .from(users)
        .where(and(
          eq(users.passwordResetToken, token),
          // Token not expired
        ))
        .limit(1);

      if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
        return res.status(400).json({ 
          message: 'Invalid or expired reset token' 
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Update password and clear reset token
      await db
        .update(users)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      res.json({ message: 'Password reset successfully' });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: 'Error resetting password' });
    }
  });

  // POST /api/auth/resend-verification - Resend verification email
  app.post('/api/auth/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (!user) {
        return res.json({ message: 'If an account exists, a verification email has been sent.' });
      }

      if (user.emailVerified) {
        return res.json({ message: 'Email is already verified' });
      }

      // Generate new verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      await db
        .update(users)
        .set({
          emailVerificationToken,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Send verification email
      try {
        await EmailService.sendVerificationEmail(user.email, emailVerificationToken, user.firstName);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
      }

      res.json({ message: 'If an account exists, a verification email has been sent.' });

    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Error sending verification email' });
    }
  });
}