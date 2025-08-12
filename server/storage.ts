import { 
  type User, type InsertUser, type UpsertUser,
  type Venue, type InsertVenue,
  type Space, type InsertSpace,
  type SetupStyle, type InsertSetupStyle,
  type Customer, type InsertCustomer,
  type Contract, type InsertContract,
  type Booking, type InsertBooking,
  type Proposal, type InsertProposal,
  type Payment, type InsertPayment,
  type Task, type InsertTask,
  type AiInsight, type InsertAiInsight,
  type Package, type InsertPackage,
  type Service, type InsertService,
  type TaxSetting, type InsertTaxSetting,
  type Communication, type InsertCommunication,
  type CampaignSource, type InsertCampaignSource,
  type Tag, type InsertTag,
  type Lead, type InsertLead,
  type LeadActivity, type InsertLeadActivity,
  type LeadTask, type InsertLeadTask,
  type Tour, type InsertTour,
  type AuditLog, type InsertAuditLog,

} from "@shared/schema";

// Additional types for new features

interface Setting {
  id: string;
  key: string;
  value: any;
  updatedAt: Date;
}

interface InsertSetting {
  key: string;
  value: any;
}
import { randomUUID } from "crypto";

export interface IStorage {
  // Users (including Replit Auth methods)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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

  // Setup Styles
  getSetupStyles(): Promise<SetupStyle[]>;
  getSetupStyle(id: string): Promise<SetupStyle | undefined>;
  createSetupStyle(setupStyle: InsertSetupStyle): Promise<SetupStyle>;
  updateSetupStyle(id: string, setupStyle: Partial<InsertSetupStyle>): Promise<SetupStyle | undefined>;
  deleteSetupStyle(id: string): Promise<boolean>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;

  // Contracts
  getContracts(): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  getContractsByCustomer(customerId: string): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined>;
  deleteContract(id: string): Promise<boolean>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  getBookingsByCustomer(customerId: string): Promise<Booking[]>;
  getBookingsByContract(contractId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<InsertBooking>): Promise<Booking | undefined>;
  createMultipleBookings(bookings: InsertBooking[], contractId: string): Promise<Booking[]>;

  // Proposals
  getProposals(): Promise<Proposal[]>;
  getProposal(id: string): Promise<Proposal | undefined>;
  getProposalsByCustomer(customerId: string): Promise<Proposal[]>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined>;
  deleteProposal(id: string): Promise<boolean>;

  // Communications
  getCommunications(bookingId?: string): Promise<Communication[]>;
  getCommunication(id: string): Promise<Communication | undefined>;
  getCommunicationsByProposal(proposalId: string): Promise<Communication[]>;
  getCommunicationsByCustomer(customerId: string): Promise<Communication[]>;
  getCommunicationByMessageId(messageId: string): Promise<Communication | undefined>;
  createCommunication(communication: InsertCommunication): Promise<Communication>;
  updateCommunication(id: string, communication: Partial<InsertCommunication>): Promise<Communication | undefined>;

  // Settings
  getSettings(): Promise<Setting[]>;
  getSetting(key: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(key: string, value: any): Promise<Setting | undefined>;

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
  getPackage(id: string): Promise<Package | undefined>;
  createPackage(pkg: InsertPackage): Promise<Package>;
  updatePackage(id: string, pkg: Partial<InsertPackage>): Promise<Package | undefined>;
  deletePackage(id: string): Promise<boolean>;

  getServices(): Promise<Service[]>;
  getService(id: string): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: string, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: string): Promise<boolean>;
  
  // Tax Settings
  getTaxSettings(): Promise<TaxSetting[]>;
  getTaxSetting(id: string): Promise<TaxSetting | undefined>;
  createTaxSetting(taxSetting: InsertTaxSetting): Promise<TaxSetting>;
  updateTaxSetting(id: string, taxSetting: Partial<InsertTaxSetting>): Promise<TaxSetting | undefined>;
  deleteTaxSetting(id: string): Promise<boolean>;

  // Lead Management
  // Campaign Sources
  getCampaignSources(): Promise<CampaignSource[]>;
  createCampaignSource(source: InsertCampaignSource): Promise<CampaignSource>;
  updateCampaignSource(id: string, source: Partial<InsertCampaignSource>): Promise<CampaignSource | undefined>;
  
  // Tags
  getTags(): Promise<Tag[]>;
  createTag(tag: InsertTag): Promise<Tag>;
  updateTag(id: string, tag: Partial<InsertTag>): Promise<Tag | undefined>;
  deleteTag(id: string): Promise<boolean>;
  
