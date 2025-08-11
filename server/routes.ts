import type { Express } from "express";
import { createServer, type Server } from "http";
import { sessionMiddleware } from "./middleware/session";
import { tenantContext } from "./middleware/tenant";
import { requireAuth, requireTenantAdmin, requireStaffAccess, requireViewerAccess, requirePermission } from "./middleware/auth";
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

  // Apply tenant context middleware to tenant-specific routes only
  app.use('/api/venues', requireAuth, requireViewerAccess, tenantContext);
  app.use('/api/bookings', requireAuth, requireViewerAccess, tenantContext);
  app.use('/api/customers', requireAuth, requireViewerAccess, tenantContext);
  app.use('/api/leads', requireAuth, requireViewerAccess, tenantContext);
  app.use('/api/proposals', requireAuth, requireViewerAccess, tenantContext);
  app.use('/api/tasks', requireAuth, requireViewerAccess, tenantContext);
  
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

  app.post("/api/venues", requireStaffAccess, async (req: any, res) => {
    try {
      const venueData = insertVenueSchema.parse({
        ...req.body,
        tenantId: req.tenant.id,
      });
      const venue = await storage.createVenue(venueData);
      res.status(201).json(venue);
    } catch (error: any) {
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

  app.post("/api/proposals", async (req: any, res) => {
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

  app.post("/api/tasks", async (req: any, res) => {
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
  app.get("/api/dashboard/stats", requireAuth, tenantContext, async (req: any, res) => {
    try {
      const stats = await storage.getDashboardStats(req.tenant.id);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });





  const httpServer = createServer(app);
  return httpServer;
}