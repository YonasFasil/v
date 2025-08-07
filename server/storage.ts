import { 
  type User, type InsertUser,
  type Venue, type InsertVenue,
  type Customer, type InsertCustomer,
  type Booking, type InsertBooking,
  type Proposal, type InsertProposal,
  type Payment, type InsertPayment,
  type Task, type InsertTask,
  type AiInsight, type InsertAiInsight
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Venues
  getVenues(): Promise<Venue[]>;
  getVenue(id: string): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByCustomer(customerId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;

  // Proposals
  getProposals(): Promise<Proposal[]>;
  getProposal(id: string): Promise<Proposal | undefined>;
  getProposalsByCustomer(customerId: string): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined>;

  // Payments
  getPayments(): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByBooking(bookingId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined>;

  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  getTasksByUser(userId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined>;

  // AI Insights
  getAiInsights(): Promise<AiInsight[]>;
  getActiveAiInsights(): Promise<AiInsight[]>;
  createAiInsight(insight: InsertAiInsight): Promise<AiInsight>;

  // Packages & Services
  getPackages(): Promise<any[]>;
  createPackage(pkg: any): Promise<any>;
  getServices(): Promise<any[]>;
  createService(service: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private venues: Map<string, Venue>;
  private customers: Map<string, Customer>;
  private bookings: Map<string, Booking>;
  private proposals: Map<string, Proposal>;
  private payments: Map<string, Payment>;
  private tasks: Map<string, Task>;
  private aiInsights: Map<string, AiInsight>;
  private packages: Map<string, any>;
  private services: Map<string, any>;

  constructor() {
    this.users = new Map();
    this.venues = new Map();
    this.customers = new Map();
    this.bookings = new Map();
    this.proposals = new Map();
    this.payments = new Map();
    this.tasks = new Map();
    this.aiInsights = new Map();
    this.packages = new Map();
    this.services = new Map();

    this.initializeData();
  }

  private initializeData() {
    this.initializeSamplePackagesAndServices();
    // Initialize with some default venues
    const defaultVenues: InsertVenue[] = [
      {
        name: "Grand Ballroom",
        description: "Perfect for weddings and large corporate events",
        capacity: 200,
        pricePerHour: "500.00",
        amenities: ["Audio/Visual Equipment", "Dance Floor", "Catering Kitchen"],
        imageUrl: "https://images.unsplash.com/photo-1464207687429-7505649dae38?ixlib=rb-4.0.3",
        isActive: true
      },
      {
        name: "Conference Center",
        description: "Ideal for business meetings and presentations",
        capacity: 50,
        pricePerHour: "200.00",
        amenities: ["Projector", "Conference Table", "WiFi"],
        imageUrl: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?ixlib=rb-4.0.3",
        isActive: true
      },
      {
        name: "Private Dining",
        description: "Intimate setting for special celebrations",
        capacity: 25,
        pricePerHour: "150.00",
        amenities: ["Private Bar", "Fireplace", "Garden View"],
        imageUrl: "https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3",
        isActive: true
      }
    ];

    defaultVenues.forEach(venue => this.createVenue(venue));
  }

  private initializeSamplePackagesAndServices() {
    // Sample services (must be created before packages since packages reference them)
    const sampleServices = [
      {
        id: "svc-1",
        name: "Premium Bar Service",
        description: "Full bar service with premium spirits and cocktails", 
        category: "beverage",
        price: "25.00",
        pricingModel: "per_person",
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "svc-2",
        name: "Live DJ Entertainment",
        description: "Professional DJ with sound system and lighting",
        category: "entertainment", 
        price: "800.00",
        pricingModel: "fixed",
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "svc-3",
        name: "Floral Centerpieces",
        description: "Custom floral arrangements for tables",
        category: "decor",
        price: "75.00", 
        pricingModel: "fixed",
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "svc-4",
        name: "Professional Photography", 
        description: "Event photography for 4 hours",
        category: "photography",
        price: "1200.00",
        pricingModel: "fixed",
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "svc-5",
        name: "Valet Parking Service",
        description: "Professional valet parking for guests",
        category: "service",
        price: "15.00",
        pricingModel: "per_person", 
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "svc-6",
        name: "Basic Catering Package",
        description: "Standard catering with appetizers and entrees",
        category: "catering",
        price: "45.00",
        pricingModel: "per_person",
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "svc-7",
        name: "Sound System",
        description: "Basic sound system with microphone",
        category: "audio",
        price: "300.00",
        pricingModel: "fixed",
        isActive: true,
        createdAt: new Date()
      }
    ];

    // Sample packages (created after services)
    const samplePackages = [
      {
        id: "pkg-1",
        name: "Silver Package",
        description: "Perfect for intimate gatherings and small events",
        category: "wedding",
        price: "2500.00",
        pricingModel: "fixed",
        applicableSpaceIds: [], // Will apply to all spaces for now
        includedServiceIds: ["svc-6", "svc-7"], // Basic catering + sound system
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "pkg-2", 
        name: "Gold Package",
        description: "Premium experience with enhanced amenities",
        category: "corporate",
        price: "4500.00",
        pricingModel: "fixed",
        applicableSpaceIds: [],
        includedServiceIds: ["svc-6", "svc-7", "svc-4"], // Catering + sound + photography
        isActive: true,
        createdAt: new Date()
      },
      {
        id: "pkg-3",
        name: "Platinum Package", 
        description: "Luxury all-inclusive experience",
        category: "wedding",
        price: "7500.00",
        pricingModel: "fixed",
        applicableSpaceIds: [],
        includedServiceIds: ["svc-6", "svc-7", "svc-4", "svc-3"], // Everything except bar and valet
        isActive: true,
        createdAt: new Date()
      }
    ];

    sampleServices.forEach(svc => this.services.set(svc.id, svc));
    samplePackages.forEach(pkg => this.packages.set(pkg.id, pkg));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "manager"
    };
    this.users.set(id, user);
    return user;
  }

  // Venues
  async getVenues(): Promise<Venue[]> {
    return Array.from(this.venues.values());
  }

  async getVenue(id: string): Promise<Venue | undefined> {
    return this.venues.get(id);
  }

  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
    const id = randomUUID();
    const venue: Venue = { 
      ...insertVenue, 
      id,
      description: insertVenue.description || null,
      pricePerHour: insertVenue.pricePerHour || null,
      amenities: insertVenue.amenities || null,
      imageUrl: insertVenue.imageUrl || null,
      isActive: insertVenue.isActive ?? true
    };
    this.venues.set(id, venue);
    return venue;
  }

  async updateVenue(id: string, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    const existing = this.venues.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...venue };
    this.venues.set(id, updated);
    return updated;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = { 
      ...insertCustomer, 
      id, 
      createdAt: new Date(),
      notes: insertCustomer.notes || null,
      status: insertCustomer.status || "lead",
      phone: insertCustomer.phone || null,
      company: insertCustomer.company || null,
      leadScore: insertCustomer.leadScore || 0
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...customer };
    this.customers.set(id, updated);
    return updated;
  }

  // Bookings
  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByCustomer(customerId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.customerId === customerId);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date(),
      customerId: insertBooking.customerId || null,
      venueId: insertBooking.venueId || null,
      totalAmount: insertBooking.totalAmount || null,
      depositAmount: insertBooking.depositAmount || null,
      depositPaid: insertBooking.depositPaid ?? false,
      notes: insertBooking.notes || null
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined> {
    const existing = this.bookings.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...booking };
    this.bookings.set(id, updated);
    return updated;
  }

  // Proposals
  async getProposals(): Promise<Proposal[]> {
    return Array.from(this.proposals.values());
  }

  async getProposal(id: string): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async getProposalsByCustomer(customerId: string): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(proposal => proposal.customerId === customerId);
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const id = randomUUID();
    const proposal: Proposal = { 
      ...insertProposal, 
      id, 
      createdAt: new Date(),
      sentAt: null,
      viewedAt: null,
      customerId: insertProposal.customerId || null,
      bookingId: insertProposal.bookingId || null,
      status: insertProposal.status || "draft",
      totalAmount: insertProposal.totalAmount || null,
      validUntil: insertProposal.validUntil || null
    };
    this.proposals.set(id, proposal);
    return proposal;
  }

  async updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const existing = this.proposals.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...proposal };
    this.proposals.set(id, updated);
    return updated;
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.bookingId === bookingId);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = { 
      ...insertPayment, 
      id, 
      createdAt: new Date(),
      processedAt: null,
      status: insertPayment.status || "pending",
      bookingId: insertPayment.bookingId || null,
      transactionId: insertPayment.transactionId || null
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined> {
    const existing = this.payments.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...payment };
    this.payments.set(id, updated);
    return updated;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assignedTo === userId);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: new Date(),
      status: insertTask.status || "pending",
      priority: insertTask.priority || "medium",
      description: insertTask.description || null,
      assignedTo: insertTask.assignedTo || null,
      bookingId: insertTask.bookingId || null,
      dueDate: insertTask.dueDate || null
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existing = this.tasks.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...task };
    this.tasks.set(id, updated);
    return updated;
  }

  // AI Insights
  async getAiInsights(): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values());
  }

  async getActiveAiInsights(): Promise<AiInsight[]> {
    return Array.from(this.aiInsights.values()).filter(insight => insight.isActive);
  }

  async createAiInsight(insertAiInsight: InsertAiInsight): Promise<AiInsight> {
    const id = randomUUID();
    const insight: AiInsight = { 
      ...insertAiInsight, 
      id, 
      createdAt: new Date(),
      priority: insertAiInsight.priority || "medium",
      isActive: insertAiInsight.isActive ?? true,
      data: insertAiInsight.data || null
    };
    this.aiInsights.set(id, insight);
    return insight;
  }

  // Packages
  async getPackages(): Promise<any[]> {
    return Array.from(this.packages.values());
  }

  async createPackage(pkg: any): Promise<any> {
    const id = randomUUID();
    const newPackage = {
      id,
      ...pkg,
      createdAt: new Date()
    };
    this.packages.set(id, newPackage);
    return newPackage;
  }

  // Services
  async getServices(): Promise<any[]> {
    return Array.from(this.services.values());
  }

  async createService(service: any): Promise<any> {
    const id = randomUUID();
    const newService = {
      id,
      ...service,
      createdAt: new Date()
    };
    this.services.set(id, newService);
    return newService;
  }
}

export const storage = new MemStorage();
