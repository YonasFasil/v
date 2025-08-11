import type { Express } from "express";
import { createServer, type Server } from "http";
import { sessionMiddleware } from "./middleware/session";
// import { tenantContext } from "./middleware/tenantContext";
import { requireAuth, requireTenantAdmin, requireStaffAccess, requireViewerAccess, requirePermission, requireSuperAdmin } from "./middleware/auth";
import { requireFeature, checkUsageLimit } from "./middleware/featureGating";
import { registerAuthRoutes } from "./routes/auth";
import { registerPublicRoutes } from "./routes/public";
// Onboarding routes removed
import { registerSuperAdminRoutes } from "./routes/superadmin";
import { storage } from "./storage";
import { 
  insertBookingSchema, 
  insertCustomerSchema,
  insertProposalSchema, 
  insertTaskSchema,
  insertLeadSchema,
  insertVenueSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply session middleware globally
  app.use(sessionMiddleware);

  // Register public routes (no auth required)
  registerPublicRoutes(app);

  // Register auth routes
  registerAuthRoutes(app);

  // Onboarding removed - users go directly to tenant dashboard after signup

  // Register super admin routes
  registerSuperAdminRoutes(app);

  // Apply auth middleware to tenant-specific routes (simplified)
  app.use('/api/venues', requireAuth);
  app.use('/api/bookings', requireAuth);
  app.use('/api/customers', requireAuth);
  app.use('/api/leads', requireAuth);
  app.use('/api/proposals', requireAuth);
  app.use('/api/tasks', requireAuth);
  
  // Venues
  app.get("/api/venues", async (req: any, res) => {
    try {
      const venues = await storage.getVenues(req.user.currentTenant.id);
      res.json(venues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch venues" });
    }
  });

  app.get("/api/venues/:id", async (req, res) => {
    try {
      const venue = await storage.getVenue(req.params.id);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      res.json(venue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch venue" });
    }
  });

  app.post("/api/venues", async (req: any, res) => {
    try {
      if (!req.user?.currentTenant?.id) {
        return res.status(403).json({ 
          message: "User tenant context not found"
        });
      }
      
      const venueData = insertVenueSchema.parse({
        ...req.body,
        tenantId: req.user.currentTenant.id,
      });
      
      const venue = await storage.createVenue(venueData);
      res.status(201).json(venue);
    } catch (error: any) {
      console.error('Venue creation error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create venue" });
    }
  });

  // Customers
  app.get("/api/customers", async (req: any, res) => {
    try {
      const customers = await storage.getCustomers(req.user.currentTenant.id);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", requireFeature({ feature: "customer-management" }), checkUsageLimit("maxCustomers"), async (req: any, res) => {
    try {
      const customerData = insertCustomerSchema.parse({
        ...req.body,
        tenantId: req.user.currentTenant.id,
      });
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Leads
  app.get("/api/leads", async (req: any, res) => {
    try {
      const leads = await storage.getLeads(req.user.currentTenant.id);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", requireFeature({ feature: "lead-management" }), async (req: any, res) => {
    try {
      const leadData = insertLeadSchema.parse({
        ...req.body,
        tenantId: req.user.currentTenant.id,
      });
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // Bookings
  app.get("/api/bookings", async (req: any, res) => {
    try {
      const bookings = await storage.getBookings(req.user.currentTenant.id);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", requireFeature({ feature: "event-management" }), checkUsageLimit("maxBookings"), async (req: any, res) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        tenantId: req.user.currentTenant.id,
      });
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Proposals
  app.get("/api/proposals", async (req: any, res) => {
    try {
      const proposals = await storage.getProposals(req.tenant.id);
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  app.post("/api/proposals", requireFeature({ feature: "proposal-system" }), async (req: any, res) => {
    try {
      const proposalData = insertProposalSchema.parse({
        ...req.body,
        tenantId: req.tenant.id,
      });
      const proposal = await storage.createProposal(proposalData);
      res.status(201).json(proposal);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create proposal" });
    }
  });

  // Tasks
  app.get("/api/tasks", async (req: any, res) => {
    try {
      const tasks = await storage.getTasks(req.tenant.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", requireFeature({ feature: "task-management" }), async (req: any, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        tenantId: req.tenant.id,
      });
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats(req.user.currentTenant.id);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Super Admin Routes - moved from superadmin.ts
  app.get("/api/admin/users", requireAuth, requireSuperAdmin, async (req: any, res) => {
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

  app.get("/api/admin/tenants", requireAuth, requireSuperAdmin, async (req: any, res) => {
    try {
      const tenants = await storage.getAllTenantsWithOwners();
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.get("/api/admin/packages", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const packages = await storage.getFeaturePackages();
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.get("/api/admin/analytics", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const tenants = await storage.getAllTenants();
      const packages = await storage.getFeaturePackages();
      
      const totalUsers = users.filter(u => !u.isSuperAdmin).length;
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentSignups = users.filter(u => 
        u.createdAt && new Date(u.createdAt) > thirtyDaysAgo && !u.isSuperAdmin
      ).length;

      const analytics = {
        totalUsers,
        recentSignups,
        totalTenants: tenants.length,
        totalPackages: packages.length,
        totalRevenue: 0, // Would need Stripe integration
        recentActivity: [], // Would need activity tracking
      };

      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  app.delete("/api/admin/users/:userId", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      
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

  app.put("/api/admin/tenants/:tenantId", requireAuth, requireSuperAdmin, async (req, res) => {
    try {
      const { tenantId } = req.params;
      const updateData = req.body;
      
      const updatedTenant = await storage.updateTenant(tenantId, updateData);
      res.json(updatedTenant);
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  // Get current tenant's package information for feature access
  app.get("/api/tenant/package", requireAuth, async (req, res) => {
    try {
      const user = req.user;
      
      // Super admin doesn't need package restrictions
      if (user?.isSuperAdmin) {
        return res.json({
          id: 'super-admin',
          name: 'Super Admin',
          features: {}, // All features enabled by middleware
          limits: {}, // No limits for super admin
        });
      }
      
      if (!user?.currentTenant) {
        return res.status(403).json({ message: "No tenant access" });
      }
      
      const tenant = await storage.getTenant(user.currentTenant.id);
      if (!tenant?.planId) {
        return res.status(404).json({ message: "No plan assigned to tenant" });
      }
      
      const featurePackage = await storage.getFeaturePackage(tenant.planId);
      if (!featurePackage) {
        return res.status(404).json({ message: "Feature package not found" });
      }
      
      res.json(featurePackage);
    } catch (error) {
      console.error("Error fetching tenant package:", error);
      res.status(500).json({ message: "Failed to fetch package information" });
    }
  });





  const httpServer = createServer(app);
  return httpServer;
}