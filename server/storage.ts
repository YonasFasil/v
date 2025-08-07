import { 
  type User, type InsertUser,
  type Venue, type InsertVenue,
  type Space, type InsertSpace,
  type Customer, type InsertCustomer,
  type Booking, type InsertBooking,
  type Proposal, type InsertProposal,
  type Payment, type InsertPayment,
  type Task, type InsertTask,
  type AiInsight, type InsertAiInsight,
  type Package, type InsertPackage,
  type Service, type InsertService
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

  // Spaces
  getSpaces(): Promise<Space[]>;
  getSpace(id: string): Promise<Space | undefined>;
  getSpacesByVenue(venueId: string): Promise<Space[]>;
  createSpace(space: InsertSpace): Promise<Space>;
  updateSpace(id: string, space: Partial<InsertSpace>): Promise<Space | undefined>;

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
  getPackages(): Promise<Package[]>;
  updatePackage(id: string, packageData: any): Promise<Package | null>;
  deletePackage(id: string): Promise<boolean>;
  getServices(): Promise<Service[]>;
  updateService(id: string, serviceData: any): Promise<Service | null>;
  deleteService(id: string): Promise<boolean>;
  
  // Additional CRUD operations
  deleteCustomer(id: string): Promise<boolean>;
  updateVenue(id: string, venueData: Partial<Venue>): Promise<Venue | null>;
  deleteVenue(id: string): Promise<boolean>;
  deleteSpace(id: string): Promise<boolean>;
  deleteBooking(id: string): Promise<boolean>;
  getPackage(id: string): Promise<Package | undefined>;
  createPackage(pkg: InsertPackage): Promise<Package>;
  updatePackage(id: string, pkg: Partial<InsertPackage>): Promise<Package | undefined>;
  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private venues: Map<string, Venue>;
  private spaces: Map<string, Space>;
  private customers: Map<string, Customer>;
  private bookings: Map<string, Booking>;
  private proposals: Map<string, Proposal>;
  private payments: Map<string, Payment>;
  private tasks: Map<string, Task>;
  private aiInsights: Map<string, AiInsight>;
  private packages: Map<string, Package>;
  private services: Map<string, Service>;

  constructor() {
    this.users = new Map();
    this.venues = new Map();
    this.spaces = new Map();
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
    
    // Initialize spaces for the venues
    this.initializeSpaces();
  }

  private initializeSpaces() {
    // Get all venue IDs to create spaces for them
    const venueIds = Array.from(this.venues.keys());
    
    // Create spaces for Grand Ballroom (first venue)
    if (venueIds[0]) {
      const grandBallroomSpaces: InsertSpace[] = [
        {
          venueId: venueIds[0],
          name: "Main Ballroom",
          description: "Large elegant space for grand events",
          capacity: 200,
          pricePerHour: "500.00",
          amenities: ["Stage", "Dance Floor", "Crystal Chandeliers"],
          imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3",
          isActive: true
        },
        {
          venueId: venueIds[0],
          name: "VIP Lounge",
          description: "Exclusive private area within the ballroom",
          capacity: 50,
          pricePerHour: "200.00",
          amenities: ["Private Bar", "Lounge Seating", "City View"],
          imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3",
          isActive: true
        }
      ];
      grandBallroomSpaces.forEach(space => this.createSpace(space));
    }

    // Conference Center spaces
    if (venueIds[1]) {
      const conferenceSpaces: InsertSpace[] = [
        {
          venueId: venueIds[1],
          name: "Boardroom A",
          description: "Executive boardroom for meetings",
          capacity: 20,
          pricePerHour: "150.00",
          amenities: ["Conference Table", "Video Conferencing", "Whiteboard"],
          imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3",
          isActive: true
        },
        {
          venueId: venueIds[1],
          name: "Training Room",
          description: "Flexible training and presentation space",
          capacity: 30,
          pricePerHour: "100.00",
          amenities: ["Projector", "Flip Chart", "Sound System"],
          imageUrl: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-4.0.3",
          isActive: true
        }
      ];
      conferenceSpaces.forEach(space => this.createSpace(space));
    }

    // Private Dining spaces
    if (venueIds[2]) {
      const diningSpaces: InsertSpace[] = [
        {
          venueId: venueIds[2],
          name: "Garden Room",
          description: "Intimate dining with garden views",
          capacity: 25,
          pricePerHour: "150.00",
          amenities: ["Fireplace", "Garden View", "Wine Cellar Access"],
          imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3",
          isActive: true
        }
      ];
      diningSpaces.forEach(space => this.createSpace(space));
    }

    // Update package applicableSpaceIds to match spaces
    const spaceIds = Array.from(this.spaces.keys());
    this.packages.forEach(pkg => {
      pkg.applicableSpaceIds = spaceIds; // Make packages available for all spaces
    });

    // Add sample bookings to demonstrate the calendar functionality
    this.initializeSampleBookings();
  }

  private initializeSampleBookings() {
    const customers = Array.from(this.customers.values());
    const venues = Array.from(this.venues.values());
    const spaces = Array.from(this.spaces.values());

    // Create some sample customers if none exist
    if (customers.length === 0) {
      const sampleCustomers = [
        {
          name: "Sarah Johnson",
          email: "sarah.johnson@email.com",
          phone: "555-0123",
          company: "Johnson Events",
          status: "active" as const,
          leadScore: 85
        },
        {
          name: "Michael Chen", 
          email: "michael.chen@techcorp.com",
          phone: "555-0456",
          company: "TechCorp",
          status: "lead" as const,
          leadScore: 72
        },
        {
          name: "Emily Rodriguez",
          email: "emily@creativestudio.com", 
          phone: "555-0789",
          company: "Creative Studio",
          status: "active" as const,
          leadScore: 90
        }
      ];
      
      sampleCustomers.forEach(customer => this.createCustomer(customer));
    }

    // Create sample bookings
    const updatedCustomers = Array.from(this.customers.values());
    const today = new Date();
    
    if (venues.length > 0 && spaces.length > 0 && updatedCustomers.length > 0) {
      const sampleBookings = [
        {
          eventName: "Corporate Annual Gala",
          eventType: "corporate",
          eventDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // Next week
          startTime: "18:00",
          endTime: "23:00",
          guestCount: 150,
          status: "confirmed",
          customerId: updatedCustomers[0]?.id,
          venueId: venues[0]?.id,
          spaceId: spaces[0]?.id,
          totalAmount: "8500.00",
          depositAmount: "2550.00",
          depositPaid: true,
          notes: "Premium catering and entertainment package"
        },
        {
          eventName: "Wedding Reception",
          eventType: "wedding", 
          eventDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // Two weeks
          startTime: "17:00",
          endTime: "22:00",
          guestCount: 80,
          status: "pending",
          customerId: updatedCustomers[1]?.id,
          venueId: venues[0]?.id,
          spaceId: spaces[1]?.id,
          totalAmount: "6200.00",
          depositAmount: "1860.00",
          depositPaid: false,
          notes: "Garden ceremony with indoor reception"
        },
        {
          eventName: "Product Launch Event",
          eventType: "corporate",
          eventDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000), // Three weeks
          startTime: "19:00", 
          endTime: "21:30",
          guestCount: 45,
          status: "confirmed" as const,
          customerId: updatedCustomers[2]?.id,
          venueId: venues[1]?.id,
          spaceId: spaces[2]?.id,
          totalAmount: "3200.00",
          depositAmount: "960.00",
          depositPaid: true,
          notes: "Tech presentation with networking reception"
        },
        {
          eventName: "Birthday Celebration",
          eventType: "private",
          eventDate: new Date(today.getTime() + 28 * 24 * 60 * 60 * 1000), // Four weeks
          startTime: "15:00",
          endTime: "18:00", 
          guestCount: 25,
          status: "confirmed" as const,
          customerId: updatedCustomers[0]?.id,
          venueId: venues[2]?.id,
          spaceId: spaces[4]?.id,
          totalAmount: "1800.00",
          depositAmount: "540.00",
          depositPaid: true,
          notes: "Intimate family gathering with custom menu"
        }
      ];

      sampleBookings.forEach(booking => {
        if (booking.customerId && booking.venueId && booking.spaceId) {
          this.createBooking(booking);
        }
      });
    }
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
        pricingModel: "fixed" as const,
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
        pricingModel: "fixed" as const,
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

  // Spaces
  async getSpaces(): Promise<Space[]> {
    return Array.from(this.spaces.values());
  }

  async getSpace(id: string): Promise<Space | undefined> {
    return this.spaces.get(id);
  }

  async getSpacesByVenue(venueId: string): Promise<Space[]> {
    return Array.from(this.spaces.values()).filter(space => space.venueId === venueId);
  }

  async createSpace(insertSpace: InsertSpace): Promise<Space> {
    const id = randomUUID();
    const space: Space = { 
      ...insertSpace, 
      id,
      description: insertSpace.description || null,
      pricePerHour: insertSpace.pricePerHour || null,
      amenities: insertSpace.amenities || null,
      imageUrl: insertSpace.imageUrl || null,
      isActive: insertSpace.isActive ?? true,
      createdAt: new Date()
    };
    this.spaces.set(id, space);
    return space;
  }

  async updateSpace(id: string, updates: Partial<InsertSpace>): Promise<Space | undefined> {
    const space = this.spaces.get(id);
    if (!space) return undefined;
    
    const updated: Space = { ...space, ...updates };
    this.spaces.set(id, updated);
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

  // Packages & Services  
  async getPackages(): Promise<Package[]> {
    return Array.from(this.packages.values());
  }

  async getPackage(id: string): Promise<Package | undefined> {
    return this.packages.get(id);
  }

  async createPackage(insertPackage: InsertPackage): Promise<Package> {
    const id = randomUUID();
    const pkg: Package = { 
      ...insertPackage, 
      id, 
      createdAt: new Date(),
      description: insertPackage.description || null,
      applicableSpaceIds: insertPackage.applicableSpaceIds || null,
      includedServiceIds: insertPackage.includedServiceIds || null,
      isActive: insertPackage.isActive ?? true
    };
    this.packages.set(id, pkg);
    return pkg;
  }

  async updatePackage(id: string, updates: Partial<InsertPackage>): Promise<Package | undefined> {
    const pkg = this.packages.get(id);
    if (!pkg) return undefined;
    
    const updated: Package = { ...pkg, ...updates };
    this.packages.set(id, updated);
    return updated;
  }

  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getService(id: string): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = { 
      ...insertService, 
      id, 
      createdAt: new Date(),
      description: insertService.description || null,
      isActive: insertService.isActive ?? true
    };
    this.services.set(id, service);
    return service;
  }

  async updateService(id: string, updates: Partial<InsertService>): Promise<Service | undefined> {
    const service = this.services.get(id);
    if (!service) return undefined;
    
    const updated: Service = { ...service, ...updates };
    this.services.set(id, updated);
    return updated;
  }

  // Delete operations
  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  async deleteVenue(id: string): Promise<boolean> {
    return this.venues.delete(id);
  }

  async deleteSpace(id: string): Promise<boolean> {
    return this.spaces.delete(id);
  }

  async deleteBooking(id: string): Promise<boolean> {
    return this.bookings.delete(id);
  }

  async deletePackage(id: string): Promise<boolean> {
    return this.packages.delete(id);
  }

  async deleteService(id: string): Promise<boolean> {
    return this.services.delete(id);
  }

  async updatePackage(id: string, packageData: any): Promise<Package | null> {
    const pkg = this.packages.get(id);
    if (!pkg) return null;
    
    const updated = { ...pkg, ...packageData };
    this.packages.set(id, updated);
    return updated;
  }

  async updateService(id: string, serviceData: any): Promise<Service | null> {
    const service = this.services.get(id);
    if (!service) return null;
    
    const updated = { ...service, ...serviceData };
    this.services.set(id, updated);
    return updated;
  }

  async updateVenue(id: string, venueData: Partial<Venue>): Promise<Venue | null> {
    const venue = this.venues.get(id);
    if (!venue) return null;
    
    const updated = { ...venue, ...venueData };
    this.venues.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
