import type { Express } from "express";
import { storage } from "../storage";
import { requireAuth, requireSuperAdmin } from "../middleware/auth";
import { insertFeaturePackageSchema } from "@shared/schema";

export function registerSuperAdminRoutes(app: Express) {
  // Get all users with tenant information
  app.get("/api/admin/users", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const usersWithTenants = await Promise.all(
        users.map(async (user) => {
          const tenants = await storage.getUserTenants(user.id);
          const { passwordHash, emailVerificationToken, passwordResetToken, ...userResponse } = user;
          return {
            ...userResponse,
            tenants: tenants.map(t => ({
              id: t.tenant.id,
              name: t.tenant.name,
              slug: t.tenant.slug,
              role: t.role,
              planId: t.tenant.planId,
              status: t.tenant.status,
            })),
            tenantCount: tenants.length,
          };
        })
      );
      
      res.json(usersWithTenants);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:userId", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Prevent deleting super admin
      const user = await storage.getUser(userId);
      if (user?.isSuperAdmin) {
        return res.status(403).json({ message: "Cannot delete super admin user" });
      }

      const success = await storage.deleteUser(userId);
      if (success) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Get all tenants with owner information
  app.get("/api/admin/tenants", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      // This would need to be implemented in storage
      const tenants = await storage.getAllTenantsWithOwners();
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  // Update tenant
  app.put("/api/admin/tenants/:tenantId", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const updates = req.body;
      const updatedTenant = await storage.updateTenant(tenantId, updates);
      res.json(updatedTenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  // Delete tenant
  app.delete("/api/admin/tenants/:tenantId", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      await storage.deleteTenant(tenantId);
      res.json({ message: "Tenant deleted successfully" });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });

  // Get feature packages
  app.get("/api/admin/packages", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const packages = await storage.getFeaturePackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  // Create feature package
  app.post("/api/admin/packages", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const packageData = insertFeaturePackageSchema.parse(req.body);
      const newPackage = await storage.createFeaturePackage(packageData);
      res.status(201).json(newPackage);
    } catch (error: any) {
      console.error("Error creating package:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create package" });
    }
  });

  // Update feature package
  app.patch("/api/admin/packages/:packageId", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { packageId } = req.params;
      const updates = req.body;
      const updatedPackage = await storage.updateFeaturePackage(packageId, updates);
      res.json(updatedPackage);
    } catch (error) {
      console.error("Error updating package:", error);
      res.status(500).json({ message: "Failed to update package" });
    }
  });

  // Delete feature package
  app.delete("/api/admin/packages/:packageId", requireSuperAdmin, async (req, res) => {
    try {
      const { packageId } = req.params;
      await storage.deleteFeaturePackage(packageId);
      res.json({ message: "Package deleted successfully" });
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "Failed to delete package" });
    }
  });

  // Get platform analytics
  app.get("/api/admin/analytics", requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const totalUsers = users.length;
      const activeUsers = users.filter(u => !u.isSuperAdmin).length;
      const superAdmins = users.filter(u => u.isSuperAdmin).length;

      // Get recent signups (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentSignups = users.filter(u => 
        u.createdAt && new Date(u.createdAt) > thirtyDaysAgo && !u.isSuperAdmin
      ).length;

      // This could be enhanced with more analytics from the database
      const analytics = {
        totalUsers: activeUsers,
        recentSignups,
        totalRevenue: 0, // Would need to calculate from Stripe data
        activePlans: {
          starter: 0,
          professional: 0,
          enterprise: 0,
        },
        userGrowth: [], // Would need historical data
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Impersonate user (for support)
  app.post("/api/admin/impersonate/:userId", requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isSuperAdmin) {
        return res.status(403).json({ message: "Cannot impersonate super admin" });
      }

      // Store original admin info for switching back
      (req.session as any).impersonation = {
        originalUserId: req.user?.id,
        impersonatedUserId: userId,
      };

      // Update session to impersonated user
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        isSuperAdmin: false,
      };

      res.json({ 
        message: "Impersonation started",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      console.error("Error starting impersonation:", error);
      res.status(500).json({ message: "Failed to start impersonation" });
    }
  });

  // Stop impersonation
  app.post("/api/admin/stop-impersonation", requireSuperAdmin, async (req, res) => {
    try {
      const impersonation = (req.session as any).impersonation;
      if (!impersonation) {
        return res.status(400).json({ message: "No active impersonation" });
      }

      const originalUser = await storage.getUser(impersonation.originalUserId);
      if (!originalUser) {
        return res.status(500).json({ message: "Original user not found" });
      }

      // Restore original admin session
      (req.session as any).user = {
        id: originalUser.id,
        email: originalUser.email,
        isSuperAdmin: originalUser.isSuperAdmin || false,
      };

      delete (req.session as any).impersonation;

      res.json({ message: "Impersonation stopped" });
    } catch (error) {
      console.error("Error stopping impersonation:", error);
      res.status(500).json({ message: "Failed to stop impersonation" });
    }
  });
}