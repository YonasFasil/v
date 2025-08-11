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
  insertVenueSchema,
  insertSpaceSchema
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
  app.use('/api/spaces', requireAuth);
  app.use('/api/bookings', requireAuth);
  app.use('/api/customers', requireAuth);
  app.use('/api/leads', requireAuth);
  app.use('/api/proposals', requireAuth);
  app.use('/api/tasks', requireAuth);
  
  // Venues (specific routes first, then general routes)
  app.get("/api/venues-with-spaces", requireAuth, async (req: any, res) => {
    try {
      if (!req.user?.currentTenant?.id) {
        return res.status(403).json({ 
          message: "User tenant context not found"
        });
      }
      
      const venues = await storage.getVenues(req.user.currentTenant.id);
      // Get spaces for each venue and combine the data
      const venuesWithSpaces = await Promise.all(
        venues.map(async (venue: any) => {
          const spaces = await storage.getSpacesByVenue(venue.id);
          return {
            ...venue,
            spaces
          };
        })
      );
      res.json(venuesWithSpaces);
    } catch (error) {
      console.error('Venues with spaces error:', error);
      res.status(500).json({ message: "Failed to fetch venues with spaces" });
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

  app.get("/api/venues/:id/spaces", async (req, res) => {
    try {
      const spaces = await storage.getSpacesByVenue(req.params.id);
      res.json(spaces);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch venue spaces" });
    }
  });

  app.get("/api/venues", async (req: any, res) => {
    try {
      const venues = await storage.getVenues(req.user.currentTenant.id);
      res.json(venues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch venues" });
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

  app.delete("/api/venues/:id", requireAuth, async (req: any, res) => {
    try {
      if (!req.user?.currentTenant?.id) {
        return res.status(403).json({ 
          message: "User tenant context not found"
        });
      }
      
      // Verify the venue belongs to the current tenant
      const venue = await storage.getVenue(req.params.id);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      if (venue.tenantId !== req.user.currentTenant.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteVenue(req.params.id);
      res.json({ message: "Venue deleted successfully" });
    } catch (error: any) {
      console.error('Venue deletion error:', error);
      res.status(500).json({ message: "Failed to delete venue" });
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

  app.post("/api/customers", requireAuth, async (req: any, res) => {
    try {
      if (!req.user?.currentTenant?.id) {
        return res.status(403).json({ 
          message: "User tenant context not found"
        });
      }
      
      const customerData = insertCustomerSchema.parse({
        ...req.body,
        tenantId: req.user.currentTenant.id,
      });
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error: any) {
      console.error('Customer creation error:', error);
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

  app.post("/api/leads", requireAuth, async (req: any, res) => {
    try {
      if (!req.user?.currentTenant?.id) {
        return res.status(403).json({ 
          message: "User tenant context not found"
        });
      }
      
      const leadData = insertLeadSchema.parse({
        ...req.body,
        tenantId: req.user.currentTenant.id,
      });
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error: any) {
      console.error('Lead creation error:', error);
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

  app.post("/api/bookings", requireAuth, async (req: any, res) => {
    try {
      if (!req.user?.currentTenant?.id) {
        return res.status(403).json({ 
          message: "User tenant context not found"
        });
      }
      
      // Convert string dates to Date objects for schema validation
      const requestData = { ...req.body };
      if (requestData.eventDate && typeof requestData.eventDate === 'string') {
        requestData.eventDate = new Date(requestData.eventDate);
      }
      
      const bookingData = insertBookingSchema.parse({
        ...requestData,
        tenantId: req.user.currentTenant.id,
      });
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error: any) {
      console.error('Booking creation error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  // Proposals
  app.get("/api/proposals", requireAuth, async (req: any, res) => {
    try {
      if (!req.user?.currentTenant?.id) {
        return res.status(403).json({ 
          message: "User tenant context not found"
        });
      }
      
      const proposals = await storage.getProposals(req.user.currentTenant.id);
      res.json(proposals);
    } catch (error) {
      console.error('Proposals fetch error:', error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  app.post("/api/proposals", requireAuth, async (req: any, res) => {
    try {
      if (!req.user?.currentTenant?.id) {
        return res.status(403).json({ 
          message: "User tenant context not found"
        });
      }
      
      const proposalData = insertProposalSchema.parse({
        ...req.body,
        tenantId: req.user.currentTenant.id,
      });
      const proposal = await storage.createProposal(proposalData);
      res.status(201).json(proposal);
    } catch (error: any) {
      console.error('Proposal creation error:', error);
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

  // Spaces
  app.get("/api/spaces", async (req: any, res) => {
    try {
      const spaces = await storage.getSpaces(req.user.currentTenant.id);
      res.json(spaces);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch spaces" });
    }
  });

  app.post("/api/spaces", async (req: any, res) => {
    try {
      const spaceData = insertSpaceSchema.parse({
        ...req.body,
        tenantId: req.user.currentTenant.id,
      });
      const space = await storage.createSpace(spaceData);
      res.status(201).json(space);
    } catch (error: any) {
      console.error('Space creation error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create space" });
    }
  });

  // Services
  app.get("/api/services", requireAuth, async (req: any, res) => {
    try {
      const services = await storage.getServices(req.user.currentTenant.id);
      res.json(services);
    } catch (error) {
      console.error('Services fetch error:', error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", requireAuth, async (req: any, res) => {
    try {
      const serviceData = {
        ...req.body,
        tenantId: req.user.currentTenant.id,
      };
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error: any) {
      console.error('Service creation error:', error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.delete("/api/services/:id", requireAuth, async (req: any, res) => {
    try {
      if (!req.user?.currentTenant?.id) {
        return res.status(403).json({ 
          message: "User tenant context not found"
        });
      }
      
      // Verify the service belongs to the current tenant
      const service = await storage.getService(req.params.id);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      if (service.tenantId !== req.user.currentTenant.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteService(req.params.id);
      res.json({ message: "Service deleted successfully" });
    } catch (error: any) {
      console.error('Service deletion error:', error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Packages (service packages)
  app.get("/api/packages", requireAuth, async (req: any, res) => {
    try {
      const packages = await storage.getPackages(req.user.currentTenant.id);
      res.json(packages);
    } catch (error) {
      console.error('Packages fetch error:', error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.post("/api/packages", requireAuth, async (req: any, res) => {
    try {
      const packageData = {
        ...req.body,
        tenantId: req.user.currentTenant.id,
      };
      const pkg = await storage.createPackage(packageData);
      res.status(201).json(pkg);
    } catch (error: any) {
      console.error('Package creation error:', error);
      res.status(500).json({ message: "Failed to create package" });
    }
  });

  app.delete("/api/packages/:id", requireAuth, async (req: any, res) => {
    try {
      if (!req.user?.currentTenant?.id) {
        return res.status(403).json({ 
          message: "User tenant context not found"
        });
      }
      
      // Verify the package belongs to the current tenant
      const pkg = await storage.getPackage(req.params.id);
      if (!pkg) {
        return res.status(404).json({ message: "Package not found" });
      }
      
      if (pkg.tenantId !== req.user.currentTenant.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deletePackage(req.params.id);
      res.json({ message: "Package deleted successfully" });
    } catch (error: any) {
      console.error('Package deletion error:', error);
      res.status(500).json({ message: "Failed to delete package" });
    }
  });

  // Tax Settings
  app.get("/api/tax-settings", requireAuth, async (req: any, res) => {
    try {
      const taxSettings = await storage.getTaxSettings(req.user.currentTenant.id);
      res.json(taxSettings);
    } catch (error) {
      console.error('Tax settings fetch error:', error);
      res.status(500).json({ message: "Failed to fetch tax settings" });
    }
  });

  app.post("/api/tax-settings", requireAuth, async (req: any, res) => {
    try {
      if (!req.user?.currentTenant?.id) {
        return res.status(403).json({ 
          message: "User tenant context not found"
        });
      }
      
      const taxData = {
        ...req.body,
        rate: req.body.value ? parseFloat(req.body.value).toString() : req.body.value, // Map 'value' field to 'rate'
        tenantId: req.user.currentTenant.id,
      };
      // Remove 'value' field since it's mapped to 'rate'
      delete taxData.value;
      
      const taxSettings = await storage.createTaxSettings(taxData);
      res.status(201).json(taxSettings);
    } catch (error: any) {
      console.error('Tax settings creation error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tax settings" });
    }
  });

  // Setup Styles
  app.get("/api/setup-styles", requireAuth, async (req: any, res) => {
    try {
      const setupStyles = await storage.getSetupStyles(req.user.currentTenant.id);
      res.json(setupStyles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch setup styles" });
    }
  });

  app.post("/api/setup-styles", requireAuth, async (req: any, res) => {
    try {
      const styleData = {
        ...req.body,
        tenantId: req.user.currentTenant.id,
      };
      const setupStyles = await storage.createSetupStyles(styleData);
      res.status(201).json(setupStyles);
    } catch (error: any) {
      console.error('Setup styles creation error:', error);
      res.status(500).json({ message: "Failed to create setup styles" });
    }
  });

  // Settings
  app.get("/api/settings", requireAuth, async (req: any, res) => {
    try {
      const settings = await storage.getSettings(req.user.currentTenant.id);
      res.json(settings);
    } catch (error) {
      console.error('Settings fetch error:', error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", requireAuth, async (req: any, res) => {
    try {
      const settingsData = {
        ...req.body,
        tenantId: req.user.currentTenant.id,
      };
      const settings = await storage.createSettings(settingsData);
      res.status(201).json(settings);
    } catch (error: any) {
      console.error('Settings creation error:', error);
      res.status(500).json({ message: "Failed to create settings" });
    }
  });

  // Payments
  app.get("/api/payments", requireAuth, async (req: any, res) => {
    try {
      const payments = await storage.getPayments(req.user.currentTenant.id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Tags
  app.get("/api/tags", requireAuth, async (req: any, res) => {
    try {
      const tags = await storage.getTags(req.user.currentTenant.id);
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });

  // Campaign Sources
  app.get("/api/campaign-sources", requireAuth, async (req: any, res) => {
    try {
      const sources = await storage.getCampaignSources(req.user.currentTenant.id);
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch campaign sources" });
    }
  });

  // Tasks
  app.get("/api/tasks", requireAuth, async (req: any, res) => {
    try {
      const tasks = await storage.getTasks(req.user.currentTenant.id);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", requireAuth, async (req: any, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        tenantId: req.user.currentTenant.id,
      });
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error: any) {
      console.error('Task creation error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Proposals
  app.get("/api/proposals", requireAuth, async (req: any, res) => {
    try {
      const proposals = await storage.getProposals(req.user.currentTenant.id);
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  app.post("/api/proposals", requireAuth, async (req: any, res) => {
    try {
      const proposalData = insertProposalSchema.parse({
        ...req.body,
        tenantId: req.user.currentTenant.id,
      });
      const proposal = await storage.createProposal(proposalData);
      res.status(201).json(proposal);
    } catch (error: any) {
      console.error('Proposal creation error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create proposal" });
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