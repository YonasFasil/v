import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertBookingSchema, 
  insertCustomerSchema, 
  insertProposalSchema, 
  insertPaymentSchema,
  insertTaskSchema,
  insertAiInsightSchema 
} from "@shared/schema";
import { 
  generateAIInsights,
  generateSmartScheduling,
  generateEmailReply,
  scoreLeadPriority,
  generateProposal
} from "./services/gemini";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Venues
  app.get("/api/venues", async (req, res) => {
    try {
      const venues = await storage.getVenues();
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

  // Customers
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Bookings
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.post("/api/bookings", async (req, res) => {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(validatedData);
      res.json(booking);
    } catch (error) {
      res.status(400).json({ message: "Invalid booking data" });
    }
  });

  app.patch("/api/bookings/:id", async (req, res) => {
    try {
      const booking = await storage.updateBooking(req.params.id, req.body);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Proposals
  app.get("/api/proposals", async (req, res) => {
    try {
      const proposals = await storage.getProposals();
      res.json(proposals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  app.post("/api/proposals", async (req, res) => {
    try {
      const validatedData = insertProposalSchema.parse(req.body);
      const proposal = await storage.createProposal(validatedData);
      res.json(proposal);
    } catch (error) {
      res.status(400).json({ message: "Invalid proposal data" });
    }
  });

  app.post("/api/proposals/generate", async (req, res) => {
    try {
      const { eventDetails, venueDetails, customerPreferences } = req.body;
      const content = await generateProposal(eventDetails, venueDetails);
      res.json({ content });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate proposal" });
    }
  });

  // Payments
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.json(payment);
    } catch (error) {
      res.status(400).json({ message: "Invalid payment data" });
    }
  });

  // Tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: "Invalid task data" });
    }
  });

  // AI Features
  app.get("/api/ai/insights", async (req, res) => {
    try {
      const insights = await storage.getActiveAiInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI insights" });
    }
  });

  app.post("/api/ai/smart-scheduling", async (req, res) => {
    try {
      const { eventType, guestCount, venueCapacity, existingBookings } = req.body;
      const suggestion = await generateSmartScheduling(eventType, 4);
      res.json(suggestion);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate scheduling suggestion" });
    }
  });

  app.post("/api/ai/email-reply", async (req, res) => {
    try {
      const { emailContent, context, customerName } = req.body;
      const reply = await generateEmailReply(emailContent, context);
      res.json(reply);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate email reply" });
    }
  });

  app.post("/api/ai/lead-score", async (req, res) => {
    try {
      const { customerData, interactionHistory } = req.body;
      const scoring = await scoreLeadPriority(customerData);
      res.json(scoring);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate lead score" });
    }
  });

  app.post("/api/ai/predictive-analytics", async (req, res) => {
    try {
      const { historicalData, currentMetrics } = req.body;
      const analytics = await generateAIInsights();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate predictive analytics" });
    }
  });

  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      const customers = await storage.getCustomers();
      const proposals = await storage.getProposals();
      
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
      const totalRevenue = bookings
        .filter(b => b.totalAmount)
        .reduce((sum, b) => sum + parseFloat(b.totalAmount!), 0);
      
      const activeLeads = customers.filter(c => c.status === "lead").length;
      const highPriorityLeads = customers.filter(c => c.leadScore && c.leadScore >= 80).length;
      
      // Calculate venue utilization (simplified)
      const venueUtilization = Math.round((confirmedBookings / Math.max(totalBookings, 1)) * 100);
      
      res.json({
        totalBookings,
        revenue: totalRevenue,
        activeLeads,
        utilization: venueUtilization,
        highPriorityLeads
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
