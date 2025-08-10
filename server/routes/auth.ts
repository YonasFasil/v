import type { Express } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
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

      // Find user using direct SQL to avoid schema mismatch
      const result = await db.execute(sql`
        SELECT * FROM users WHERE email = ${email} LIMIT 1
      `);
      const user = result.rows;

      if (user.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const foundUser = user[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, foundUser.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if email is verified (using snake_case from database)
      if (!foundUser.email_verified) {
        return res.status(403).json({ 
          message: 'Please verify your email address before signing in',
          emailVerificationRequired: true
        });
      }

      // Create session
      req.session.userId = foundUser.id;
      req.session.user = {
        id: foundUser.id,
        email: foundUser.email,
        firstName: foundUser.first_name || '',
        lastName: foundUser.last_name || '',
      };

      res.json({
        message: 'Login successful',
        user: {
          id: foundUser.id,
          email: foundUser.email,
          firstName: foundUser.first_name,
          lastName: foundUser.last_name,
        },
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
      res.json({ message: 'Logged out successfully' });
    });
  });

  // GET /api/auth/me - Get current user
  app.get('/api/auth/me', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json({
      user: req.session.user,
    });
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