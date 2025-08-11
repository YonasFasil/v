import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, generateToken } from "../middleware/auth";
import { insertUserSchema } from "@shared/schema";
import crypto from "crypto";

export function registerAuthRoutes(app: Express) {
  // Signup endpoint - matches frontend call
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName, packageId, companyName } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !packageId || !companyName) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Verify package exists
      const selectedPackage = await storage.getFeaturePackage(packageId);
      if (!selectedPackage) {
        return res.status(400).json({ message: "Invalid package selected" });
      }

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      // Create user
      const user = await storage.createUser({
        email,
        firstName,
        lastName,
        passwordHash: password, // Will be hashed in storage
        emailVerificationToken,
        emailVerified: false,
      });

      // Create tenant for the user with selected package
      const tenantSlug = companyName.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now().toString(36);

      const tenant = await storage.createTenant({
        name: companyName,
        slug: tenantSlug,
        planId: packageId,
        contactName: `${firstName} ${lastName}`,
        contactEmail: email,
        ownerId: user.id,
        status: 'active',
      });

      // Add user as owner to tenant
      await storage.addUserToTenant({
        tenantId: tenant.id,
        userId: user.id,
        role: 'owner',
        permissions: {},
      });

      // Generate token
      const token = generateToken(user);

      // Store user in session
      req.session.user = {
        id: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin || false,
      };

      // Remove sensitive data from response
      const { passwordHash, emailVerificationToken: _, ...userResponse } = user;

      res.status(201).json({
        message: "Account created successfully",
        user: userResponse,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          planId: tenant.planId,
        },
        token,
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account. Please try again." });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Verify user credentials
      const user = await storage.verifyPassword(email, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = generateToken(user);

      // Store user in session
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin || false,
      };

      // Remove sensitive data from response
      const { passwordHash, ...userResponse } = user;

      res.json({
        message: "Login successful",
        user: userResponse,
        token,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get current user endpoint
  app.get("/api/auth/user", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user's primary tenant
      const primaryTenant = await storage.getUserPrimaryTenant(user.id);

      // Remove sensitive data from response
      const { passwordHash, ...userResponse } = user;

      res.json({
        ...userResponse,
        currentTenant: primaryTenant ? {
          id: primaryTenant.tenant.id,
          slug: primaryTenant.tenant.slug,
          name: primaryTenant.tenant.name,
          role: primaryTenant.role,
        } : null,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Email verification endpoint
  app.post("/api/auth/verify-email", async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
      }

      // Find user by verification token
      const users = await storage.getUsers(); // We need to implement this
      const user = users.find(u => u.emailVerificationToken === token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      // Update user as verified
      await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
      });

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ message: "Email verification failed" });
    }
  });

  // Password reset request endpoint
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists for security
        return res.json({ message: "If an account with that email exists, you will receive a password reset email." });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.updateUser(user.id, {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      });

      // TODO: Send email with reset token
      
      res.json({ message: "If an account with that email exists, you will receive a password reset email." });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Password reset endpoint
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      // Find user by reset token
      const users = await storage.getUsers(); // We need to implement this
      const user = users.find(u => 
        u.passwordResetToken === token && 
        u.passwordResetExpires && 
        u.passwordResetExpires > new Date()
      );

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Update password and clear reset token
      await storage.updateUser(user.id, {
        passwordHash: password, // Will be hashed in storage
        passwordResetToken: null,
        passwordResetExpires: null,
      });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Password reset failed" });
    }
  });
}