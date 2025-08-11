import type { Express } from "express";
import { createServer, type Server } from "http";
import { sessionMiddleware } from "./middleware/session";
import { tenantContext } from "./middleware/tenant";
import { requireAuth } from "./middleware/auth";
import { registerAuthRoutes } from "./routes/auth";
import { registerPublicRoutes } from "./routes/public";
import { registerOnboardingRoutes } from "./routes/onboarding";
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

  // Register onboarding routes (after auth, before tenant middleware)
  registerOnboardingRoutes(app);

  // Apply tenant context middleware to tenant-specific routes only
  app.use('/api/venues', requireAuth, tenantContext);
  app.use('/api/bookings', requireAuth, tenantContext);
  app.use('/api/customers', requireAuth, tenantContext);
  app.use('/api/leads', requireAuth, tenantContext);
  app.use('/api/proposals', requireAuth, tenantContext);
  app.use('/api/tasks', requireAuth, tenantContext);
  
  // Venues
  app.get("/api/venues", async (req: any, res) => {
    try {
      const venues = await storage.getVenues(req.tenant?.id);
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
      const venueData = insertVenueSchema.parse({
        ...req.body,
        tenantId: req.tenant.id,
      });
      const venue = await storage.createVenue(venueData);
      res.status(201).json(venue);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create venue" });
    }
  });

  // Customers
  app.get("/api/customers", async (req: any, res) => {
    try {
      const customers = await storage.getCustomers(req.tenant.id);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req: any, res) => {
    try {
      const customerData = insertCustomerSchema.parse({
        ...req.body,
        tenantId: req.tenant.id,
      });
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  // Leads
  app.get("/api/leads", async (req: any, res) => {
    try {
      const leads = await storage.getLeads(req.tenant.id);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post("/api/leads", async (req: any, res) => {
    try {
      const leadData = insertLeadSchema.parse({
        ...req.body,
        tenantId: req.tenant.id,
      });
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  // Bookings
  app.get("/api/bookings", async (req: any, res) => {
    try {
      const bookings = await storage.getBookings(req.tenant.id);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", async (req: any, res) => {
    try {
      const bookingData = insertBookingSchema.parse({
        ...req.body,
        tenantId: req.tenant.id,
      });
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
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

  app.post("/api/proposals", async (req: any, res) => {
    try {
      const proposalData = insertProposalSchema.parse({
        ...req.body,
        tenantId: req.tenant.id,
      });
      const proposal = await storage.createProposal(proposalData);
      res.status(201).json(proposal);
    } catch (error) {
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

  app.post("/api/tasks", async (req: any, res) => {
    try {
      const taskData = insertTaskSchema.parse({
        ...req.body,
        tenantId: req.tenant.id,
      });
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, tenantContext, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats(req.tenant.id);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Super Admin Routes
  app.get("/api/admin/users", async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/tenants", async (req: any, res) => {
    try {
      const tenants = await storage.getAllTenants();
      res.json(tenants);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.get("/api/admin/packages", async (req: any, res) => {
    try {
      const packages = await storage.getAllFeaturePackages();
      res.json(packages);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.delete("/api/admin/users/:id", async (req: any, res) => {
    try {
      const success = await storage.deleteUser(req.params.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  app.delete("/api/admin/tenants/:id", async (req: any, res) => {
    try {
      const success = await storage.deleteTenant(req.params.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Tenant not found" });
      }
    } catch (error) {
      console.error("Failed to delete tenant:", error);
      res.status(500).json({ message: "Failed to delete tenant" });
    }
  });

  // Super Admin routes (PostgreSQL-based)
  app.get('/api/admin/users', requireAuth, async (req: any, res) => {
    try {
      // Check if user is super admin
      const user = await storage.getUser(req.user.id);
      if (!user || !user.isSuperAdmin) {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/tenants', requireAuth, async (req: any, res) => {
    try {
      // Check if user is super admin
      const user = await storage.getUser(req.user.id);
      if (!user || !user.isSuperAdmin) {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const tenants = await storage.getTenants();
      res.json(tenants);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      res.status(500).json({ message: 'Failed to fetch tenants' });
    }
  });

  app.get('/api/admin/packages', requireAuth, async (req: any, res) => {
    try {
      // Check if user is super admin
      const user = await storage.getUser(req.user.id);
      if (!user || !user.isSuperAdmin) {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const packages = await storage.getFeaturePackages();
      res.json(packages);
    } catch (error) {
      console.error('Error fetching packages:', error);
      res.status(500).json({ message: 'Failed to fetch packages' });
    }
  });

  app.delete('/api/admin/users/:id', requireAuth, async (req: any, res) => {
    try {
      // Check if user is super admin
      const user = await storage.getUser(req.user.id);
      if (!user || !user.isSuperAdmin) {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const success = await storage.deleteUser(req.params.id);
      if (success) {
        res.json({ message: 'User deleted successfully' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });

  app.delete('/api/admin/tenants/:id', requireAuth, async (req: any, res) => {
    try {
      // Check if user is super admin
      const user = await storage.getUser(req.user.id);
      if (!user || !user.isSuperAdmin) {
        return res.status(403).json({ message: 'Super admin access required' });
      }

      const success = await storage.deleteTenant(req.params.id);
      if (success) {
        res.json({ message: 'Tenant deleted successfully' });
      } else {
        res.status(404).json({ message: 'Tenant not found' });
      }
    } catch (error) {
      console.error('Error deleting tenant:', error);
      res.status(500).json({ message: 'Failed to delete tenant' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}