  // Leads
  getLeads(filters?: { status?: string; source?: string; q?: string }): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: string): Promise<boolean>;
  
  // Lead Activities
  getLeadActivities(leadId: string): Promise<LeadActivity[]>;
  createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity>;
  
  // Lead Tasks
  getLeadTasks(filters?: { assignee?: string; due?: string }): Promise<LeadTask[]>;
  createLeadTask(task: InsertLeadTask): Promise<LeadTask>;
  updateLeadTask(id: string, task: Partial<InsertLeadTask>): Promise<LeadTask | undefined>;
  
  // Tours
  getTours(): Promise<Tour[]>;
  getTour(id: string): Promise<Tour | undefined>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour | undefined>;
  
  // Lead Tags (many-to-many)
  getLeadTags(leadId: string): Promise<Tag[]>;
  addLeadTag(leadId: string, tagId: string): Promise<void>;
  removeLeadTag(leadId: string, tagId: string): Promise<void>;
  
  // Audit Logging
  getAuditLogs(filters?: { 
    userId?: string; 
    action?: string; 
    resourceType?: string; 
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]>;
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogStats(): Promise<{
    totalLogs: number;
    recentActions: number;
    errorCount: number;
    topUsers: Array<{ userId: string; count: number; userName?: string }>;
    topActions: Array<{ action: string; count: number }>;
  }>;

  
  // Additional CRUD operations  
  deleteCustomer(id: string): Promise<boolean>;
  updateVenue(id: string, venueData: Partial<Venue>): Promise<Venue | null>;
  deleteVenue(id: string): Promise<boolean>;
  deleteSpace(id: string): Promise<boolean>;
  deleteBooking(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private venues: Map<string, Venue>;
  private spaces: Map<string, Space>;
  private setupStyles: Map<string, SetupStyle>;
  private customers: Map<string, Customer>;
  private contracts: Map<string, Contract>;
  private bookings: Map<string, Booking>;
  private proposals: Map<string, Proposal>;
  private payments: Map<string, Payment>;
  private tasks: Map<string, Task>;
  private aiInsights: Map<string, AiInsight>;
  private packages: Map<string, Package>;
  private services: Map<string, Service>;
  private taxSettings: Map<string, TaxSetting>;
  private communications: Map<string, Communication>;
  private settings: Map<string, Setting>;
  private auditLogs: Map<string, AuditLog>;
  
  // Lead Management Maps
  private campaignSources: Map<string, CampaignSource>;
  private tags: Map<string, Tag>;
  private leads: Map<string, Lead>;
  private leadActivities: Map<string, LeadActivity>;
  private leadTasks: Map<string, LeadTask>;
  private tours: Map<string, Tour>;
  private leadTags: Set<string>; // Store leadId:tagId combinations


  constructor() {
    this.users = new Map();
    this.venues = new Map();
    this.spaces = new Map();
    this.setupStyles = new Map();
    this.customers = new Map();
    this.contracts = new Map();
    this.bookings = new Map();
    this.proposals = new Map();
    this.payments = new Map();
    this.tasks = new Map();
    this.aiInsights = new Map();
    this.packages = new Map();
    this.services = new Map();
    this.taxSettings = new Map();
    this.communications = new Map();
    this.settings = new Map();
    this.auditLogs = new Map();
    
    // Lead Management initialization
    this.campaignSources = new Map();
    this.tags = new Map();
    this.leads = new Map();
    this.leadActivities = new Map();
    this.leadTasks = new Map();
    this.tours = new Map();
    this.leadTags = new Set();


    this.initializeData();
    this.initializeLeadManagementData();
  }

  private initializeData() {
    this.initializeSamplePackagesAndServices();
    this.initializeSampleSetupStyles();
    this.initializeLeadManagementData();
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
          status: "confirmed_fully_paid", // Updated to new 7-status system
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
          status: "proposal_shared", // Updated to new 7-status system
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
          status: "confirmed_deposit_paid", // Updated to new 7-status system
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
          status: "tentative", // Updated to new 7-status system
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

      // Create sample proposal for Wedding Reception booking (to test proposal tracking)
      const weddingBooking = sampleBookings.find(b => b.eventName === "Wedding Reception");
      if (weddingBooking && weddingBooking.customerId) {
        const sampleProposal = {
          customerId: weddingBooking.customerId,
          eventName: weddingBooking.eventName,
          eventDate: weddingBooking.eventDate,
          startTime: weddingBooking.startTime,
          endTime: weddingBooking.endTime,
          guestCount: weddingBooking.guestCount,
          venueId: weddingBooking.venueId,
          spaceId: weddingBooking.spaceId,
          totalAmount: weddingBooking.totalAmount,
          depositAmount: weddingBooking.depositAmount,
          status: "sent" as const,
          sentAt: new Date(),
          emailOpened: false,
          emailOpenedAt: null,
          openCount: 0,
          notes: "Wedding reception proposal with premium package options"
        };
        this.createProposal(sampleProposal);
      }
    }
  }

  private initializeSamplePackagesAndServices() {
    // Sample services for testing
    const sampleServices = [
      {
        id: randomUUID(),
        name: "Premium Catering",
        description: "Full-service catering with appetizers, main course, and dessert",
        price: "45.00",
        category: "catering",
        pricingModel: "per_person" as const,
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Audio/Visual Setup", 
        description: "Professional sound system, microphones, and projection equipment",
        price: "500.00",
        category: "equipment",
        pricingModel: "fixed" as const,
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Floral Arrangements",
        description: "Custom centerpieces and decorative florals",
        price: "150.00", 
        category: "decoration",
        pricingModel: "fixed" as const,
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Photography Services",
        description: "Professional event photography with edited photos",
        price: "800.00",
        category: "entertainment",
        pricingModel: "fixed" as const,
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Live DJ Entertainment",
        description: "Professional DJ with music and lighting",
        price: "600.00",
        category: "entertainment", 
        pricingModel: "fixed" as const,
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Bar Service",
        description: "Full bar service with bartender and premium drinks",
        price: "25.00",
        category: "catering",
        pricingModel: "per_person" as const,
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      }
    ];

    // Sample packages for testing
    const serviceIds = sampleServices.map(s => s.id);
    const samplePackages = [
      {
        id: randomUUID(),
        name: "Corporate Essential",
        description: "Perfect for business meetings and corporate events",
        category: "corporate",
        price: "2500.00",
        pricingModel: "fixed" as const,
        includedServiceIds: [serviceIds[1]], // Audio/Visual Setup
        applicableSpaceIds: [],
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(), 
        name: "Wedding Premium",
        description: "Complete wedding package with catering, entertainment, and decor",
        category: "wedding",
        price: "85.00",
        pricingModel: "per_person" as const,
        includedServiceIds: [serviceIds[0], serviceIds[2], serviceIds[3], serviceIds[4]], // Catering, Florals, Photography, DJ
        applicableSpaceIds: [],
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Cocktail Party",
        description: "Elegant cocktail reception with bar and light catering",
        category: "social",
        price: "55.00",
        pricingModel: "per_person" as const, 
        includedServiceIds: [serviceIds[5], serviceIds[2]], // Bar Service, Florals
        applicableSpaceIds: [],
        enabledTaxIds: [],
        enabledFeeIds: [],
        isActive: true,
        createdAt: new Date()
      }
    ];

    sampleServices.forEach(svc => this.services.set(svc.id, svc));
    samplePackages.forEach(pkg => this.packages.set(pkg.id, pkg));
  }

  private initializeSampleSetupStyles() {
    const sampleSetupStyles = [
      {
        id: randomUUID(),
        name: "Round Tables",
        description: "Traditional round tables for dining and socializing",
        iconName: "Circle",
        category: "dining",
        minCapacity: 50,
        maxCapacity: 200,
        floorPlan: {
          objects: [
            { id: "rt1", type: "table", x: 200, y: 150, width: 60, height: 60, rotation: 0, color: "#8B4513", seats: 8, label: "Table 1" },
            { id: "rt2", type: "table", x: 350, y: 150, width: 60, height: 60, rotation: 0, color: "#8B4513", seats: 8, label: "Table 2" },
            { id: "rt3", type: "table", x: 500, y: 150, width: 60, height: 60, rotation: 0, color: "#8B4513", seats: 8, label: "Table 3" },
            { id: "rt4", type: "table", x: 275, y: 300, width: 60, height: 60, rotation: 0, color: "#8B4513", seats: 8, label: "Table 4" },
            { id: "rt5", type: "table", x: 425, y: 300, width: 60, height: 60, rotation: 0, color: "#8B4513", seats: 8, label: "Table 5" },
            { id: "stage", type: "stage", x: 300, y: 50, width: 200, height: 80, rotation: 0, color: "#4169E1", label: "Main Stage" },
            { id: "bar", type: "bar", x: 100, y: 500, width: 120, height: 40, rotation: 0, color: "#800000", label: "Bar" }
          ],
          canvasSize: { width: 800, height: 600 },
          totalSeats: 40
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Theater Style",
        description: "Rows of chairs facing the presentation area",
        iconName: "Presentation",
        category: "presentation",
        minCapacity: 100,
        maxCapacity: 500,
        floorPlan: {
          objects: [
            { id: "stage", type: "stage", x: 300, y: 50, width: 200, height: 80, rotation: 0, color: "#4169E1", label: "Presentation Stage" },
            // Front row
            { id: "c1", type: "chair", x: 200, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c2", type: "chair", x: 230, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c3", type: "chair", x: 260, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c4", type: "chair", x: 290, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c5", type: "chair", x: 320, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c6", type: "chair", x: 350, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c7", type: "chair", x: 380, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c8", type: "chair", x: 410, y: 200, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            // Second row
            { id: "c9", type: "chair", x: 200, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c10", type: "chair", x: 230, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c11", type: "chair", x: 260, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c12", type: "chair", x: 290, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c13", type: "chair", x: 320, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c14", type: "chair", x: 350, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c15", type: "chair", x: 380, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 },
            { id: "c16", type: "chair", x: 410, y: 230, width: 20, height: 20, rotation: 0, color: "#654321", seats: 1 }
          ],
          canvasSize: { width: 800, height: 600 },
          totalSeats: 16
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "U-Shape Conference",
        description: "U-shaped table arrangement for meetings",
        iconName: "Users",
        category: "meeting",
        minCapacity: 15,
        maxCapacity: 50,
        floorPlan: {
          objects: [
            // U-shape tables
            { id: "ut1", type: "table", x: 200, y: 200, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 6, label: "Left Table" },
            { id: "ut2", type: "table", x: 300, y: 320, width: 200, height: 40, rotation: 0, color: "#8B4513", seats: 8, label: "Center Table" },
            { id: "ut3", type: "table", x: 520, y: 200, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 6, label: "Right Table" },
            // Presentation area
            { id: "screen", type: "stage", x: 350, y: 100, width: 100, height: 60, rotation: 0, color: "#4169E1", label: "Screen" }
          ],
          canvasSize: { width: 800, height: 600 },
          totalSeats: 20
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Cocktail Reception",
        description: "Standing reception with high-top tables",
        iconName: "Coffee",
        category: "social",
        minCapacity: 30,
        maxCapacity: 150,
        floorPlan: {
          objects: [
            { id: "ht1", type: "table", x: 200, y: 180, width: 40, height: 40, rotation: 0, color: "#8B4513", seats: 4, label: "High Table 1" },
            { id: "ht2", type: "table", x: 400, y: 180, width: 40, height: 40, rotation: 0, color: "#8B4513", seats: 4, label: "High Table 2" },
            { id: "ht3", type: "table", x: 600, y: 180, width: 40, height: 40, rotation: 0, color: "#8B4513", seats: 4, label: "High Table 3" },
            { id: "ht4", type: "table", x: 300, y: 320, width: 40, height: 40, rotation: 0, color: "#8B4513", seats: 4, label: "High Table 4" },
            { id: "ht5", type: "table", x: 500, y: 320, width: 40, height: 40, rotation: 0, color: "#8B4513", seats: 4, label: "High Table 5" },
            { id: "bar1", type: "bar", x: 150, y: 450, width: 150, height: 40, rotation: 0, color: "#800000", label: "Main Bar" },
            { id: "bar2", type: "bar", x: 500, y: 450, width: 150, height: 40, rotation: 0, color: "#800000", label: "Service Bar" }
          ],
          canvasSize: { width: 800, height: 600 },
          totalSeats: 20
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Classroom Setup",
        description: "Tables and chairs in classroom formation",
        iconName: "Grid3X3",
        category: "meeting",
        minCapacity: 20,
        maxCapacity: 100,
        floorPlan: {
          objects: [
            // Presentation area
            { id: "stage", type: "stage", x: 350, y: 50, width: 100, height: 60, rotation: 0, color: "#4169E1", label: "Presentation Area" },
            // Row 1
            { id: "t1", type: "table", x: 200, y: 180, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 1" },
            { id: "t2", type: "table", x: 320, y: 180, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 2" },
            { id: "t3", type: "table", x: 440, y: 180, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 3" },
            // Row 2
            { id: "t4", type: "table", x: 200, y: 260, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 4" },
            { id: "t5", type: "table", x: 320, y: 260, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 5" },
            { id: "t6", type: "table", x: 440, y: 260, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 6" },
            // Row 3
            { id: "t7", type: "table", x: 200, y: 340, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 7" },
            { id: "t8", type: "table", x: 320, y: 340, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 8" },
            { id: "t9", type: "table", x: 440, y: 340, width: 80, height: 40, rotation: 0, color: "#8B4513", seats: 3, label: "Table 9" }
          ],
          canvasSize: { width: 800, height: 600 },
          totalSeats: 27
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        name: "Banquet Style",
        description: "Long rectangular tables for formal dining",
        iconName: "Utensils",
        category: "dining",
        minCapacity: 40,
        maxCapacity: 300,
        floorPlan: {
          objects: [
            // Long banquet tables
            { id: "bt1", type: "table", x: 150, y: 150, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 12, label: "Banquet Table 1" },
            { id: "bt2", type: "table", x: 150, y: 230, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 12, label: "Banquet Table 2" },
            { id: "bt3", type: "table", x: 150, y: 310, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 12, label: "Banquet Table 3" },
            { id: "bt4", type: "table", x: 450, y: 150, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 12, label: "Banquet Table 4" },
            { id: "bt5", type: "table", x: 450, y: 230, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 12, label: "Banquet Table 5" },
            { id: "bt6", type: "table", x: 450, y: 310, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 12, label: "Banquet Table 6" },
            // Head table
            { id: "head", type: "table", x: 300, y: 80, width: 200, height: 50, rotation: 0, color: "#8B4513", seats: 10, label: "Head Table" }
          ],
          canvasSize: { width: 800, height: 600 },
          totalSeats: 82
        },
        isActive: true,
        createdAt: new Date()
      }
    ];

    sampleSetupStyles.forEach(style => this.setupStyles.set(style.id, style));
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
      role: insertUser.role || "viewer",
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Legacy fields for backwards compatibility
      username: insertUser.username || null,
      password: insertUser.password || null,
      name: insertUser.name || null,
      stripeAccountId: insertUser.stripeAccountId || null,
      stripeAccountStatus: insertUser.stripeAccountStatus || null,
      stripeOnboardingCompleted: insertUser.stripeOnboardingCompleted || false,
      stripeChargesEnabled: insertUser.stripeChargesEnabled || false,
      stripePayoutsEnabled: insertUser.stripePayoutsEnabled || false,
      stripeConnectedAt: insertUser.stripeConnectedAt || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updateData, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  // Upsert user (for Replit Auth)
  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = this.users.get(userData.id);
    if (existing) {
      // Update existing user
      const updated = {
        ...existing,
        ...userData,
        updatedAt: new Date(),
      };
      this.users.set(userData.id, updated);
      return updated;
    } else {
      // Create new user with admin role if this is the first user and email matches admin
      const isFirstUser = this.users.size === 0;
      const isAdminEmail = userData.email === "yonasfasil.sl@gmail.com";
      
      const user: User = {
        ...userData,
        role: isAdminEmail ? 'admin' : userData.role || 'viewer',
        isActive: userData.isActive ?? true,
        createdAt: userData.createdAt || new Date(),
        updatedAt: new Date(),
        // Legacy fields
        username: userData.username || null,
        password: userData.password || null,
        name: userData.name || null,
        stripeAccountId: userData.stripeAccountId || null,
        stripeAccountStatus: userData.stripeAccountStatus || null,
        stripeOnboardingCompleted: userData.stripeOnboardingCompleted || false,
        stripeChargesEnabled: userData.stripeChargesEnabled || false,
        stripePayoutsEnabled: userData.stripePayoutsEnabled || false,
        stripeConnectedAt: userData.stripeConnectedAt || null,
      };
      this.users.set(userData.id, user);
      return user;
    }
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

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(customer => customer.email === email);
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

  // Contracts
  async getContracts(): Promise<Contract[]> {
    return Array.from(this.contracts.values());
  }

  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async getContractsByCustomer(customerId: string): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(contract => contract.customerId === customerId);
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = randomUUID();
    const contract: Contract = { 
      ...insertContract, 
      id, 
      createdAt: new Date(),
      updatedAt: new Date(),
      status: insertContract.status || "draft",
      totalAmount: insertContract.totalAmount || null
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract | undefined> {
    const existing = this.contracts.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...contract, updatedAt: new Date() };
    this.contracts.set(id, updated);
    return updated;
  }

  async deleteContract(id: string): Promise<boolean> {
    return this.contracts.delete(id);
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

  async getBookingsByContract(contractId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.contractId === contractId);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date(),
      contractId: insertBooking.contractId || null,
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

  async createMultipleBookings(bookings: InsertBooking[], contractId: string): Promise<Booking[]> {
    const createdBookings: Booking[] = [];
    for (const insertBooking of bookings) {
      const booking = await this.createBooking({ ...insertBooking, contractId });
      createdBookings.push(booking);
    }
    return createdBookings;
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

  // Tax Settings methods
  async getTaxSettings(): Promise<TaxSetting[]> {
    return Array.from(this.taxSettings.values());
  }

  async getTaxSetting(id: string): Promise<TaxSetting | undefined> {
    return this.taxSettings.get(id);
  }

  async createTaxSetting(taxSetting: InsertTaxSetting): Promise<TaxSetting> {
    const newTaxSetting: TaxSetting = {
      id: randomUUID(),
      ...taxSetting,
      createdAt: new Date(),
    };
    this.taxSettings.set(newTaxSetting.id, newTaxSetting);
    return newTaxSetting;
  }

  async updateTaxSetting(id: string, taxSetting: Partial<InsertTaxSetting>): Promise<TaxSetting | undefined> {
    const existing = this.taxSettings.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...taxSetting };
    this.taxSettings.set(id, updated);
    return updated;
  }

  async deleteTaxSetting(id: string): Promise<boolean> {
    return this.taxSettings.delete(id);
  }

  // Proposal methods
  async getProposals(): Promise<Proposal[]> {
    return Array.from(this.proposals.values());
  }

  async getProposal(id: string): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }

  async getProposalsByCustomer(customerId: string): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(p => p.customerId === customerId);
  }

  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const newProposal: Proposal = {
      id: randomUUID(),
      ...proposal,
      createdAt: new Date(),
    };
    this.proposals.set(newProposal.id, newProposal);
    return newProposal;
  }

  async updateProposal(id: string, proposal: Partial<InsertProposal>): Promise<Proposal | undefined> {
    const existing = this.proposals.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...proposal };
    this.proposals.set(id, updated);
    return updated;
  }

  async deleteProposal(id: string): Promise<boolean> {
    return this.proposals.delete(id);
  }

  // Communication methods
  async getCommunications(bookingId?: string): Promise<Communication[]> {
    const allComms = Array.from(this.communications.values());
    if (bookingId) {
      return allComms.filter(comm => (comm as any).bookingId === bookingId);
    }
    return allComms;
  }

  async getCommunication(id: string): Promise<Communication | undefined> {
    return this.communications.get(id);
  }

  async getCommunicationsByProposal(proposalId: string): Promise<Communication[]> {
    return Array.from(this.communications.values()).filter(c => (c as any).proposalId === proposalId);
  }

  async getCommunicationsByCustomer(customerId: string): Promise<Communication[]> {
    return Array.from(this.communications.values()).filter(c => c.customerId === customerId);
  }

  async getCommunicationByMessageId(messageId: string): Promise<Communication | undefined> {
    return Array.from(this.communications.values()).find(c => (c as any).emailMessageId === messageId);
  }

  async createCommunication(communication: InsertCommunication): Promise<Communication> {
    const newCommunication: Communication = {
      id: randomUUID(),
      bookingId: communication.bookingId || null,
      customerId: communication.customerId || null,
      proposalId: (communication as any).proposalId || null,
      type: communication.type,
      direction: communication.direction,
      subject: communication.subject || null,
      message: communication.message,
      sender: (communication as any).sender || null,
      recipient: (communication as any).recipient || null,
      emailMessageId: (communication as any).emailMessageId || null,
      sentAt: (communication as any).sentAt || new Date(),
      readAt: communication.readAt || null,
      status: communication.status || "sent"
    };
    this.communications.set(newCommunication.id, newCommunication);
    return newCommunication;
  }

  async updateCommunication(id: string, communication: Partial<InsertCommunication>): Promise<Communication | undefined> {
    const existing = this.communications.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...communication };
    this.communications.set(id, updated);
    return updated;
  }

  // Settings methods
  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    return Array.from(this.settings.values()).find(s => s.key === key);
  }

  async createSetting(setting: InsertSetting): Promise<Setting> {
    const newSetting: Setting = {
      id: randomUUID(),
      ...setting,
      updatedAt: new Date(),
    };
    this.settings.set(newSetting.id, newSetting);
    return newSetting;
  }

  async updateSetting(key: string, value: any): Promise<Setting | undefined> {
    const existing = Array.from(this.settings.values()).find(s => s.key === key);
    if (existing) {
      const updated = { ...existing, value, updatedAt: new Date() };
      this.settings.set(existing.id, updated);
      return updated;
    } else {
      // Create new setting if it doesn't exist
      return this.createSetting({ key, value });
    }
  }

  // Setup Styles methods
  async getSetupStyles(): Promise<SetupStyle[]> {
    return Array.from(this.setupStyles.values());
  }

  async getSetupStyle(id: string): Promise<SetupStyle | undefined> {
    return this.setupStyles.get(id);
  }

  async createSetupStyle(setupStyle: InsertSetupStyle): Promise<SetupStyle> {
    const newSetupStyle: SetupStyle = {
      id: randomUUID(),
      ...setupStyle,
      createdAt: new Date(),
      isActive: setupStyle.isActive ?? true,
      description: setupStyle.description || null,
      iconName: setupStyle.iconName || null,
      minCapacity: setupStyle.minCapacity || null,
      maxCapacity: setupStyle.maxCapacity || null
    };
    this.setupStyles.set(newSetupStyle.id, newSetupStyle);
    return newSetupStyle;
  }

  async updateSetupStyle(id: string, setupStyle: Partial<InsertSetupStyle>): Promise<SetupStyle | undefined> {
    const existing = this.setupStyles.get(id);
    if (!existing) return undefined;
    
    // Deep clone the existing setup style to avoid reference sharing
    const updated = { 
      ...existing, 
      ...setupStyle,
      // If floorPlan is being updated, ensure it's a deep clone
      floorPlan: setupStyle.floorPlan ? JSON.parse(JSON.stringify(setupStyle.floorPlan)) : existing.floorPlan
    };
    this.setupStyles.set(id, updated);
    return updated;
  }

  async deleteSetupStyle(id: string): Promise<boolean> {
    return this.setupStyles.delete(id);
  }

  // Initialize lead management sample data
  private initializeLeadManagementData() {
    // Sample campaign sources
    const websiteSource: CampaignSource = {
      id: randomUUID(),
      name: "Website Organic",
      slug: "website-organic",
      isActive: true,
      createdAt: new Date()
    };
    const googleAdsSource: CampaignSource = {
      id: randomUUID(),
      name: "Google Ads",
      slug: "google-ads",
      isActive: true,
      createdAt: new Date()
    };
    const socialMediaSource: CampaignSource = {
      id: randomUUID(),
      name: "Social Media",
      slug: "social-media",
      isActive: true,
      createdAt: new Date()
    };

    this.campaignSources.set(websiteSource.id, websiteSource);
    this.campaignSources.set(googleAdsSource.id, googleAdsSource);
    this.campaignSources.set(socialMediaSource.id, socialMediaSource);

    // Sample tags
    const hotLeadTag: Tag = {
      id: randomUUID(),
      name: "Hot Lead",
      color: "#ef4444",
      createdAt: new Date()
    };
    const corporateTag: Tag = {
      id: randomUUID(),
      name: "Corporate",
      color: "#3b82f6",
      createdAt: new Date()
    };
    const weddingTag: Tag = {
      id: randomUUID(),
      name: "Wedding",
      color: "#ec4899",
      createdAt: new Date()
    };

    this.tags.set(hotLeadTag.id, hotLeadTag);
    this.tags.set(corporateTag.id, corporateTag);
    this.tags.set(weddingTag.id, weddingTag);

    // Sample leads
    const sampleLead1: Lead = {
      id: randomUUID(),
      venueId: Array.from(this.venues.keys())[0] || null,
      firstName: "Emma",
      lastName: "Wilson",
      email: "emma.wilson@techcorp.com",
      phone: "(555) 234-5678",
      eventType: "corporate",
      guestCount: 150,
      dateStart: new Date("2025-09-15"),
      dateEnd: new Date("2025-09-15"),
      budgetMin: 8000,
      budgetMax: 12000,
      preferredContact: "email",
      notes: "Looking for corporate annual meeting venue with AV capabilities",
      status: "NEW",
      sourceId: websiteSource.id,
      utmSource: "google",
      utmMedium: "organic",
      utmCampaign: null,
      consentEmail: true,
      consentSms: false,
      convertedCustomerId: null,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    };

    const sampleLead2: Lead = {
      id: randomUUID(),
      venueId: Array.from(this.venues.keys())[0] || null,
      firstName: "Michael",
      lastName: "Chen",
      email: "michael.chen@gmail.com",
      phone: "(555) 345-6789",
      eventType: "wedding",
      guestCount: 80,
      dateStart: new Date("2025-10-20"),
      dateEnd: new Date("2025-10-20"),
      budgetMin: 15000,
      budgetMax: 25000,
      preferredContact: "phone",
      notes: "Intimate wedding ceremony and reception",
      status: "CONTACTED",
      sourceId: socialMediaSource.id,
      utmSource: "facebook",
      utmMedium: "social",
      utmCampaign: "wedding-promo",
      consentEmail: true,
      consentSms: true,
      convertedCustomerId: null,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
    };

    this.leads.set(sampleLead1.id, sampleLead1);
    this.leads.set(sampleLead2.id, sampleLead2);

    // Sample lead activities
    const activity1: LeadActivity = {
      id: randomUUID(),
      leadId: sampleLead1.id,
      type: "NOTE",
      body: "Lead submitted inquiry through website contact form",
      meta: { source: "website_form" },
      createdBy: null,
      createdAt: sampleLead1.createdAt
    };

    const activity2: LeadActivity = {
      id: randomUUID(),
      leadId: sampleLead2.id,
      type: "EMAIL",
      body: "Initial follow-up email sent",
      meta: { template: "initial_followup", email_sent: true },
      createdBy: null,
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
    };

    this.leadActivities.set(activity1.id, activity1);
    this.leadActivities.set(activity2.id, activity2);

    // Sample lead tasks
    const task1: LeadTask = {
      id: randomUUID(),
      leadId: sampleLead1.id,
      title: "Call potential client",
      description: "Follow up on venue inquiry for corporate event",
      dueAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      assignedTo: null,
      status: "OPEN",
      createdAt: new Date()
    };

    const task2: LeadTask = {
      id: randomUUID(),
      leadId: sampleLead2.id,
      title: "Send proposal",
      description: "Prepare and send wedding package proposal",
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      assignedTo: null,
      status: "OPEN",
      createdAt: new Date()
    };

    this.leadTasks.set(task1.id, task1);
    this.leadTasks.set(task2.id, task2);

    // Add some lead tags
    this.leadTags.add(`${sampleLead1.id}:${corporateTag.id}`);
    this.leadTags.add(`${sampleLead2.id}:${weddingTag.id}`);
    this.leadTags.add(`${sampleLead2.id}:${hotLeadTag.id}`);
  }

  // Campaign Sources implementation
  async getCampaignSources(): Promise<CampaignSource[]> {
    return Array.from(this.campaignSources.values());
  }

  async createCampaignSource(source: InsertCampaignSource): Promise<CampaignSource> {
    const newSource: CampaignSource = {
      id: randomUUID(),
      ...source,
      createdAt: new Date(),
    };
    this.campaignSources.set(newSource.id, newSource);
    return newSource;
  }

  async updateCampaignSource(id: string, source: Partial<InsertCampaignSource>): Promise<CampaignSource | undefined> {
    const existing = this.campaignSources.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...source };
    this.campaignSources.set(id, updated);
    return updated;
  }

  // Tags implementation
  async getTags(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const newTag: Tag = {
      id: randomUUID(),
      ...tag,
      createdAt: new Date(),
    };
    this.tags.set(newTag.id, newTag);
    return newTag;
  }

  async updateTag(id: string, tag: Partial<InsertTag>): Promise<Tag | undefined> {
    const existing = this.tags.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...tag };
    this.tags.set(id, updated);
    return updated;
  }

  async deleteTag(id: string): Promise<boolean> {
    // Remove all lead-tag associations for this tag
    const toRemove = Array.from(this.leadTags).filter(combo => combo.endsWith(`:${id}`));
    toRemove.forEach(combo => this.leadTags.delete(combo));
    
    return this.tags.delete(id);
  }

  // Leads implementation
  async getLeads(filters?: { status?: string; source?: string; q?: string }): Promise<Lead[]> {
    let leads = Array.from(this.leads.values());
    
    if (filters?.status) {
      leads = leads.filter(lead => lead.status === filters.status);
    }
    
    if (filters?.source) {
      leads = leads.filter(lead => lead.sourceId === filters.source);
    }
    
    if (filters?.q) {
      const query = filters.q.toLowerCase();
      leads = leads.filter(lead => 
        lead.firstName.toLowerCase().includes(query) ||
        lead.lastName.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.eventType.toLowerCase().includes(query) ||
        (lead.notes && lead.notes.toLowerCase().includes(query))
      );
    }
    
    return leads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getLead(id: string): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const newLead: Lead = {
      id: randomUUID(),
      ...lead,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.leads.set(newLead.id, newLead);
    return newLead;
  }

  async updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const existing = this.leads.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...lead, updatedAt: new Date() };
    this.leads.set(id, updated);
    return updated;
  }

  async deleteLead(id: string): Promise<boolean> {
    // Remove all activities, tasks, and tag associations for this lead
    const activitiesToRemove = Array.from(this.leadActivities.values()).filter(a => a.leadId === id);
    activitiesToRemove.forEach(activity => this.leadActivities.delete(activity.id));
    
    const tasksToRemove = Array.from(this.leadTasks.values()).filter(t => t.leadId === id);
    tasksToRemove.forEach(task => this.leadTasks.delete(task.id));
    
    const tagsToRemove = Array.from(this.leadTags).filter(combo => combo.startsWith(`${id}:`));
    tagsToRemove.forEach(combo => this.leadTags.delete(combo));
    
    return this.leads.delete(id);
  }

  // Lead Activities implementation
  async getLeadActivities(leadId: string): Promise<LeadActivity[]> {
    return Array.from(this.leadActivities.values())
      .filter(activity => activity.leadId === leadId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createLeadActivity(activity: InsertLeadActivity): Promise<LeadActivity> {
    const newActivity: LeadActivity = {
      id: randomUUID(),
      ...activity,
      createdAt: new Date(),
    };
    this.leadActivities.set(newActivity.id, newActivity);
    return newActivity;
  }

  // Lead Tasks implementation
  async getLeadTasks(filters?: { assignee?: string; due?: string }): Promise<LeadTask[]> {
    let tasks = Array.from(this.leadTasks.values());
    
    if (filters?.assignee) {
      tasks = tasks.filter(task => task.assignedTo === filters.assignee);
    }
    
    if (filters?.due) {
      const dueDate = new Date(filters.due);
      tasks = tasks.filter(task => 
        task.dueAt && task.dueAt.toDateString() === dueDate.toDateString()
      );
    }
    
    return tasks.sort((a, b) => {
      if (!a.dueAt && !b.dueAt) return 0;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return a.dueAt.getTime() - b.dueAt.getTime();
    });
  }

  async createLeadTask(task: InsertLeadTask): Promise<LeadTask> {
    const newTask: LeadTask = {
      id: randomUUID(),
      ...task,
      createdAt: new Date(),
    };
    this.leadTasks.set(newTask.id, newTask);
    return newTask;
  }

  async updateLeadTask(id: string, task: Partial<InsertLeadTask>): Promise<LeadTask | undefined> {
    const existing = this.leadTasks.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...task };
    this.leadTasks.set(id, updated);
    return updated;
  }

  // Tours implementation
  async getTours(): Promise<Tour[]> {
    return Array.from(this.tours.values()).sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }

  async getTour(id: string): Promise<Tour | undefined> {
    return this.tours.get(id);
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const newTour: Tour = {
      id: randomUUID(),
      ...tour,
      createdAt: new Date(),
    };
    this.tours.set(newTour.id, newTour);
    return newTour;
  }

  async updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour | undefined> {
    const existing = this.tours.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...tour };
    this.tours.set(id, updated);
    return updated;
  }

  // Lead Tags (many-to-many) implementation
  async getLeadTags(leadId: string): Promise<Tag[]> {
    const tagIds = Array.from(this.leadTags)
      .filter(combo => combo.startsWith(`${leadId}:`))
      .map(combo => combo.split(':')[1]);
    
    return tagIds.map(tagId => this.tags.get(tagId)).filter(Boolean) as Tag[];
  }

  async addLeadTag(leadId: string, tagId: string): Promise<void> {
    this.leadTags.add(`${leadId}:${tagId}`);
  }

  async removeLeadTag(leadId: string, tagId: string): Promise<void> {
    this.leadTags.delete(`${leadId}:${tagId}`);
  }

  // Audit Logging implementation
  async getAuditLogs(filters?: { 
    userId?: string; 
    action?: string; 
    resourceType?: string; 
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values());
    
    // Apply filters
    if (filters?.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    if (filters?.action) {
      logs = logs.filter(log => log.action.includes(filters.action));
    }
    if (filters?.resourceType) {
      logs = logs.filter(log => log.resourceType === filters.resourceType);
    }
    if (filters?.severity) {
      logs = logs.filter(log => log.severity === filters.severity);
    }
    if (filters?.startDate) {
      logs = logs.filter(log => log.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      logs = logs.filter(log => log.createdAt <= filters.endDate!);
    }
    
    // Sort by most recent first
    logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Apply pagination
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 100;
    return logs.slice(offset, offset + limit);
  }

  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const newLog: AuditLog = {
      id: randomUUID(),
      createdAt: new Date(),
      severity: 'INFO',
      ...auditLog,
    };
    this.auditLogs.set(newLog.id, newLog);
    return newLog;
  }

  async getAuditLogStats(): Promise<{
    totalLogs: number;
    recentActions: number;
    errorCount: number;
    topUsers: Array<{ userId: string; count: number; userName?: string }>;
    topActions: Array<{ action: string; count: number }>;
  }> {
    const logs = Array.from(this.auditLogs.values());
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentLogs = logs.filter(log => log.createdAt >= oneDayAgo);
    const errorLogs = logs.filter(log => log.severity === 'ERROR');
    
    // Calculate top users
    const userCounts = new Map<string, number>();
    logs.forEach(log => {
      if (log.userId) {
        userCounts.set(log.userId, (userCounts.get(log.userId) || 0) + 1);
      }
    });
    
    const topUsers = Array.from(userCounts.entries())
      .map(([userId, count]) => {
        const user = this.users.get(userId);
        return { 
          userId, 
          count, 
          userName: user?.username || user?.email || 'Unknown User'
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Calculate top actions
    const actionCounts = new Map<string, number>();
    logs.forEach(log => {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
    });
    
    const topActions = Array.from(actionCounts.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalLogs: logs.length,
      recentActions: recentLogs.length,
      errorCount: errorLogs.length,
      topUsers,
      topActions
    };
  }


}

export const storage = new MemStorage();
