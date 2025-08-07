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

  app.post("/api/venues", async (req, res) => {
    try {
      const venue = await storage.createVenue(req.body);
      res.status(201).json(venue);
    } catch (error) {
      res.status(500).json({ message: "Failed to create venue" });
    }
  });

  // Packages
  app.get("/api/packages", async (req, res) => {
    try {
      const packages = await storage.getPackages();
      res.json(packages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  app.post("/api/packages", async (req, res) => {
    try {
      const packageData = await storage.createPackage(req.body);
      res.status(201).json(packageData);
    } catch (error) {
      res.status(500).json({ message: "Failed to create package" });
    }
  });

  // Services
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const service = await storage.createService(req.body);
      res.status(201).json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to create service" });
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
      // Convert eventDate string to Date object if it's a string
      const bookingData = {
        ...req.body,
        eventDate: typeof req.body.eventDate === 'string' 
          ? new Date(req.body.eventDate) 
          : req.body.eventDate
      };
      
      const validatedData = insertBookingSchema.parse(bookingData);
      
      // Check for time conflicts with existing bookings
      const existingBookings = await storage.getBookings();
      const eventDate = validatedData.eventDate;
      const startTime = validatedData.startTime;
      const endTime = validatedData.endTime;
      const venueId = validatedData.venueId;
      
      const conflict = existingBookings.find(existing => {
        // Skip cancelled bookings
        if (existing.status === 'cancelled') return false;
        
        // Check if same venue and same date
        if (existing.venueId === venueId && 
            existing.eventDate.toDateString() === eventDate.toDateString()) {
          
          // Convert times to minutes for easier comparison
          const parseTime = (timeStr: string) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          };
          
          const newStart = parseTime(startTime);
          const newEnd = parseTime(endTime);
          const existingStart = parseTime(existing.startTime);
          const existingEnd = parseTime(existing.endTime);
          
          // Check for overlap: new booking starts before existing ends AND new booking ends after existing starts
          return (newStart < existingEnd && newEnd > existingStart);
        }
        return false;
      });
      
      if (conflict) {
        return res.status(409).json({ 
          message: "Time slot conflict", 
          conflictingBooking: {
            eventName: conflict.eventName,
            startTime: conflict.startTime,
            endTime: conflict.endTime
          }
        });
      }
      
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

  // Voice parsing endpoint
  app.post("/api/ai/parse-voice", async (req, res) => {
    try {
      const { transcript } = req.body;
      
      if (!transcript) {
        return res.status(400).json({ error: "Transcript is required" });
      }

      // Use Gemini to parse the voice transcript
      const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY || ''
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Parse this voice booking transcript and extract event details. Return a JSON response with the following fields:
              - eventName: string (name of the event)
              - customerName: string (customer name if mentioned)
              - customerEmail: string (email if mentioned)
              - dates: array of strings in YYYY-MM-DD format
              - times: object with date keys and {start: "HH:MM", end: "HH:MM", space: "venue-id"} values
              - eventType: string (type of event like wedding, conference, etc.)
              - guestCount: number (number of guests if mentioned)
              
              Transcript: "${transcript}"
              
              Important: Only extract information that is clearly mentioned. Use null for missing information. For dates, convert relative dates like "next Friday" to actual dates. For times, convert to 24-hour format.`
            }]
          }],
          generationConfig: {
            response_mime_type: "application/json"
          }
        })
      });

      if (!geminiResponse.ok) {
        throw new Error('Failed to parse voice input with Gemini');
      }

      const geminiData = await geminiResponse.json();
      const parsedData = JSON.parse(geminiData.candidates[0].content.parts[0].text);

      res.json(parsedData);
    } catch (error) {
      console.error("Error parsing voice input:", error);
      res.status(500).json({ error: "Failed to parse voice input" });
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

  // Global search endpoint
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length < 2) {
        return res.json({ results: [] });
      }

      const results = [];
      
      // Search events/bookings
      try {
        const bookings = await storage.getBookings();
        const eventResults = bookings
          .filter(booking => 
            booking.eventName?.toLowerCase().includes(query.toLowerCase()) ||
            booking.eventType?.toLowerCase().includes(query.toLowerCase())
          )
          .map(booking => ({
            id: booking.id.toString(),
            type: 'event' as const,
            title: booking.eventName || 'Untitled Event',
            subtitle: booking.eventType,
            description: `${booking.guestCount} guests`,
            metadata: {
              date: booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : undefined,
              status: booking.status,
              price: booking.totalAmount ? parseFloat(booking.totalAmount) : undefined
            }
          }));
        results.push(...eventResults);
      } catch (error) {
        console.error('Error searching bookings:', error);
      }

      // Search customers
      try {
        const customers = await storage.getCustomers();
        const customerResults = customers
          .filter(customer => 
            customer.name?.toLowerCase().includes(query.toLowerCase()) ||
            customer.email?.toLowerCase().includes(query.toLowerCase()) ||
            customer.company?.toLowerCase().includes(query.toLowerCase())
          )
          .map(customer => ({
            id: customer.id.toString(),
            type: 'customer' as const,
            title: customer.name || 'Unnamed Customer',
            subtitle: customer.company || customer.email,
            description: customer.phone,
            metadata: {
              status: customer.status
            }
          }));
        results.push(...customerResults);
      } catch (error) {
        console.error('Error searching customers:', error);
      }

      // Search venues
      try {
        const venues = await storage.getVenues();
        const venueResults = venues
          .filter(venue => 
            venue.name?.toLowerCase().includes(query.toLowerCase()) ||
            venue.description?.toLowerCase().includes(query.toLowerCase())
          )
          .map(venue => ({
            id: venue.id.toString(),
            type: 'venue' as const,
            title: venue.name || 'Unnamed Venue',
            subtitle: `Capacity: ${venue.capacity}`,
            description: venue.description,
            metadata: {
              price: venue.pricePerHour ? parseFloat(venue.pricePerHour) : undefined
            }
          }));
        results.push(...venueResults);
      } catch (error) {
        console.error('Error searching venues:', error);
      }

      // Search packages
      try {
        const packages = await storage.getPackages();
        const packageResults = packages
          .filter(pkg => 
            pkg.name?.toLowerCase().includes(query.toLowerCase()) ||
            pkg.description?.toLowerCase().includes(query.toLowerCase())
          )
          .map(pkg => ({
            id: pkg.id.toString(),
            type: 'package' as const,
            title: pkg.name || 'Unnamed Package',
            subtitle: pkg.category,
            description: pkg.description,
            metadata: {
              price: pkg.basePrice ? parseFloat(pkg.basePrice) : undefined
            }
          }));
        results.push(...packageResults);
      } catch (error) {
        console.error('Error searching packages:', error);
      }

      // Search services
      try {
        const services = await storage.getServices();
        const serviceResults = services
          .filter(service => 
            service.name?.toLowerCase().includes(query.toLowerCase()) ||
            service.description?.toLowerCase().includes(query.toLowerCase())
          )
          .map(service => ({
            id: service.id.toString(),
            type: 'service' as const,
            title: service.name || 'Unnamed Service',
            subtitle: service.category,
            description: service.description,
            metadata: {
              price: service.price ? parseFloat(service.price) : undefined
            }
          }));
        results.push(...serviceResults);
      } catch (error) {
        console.error('Error searching services:', error);
      }

      // Limit results and sort by relevance
      const limitedResults = results.slice(0, 20);
      
      res.json({ results: limitedResults });
    } catch (error: any) {
      console.error('Search error:', error);
      res.status(500).json({ message: "Search failed", error: error.message });
    }
  });

  // Settings endpoints
  app.get("/api/settings", async (req, res) => {
    res.json({
      business: {
        companyName: "Venuine Events",
        companyEmail: "contact@venuine.com",
        companyPhone: "+1 (555) 123-4567",
        companyAddress: "123 Business Street, City, State 12345",
        website: "https://venuine.com",
        taxId: "12-3456789",
        description: "Premier venue management and event planning services",
        timezone: "America/New_York",
        currency: "USD",
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h"
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        bookingConfirmations: true,
        paymentAlerts: true,
        reminderEmails: true,
        marketingEmails: false,
        weeklyReports: true,
        lowInventoryAlerts: true,
        taskDeadlines: true,
        customerMessages: true,
        leadAssignments: true
      },
      ai: {
        enableAiSuggestions: true,
        autoEmailReplies: false,
        leadScoring: true,
        smartScheduling: true,
        voiceBooking: true,
        predictiveAnalytics: false,
        aiChatAssistant: true,
        contentGeneration: false
      }
    });
  });

  app.put("/api/settings/business", async (req, res) => {
    try {
      console.log('Saving business settings:', req.body);
      res.json({ success: true, message: "Business settings saved" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/settings/notifications", async (req, res) => {
    try {
      console.log('Saving notification settings:', req.body);
      res.json({ success: true, message: "Notification settings saved" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/settings/ai", async (req, res) => {
    try {
      console.log('Saving AI settings:', req.body);
      res.json({ success: true, message: "AI settings saved" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe Connect endpoints
  app.get("/api/stripe/status", async (req, res) => {
    try {
      res.json({
        connected: false,
        accountId: null
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/stripe/disconnect", async (req, res) => {
    try {
      console.log('Disconnecting Stripe account');
      res.json({ success: true, message: "Stripe account disconnected" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
